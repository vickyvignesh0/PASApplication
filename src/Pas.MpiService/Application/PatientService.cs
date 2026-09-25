using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Marten;
using MassTransit;
using Microsoft.Extensions.Logging;
using Pas.Shared;

namespace Pas.MpiService.Application;

public class PatientService : IPatientService
{
    private readonly IDocumentStore _documentStore;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly IEnumerable<INationalIdentifierValidator> _validators;
    private readonly ILogger<PatientService> _logger;

    public PatientService(
        IDocumentStore documentStore,
        IPublishEndpoint publishEndpoint,
        IEnumerable<INationalIdentifierValidator> validators,
        ILogger<PatientService> logger)
    {
        _documentStore = documentStore;
        _publishEndpoint = publishEndpoint;
        _validators = validators;
        _logger = logger;
    }

    public async Task<Guid> RegisterPatientAsync(
        string firstName,
        string lastName,
        DateTime dateOfBirth,
        string? nhsNumber,
        string? chiNumber,
        string? ihiNumber,
        string gpCode,
        string addressLine1,
        string postcode)
    {
        // Polymorphic validation (OCP - Open/Closed Principle)
        ValidateIdentifier("NHS", nhsNumber);
        ValidateIdentifier("CHI", chiNumber);
        ValidateIdentifier("IHI", ihiNumber);

        if (string.IsNullOrWhiteSpace(nhsNumber) && 
            string.IsNullOrWhiteSpace(chiNumber) && 
            string.IsNullOrWhiteSpace(ihiNumber))
        {
            throw new ArgumentException("Patient must be registered with at least one national health identifier (NHS, CHI, or IHI).");
        }

        var patientId = Guid.NewGuid();

        using var session = _documentStore.LightweightSession();
        var @event = new PatientRegisteredEvent(
            patientId,
            firstName,
            lastName,
            dateOfBirth,
            nhsNumber,
            chiNumber,
            ihiNumber,
            gpCode,
            addressLine1,
            postcode
        );

        session.Events.StartStream<Patient>(patientId, @event);
        await session.SaveChangesAsync();

        await _publishEndpoint.Publish(@event);

        _logger.LogInformation("Patient {PatientId} registered successfully with identifier", patientId);

        return patientId;
    }

    public async Task<Guid> AdmitPatientAsync(
        Guid patientId,
        string wardCode,
        string bedNumber,
        string admittingConsultant,
        string infectionControlAlerts)
    {
        using var session = _documentStore.LightweightSession();

        var patient = await session.Events.AggregateStreamAsync<Patient>(patientId);
        if (patient == null)
            throw new KeyNotFoundException("Patient not found.");

        if (patient.IsAdmitted)
            throw new InvalidOperationException($"Patient is already admitted to ward {patient.CurrentWard}.");

        var admissionId = Guid.NewGuid();
        var @event = new PatientAdmittedEvent(
            admissionId,
            patientId,
            wardCode,
            bedNumber,
            admittingConsultant,
            DateTime.UtcNow,
            infectionControlAlerts
        );

        session.Events.Append(patientId, @event);
        await session.SaveChangesAsync();

        await _publishEndpoint.Publish(@event);

        _logger.LogInformation("Patient {PatientId} admitted to ward {Ward} bed {Bed}", patientId, wardCode, bedNumber);

        return admissionId;
    }

    public async Task TransferPatientAsync(Guid admissionId, Guid patientId, string toWardCode, string toBedNumber)
    {
        using var session = _documentStore.LightweightSession();
        var patient = await session.Events.AggregateStreamAsync<Patient>(patientId);
        if (patient == null)
            throw new KeyNotFoundException("Patient not found.");

        if (!patient.IsAdmitted)
            throw new InvalidOperationException("Patient is not currently admitted.");

        var @event = new PatientTransferredEvent(
            admissionId,
            patientId,
            patient.CurrentWard,
            toWardCode,
            patient.CurrentBed,
            toBedNumber,
            DateTime.UtcNow
        );

        session.Events.Append(patientId, @event);
        await session.SaveChangesAsync();

        await _publishEndpoint.Publish(@event);

        _logger.LogInformation("Patient {PatientId} transferred from {FromWard} to {ToWard}", patientId, patient.CurrentWard, toWardCode);
    }

    public async Task DischargePatientAsync(Guid admissionId, Guid patientId, string dischargeSummary, string clinicalCodingCode)
    {
        using var session = _documentStore.LightweightSession();
        var patient = await session.Events.AggregateStreamAsync<Patient>(patientId);
        if (patient == null)
            throw new KeyNotFoundException("Patient not found.");

        if (!patient.IsAdmitted)
            throw new InvalidOperationException("Patient is not currently admitted.");

        var @event = new PatientDischargedEvent(
            admissionId,
            patientId,
            DateTime.UtcNow,
            dischargeSummary,
            clinicalCodingCode
        );

        session.Events.Append(patientId, @event);
        await session.SaveChangesAsync();

        await _publishEndpoint.Publish(@event);

        _logger.LogInformation("Patient {PatientId} discharged from system", patientId);
    }

    private void ValidateIdentifier(string typeName, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        var validator = _validators.FirstOrDefault(v => v.IdentifierName.Equals(typeName, StringComparison.OrdinalIgnoreCase));
        if (validator == null)
        {
            throw new InvalidOperationException($"No validator found for identifier type: {typeName}");
        }

        if (!validator.Validate(value))
        {
            throw new ArgumentException($"Invalid {typeName} Number checksum or format.");
        }
    }
}
