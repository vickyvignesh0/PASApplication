using System;
using System.Threading.Tasks;

namespace Pas.MpiService.Application;

public interface IPatientService
{
    Task<Guid> RegisterPatientAsync(string firstName, string lastName, DateTime dateOfBirth, string? nhsNumber, string? chiNumber, string? ihiNumber, string gpCode, string addressLine1, string postcode);
    Task<Guid> AdmitPatientAsync(Guid patientId, string wardCode, string bedNumber, string admittingConsultant, string infectionControlAlerts);
    Task TransferPatientAsync(Guid admissionId, Guid patientId, string toWardCode, string toBedNumber);
    Task DischargePatientAsync(Guid admissionId, Guid patientId, string dischargeSummary, string clinicalCodingCode);
}
