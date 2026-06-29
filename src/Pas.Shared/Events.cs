namespace Pas.Shared;

public record PatientRegisteredEvent(
    Guid PatientId,
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

public record PatientAdmittedEvent(
    Guid AdmissionId,
    Guid PatientId,
    string WardCode,
    string BedNumber,
    string AdmittingConsultant,
    DateTime AdmittedAt,
    string InfectionControlAlerts
);

public record PatientTransferredEvent(
    Guid AdmissionId,
    Guid PatientId,
    string FromWardCode,
    string ToWardCode,
    string FromBedNumber,
    string ToBedNumber,
    DateTime TransferredAt
);

public record PatientDischargedEvent(
    Guid AdmissionId,
    Guid PatientId,
    DateTime DischargedAt,
    string DischargeSummary,
    string ClinicalCodingCode // ICD-11 / SNOMED CT
);
