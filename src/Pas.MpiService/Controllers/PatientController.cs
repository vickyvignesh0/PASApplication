using Marten;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pas.Shared;

namespace Pas.MpiService.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PatientController : ControllerBase
{
    private readonly IDocumentStore _documentStore;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<PatientController> _logger;

    public PatientController(IDocumentStore documentStore, IPublishEndpoint publishEndpoint, ILogger<PatientController> logger)
    {
        _documentStore = documentStore;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterPatient([FromBody] RegisterPatientRequest request)
    {
        // 1. Identify & Validate National Identifiers
        if (!string.IsNullOrWhiteSpace(request.NhsNumber) && !NhsNumberValidator.Validate(request.NhsNumber))
        {
            return BadRequest("Invalid UK NHS Number checksum (Modulus 11).");
        }

        if (!string.IsNullOrWhiteSpace(request.ChiNumber) && !ChiNumberValidator.Validate(request.ChiNumber))
        {
            return BadRequest("Invalid Scottish CHI Number (invalid date or checksum).");
        }

        if (!string.IsNullOrWhiteSpace(request.IhiNumber) && !IhiNumberValidator.Validate(request.IhiNumber))
        {
            return BadRequest("Invalid Irish IHI Number format or checksum.");
        }

        if (string.IsNullOrWhiteSpace(request.NhsNumber) && 
            string.IsNullOrWhiteSpace(request.ChiNumber) && 
            string.IsNullOrWhiteSpace(request.IhiNumber))
        {
            return BadRequest("Patient must be registered with at least one national health identifier (NHS, CHI, or IHI).");
        }

        var patientId = Guid.NewGuid();

        // 2. Write to Event Store (Marten)
        using var session = _documentStore.LightweightSession();
        var @event = new PatientRegisteredEvent(
            patientId,
            request.FirstName,
            request.LastName,
            request.DateOfBirth,
            request.NhsNumber,
            request.ChiNumber,
            request.IhiNumber,
            request.GpCode,
            request.AddressLine1,
            request.Postcode
        );

        // Start a new event stream for this patient
        session.Events.StartStream<Patient>(patientId, @event);
        await session.SaveChangesAsync();

        // 3. Publish to Event Bus (MassTransit)
        await _publishEndpoint.Publish(@event);

        _logger.LogInformation("Patient {PatientId} registered successfully with identifier", patientId);

        return Ok(new { PatientId = patientId, Message = "Patient registered and event published." });
    }

    [HttpPost("admit")]
    public async Task<IActionResult> AdmitPatient([FromBody] AdmitPatientRequest request)
    {
        using var session = _documentStore.LightweightSession();
        
        // Load aggregate state to check if patient exists and isn't already admitted
        var patient = await session.Events.AggregateStreamAsync<Patient>(request.PatientId);
        if (patient == null)
            return NotFound("Patient not found.");

        if (patient.IsAdmitted)
            return BadRequest($"Patient is already admitted to ward {patient.CurrentWard}.");

        var admissionId = Guid.NewGuid();
        var @event = new PatientAdmittedEvent(
            admissionId,
            request.PatientId,
            request.WardCode,
            request.BedNumber,
            request.AdmittingConsultant,
            DateTime.UtcNow,
            request.InfectionControlAlerts
        );

        // Append to existing patient stream
        session.Events.Append(request.PatientId, @event);
        await session.SaveChangesAsync();

        // Publish event to other services (Catering, Billing, Pharmacy)
        await _publishEndpoint.Publish(@event);

        _logger.LogInformation("Patient {PatientId} admitted to ward {Ward} bed {Bed}", request.PatientId, request.WardCode, request.BedNumber);

        return Ok(new { AdmissionId = admissionId, Message = "Patient admission recorded." });
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> TransferPatient([FromBody] TransferPatientRequest request)
    {
        using var session = _documentStore.LightweightSession();
        var patient = await session.Events.AggregateStreamAsync<Patient>(request.PatientId);
        if (patient == null)
            return NotFound("Patient not found.");

        if (!patient.IsAdmitted)
            return BadRequest("Patient is not currently admitted.");

        var @event = new PatientTransferredEvent(
            request.AdmissionId,
            request.PatientId,
            patient.CurrentWard,
            request.ToWardCode,
            patient.CurrentBed,
            request.ToBedNumber,
            DateTime.UtcNow
        );

        session.Events.Append(request.PatientId, @event);
        await session.SaveChangesAsync();

        await _publishEndpoint.Publish(@event);

        _logger.LogInformation("Patient {PatientId} transferred from {FromWard} to {ToWard}", request.PatientId, patient.CurrentWard, request.ToWardCode);

        return Ok(new { Message = "Patient transfer recorded." });
    }

    [HttpPost("discharge")]
    public async Task<IActionResult> DischargePatient([FromBody] DischargePatientRequest request)
    {
        using var session = _documentStore.LightweightSession();
        var patient = await session.Events.AggregateStreamAsync<Patient>(request.PatientId);
        if (patient == null)
            return NotFound("Patient not found.");

        if (!patient.IsAdmitted)
            return BadRequest("Patient is not currently admitted.");

        var @event = new PatientDischargedEvent(
            request.AdmissionId,
            request.PatientId,
            DateTime.UtcNow,
            request.DischargeSummary,
            request.ClinicalCodingCode
        );

        session.Events.Append(request.PatientId, @event);
        await session.SaveChangesAsync();

        await _publishEndpoint.Publish(@event);

        _logger.LogInformation("Patient {PatientId} discharged from system", request.PatientId);

        return Ok(new { Message = "Patient discharge recorded." });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPatient(Guid id)
    {
        using var session = _documentStore.LightweightSession();
        // Aggregate state dynamically by replaying events
        var patient = await session.Events.AggregateStreamAsync<Patient>(id);
        if (patient == null)
            return NotFound();

        return Ok(patient);
    }

    [HttpGet("bedboard")]
    public async Task<IActionResult> GetBedBoard()
    {
        using var session = _documentStore.QuerySession();
        
        // Querying the read model projection table maintained by Marten
        var admittedPatients = await session.Query<Patient>()
            .Where(x => x.IsAdmitted)
            .ToListAsync();

        return Ok(admittedPatients);
    }

    [HttpGet("{id}/timeline")]
    public async Task<IActionResult> GetPatientTimeline(Guid id)
    {
        using var session = _documentStore.QuerySession();
        
        // Fetch all raw events in the patient's stream to display a chronological audit trail
        var events = await session.Events.FetchStreamAsync(id);
        if (events == null || !events.Any())
            return NotFound("No clinical events found for this patient.");

        var timeline = events.Select(e => new
        {
            e.Version,
            e.Timestamp,
            EventType = e.EventTypeName,
            Data = e.Data
        });

        return Ok(timeline);
    }
}

public record RegisterPatientRequest(
    string FirstName,
    string LastName,
    DateTime DateOfBirth,
    string? NhsNumber,
    string? ChiNumber,
    string? IhiNumber,
    string GpCode,
    string AddressLine1,
    string Postcode
);

public record AdmitPatientRequest(
    Guid PatientId,
    string WardCode,
    string BedNumber,
    string AdmittingConsultant,
    string InfectionControlAlerts
);

public record TransferPatientRequest(
    Guid AdmissionId,
    Guid PatientId,
    string ToWardCode,
    string ToBedNumber
);

public record DischargePatientRequest(
    Guid AdmissionId,
    Guid PatientId,
    string DischargeSummary,
    string ClinicalCodingCode
);
