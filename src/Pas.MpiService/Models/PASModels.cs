using System;

namespace Pas.MpiService.Models;

public enum PathwayType
{
    Inpatient,   // IP Referral (Requires Bed Management / Admission)
    Outpatient   // OP Referral (Requires Clinic templates / Consultation)
}

public enum ReferralPriority
{
    Routine,
    Urgent,
    TwoWeekWait  // 2WW (NHS Cancer pathway target)
}

public enum ReferralStatus
{
    Pending,
    Accepted,
    Rejected,
    Booked,
    Completed
}

public enum BookingType
{
    InpatientAdmission, // IP Booking
    OutpatientClinic     // OP Booking
}

public enum TriageCategory
{
    Immediate = 1,     // Red (Resuscitation)
    VeryUrgent = 2,    // Orange
    Urgent = 3,        // Yellow
    Standard = 4,      // Green
    NonUrgent = 5      // Blue
}

public enum AttendanceStatus
{
    AwaitingTriage,
    WaitingForTreatment,
    UnderTreatment,
    Discharged,
    AdmittedToWard
}

public class Referral
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string ReferralSource { get; set; } = "GP";
    public string Specialty { get; set; } = "General Medicine";
    public PathwayType Pathway { get; set; } = PathwayType.Outpatient;
    public ReferralPriority Priority { get; set; } = ReferralPriority.Routine;
    public DateTime ReferralDate { get; set; } = DateTime.UtcNow;
    public ReferralStatus Status { get; set; } = ReferralStatus.Pending;
    public string ClinicalIndication { get; set; } = string.Empty;
}

public class WaitingListEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReferralId { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string Specialty { get; set; } = "General Medicine";
    public PathwayType Pathway { get; set; } = PathwayType.Outpatient;
    public DateTime DateAdded { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Waiting"; // "Waiting", "Scheduled", "Removed"
}

public class Booking
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public BookingType Type { get; set; } = BookingType.OutpatientClinic;
    public string ClinicNameOrWard { get; set; } = string.Empty;
    public string ClinicianName { get; set; } = string.Empty;
    public string Status { get; set; } = "Scheduled"; // "Scheduled", "Attended", "DNA", "Cancelled"
}

public class EmergencyAttendance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public DateTime ArrivalTime { get; set; } = DateTime.UtcNow;
    public TriageCategory Triage { get; set; } = TriageCategory.Standard;
    public string ChiefComplaint { get; set; } = string.Empty;
    public string TriageNotes { get; set; } = string.Empty;
    public AttendanceStatus Status { get; set; } = AttendanceStatus.AwaitingTriage;
    public DateTime? TriageCompletedAt { get; set; }
}

public class ClinicalDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string DocumentType { get; set; } = "ClinicalNote"; // "DischargeSummary", "ReferralLetter", "ClinicalNote"
    public string Content { get; set; } = string.Empty; // Markdown or text case note
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Author { get; set; } = string.Empty;
}
