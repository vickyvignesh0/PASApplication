using Marten;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pas.MpiService.Models;

namespace Pas.MpiService.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ClinicalController : ControllerBase
{
    private readonly IDocumentStore _documentStore;
    private readonly ILogger<ClinicalController> _logger;

    public ClinicalController(IDocumentStore documentStore, ILogger<ClinicalController> logger)
    {
        _documentStore = documentStore;
        _logger = logger;
    }

    #region Referrals & Waiting List

    [HttpPost("referrals")]
    public async Task<IActionResult> CreateReferral([FromBody] CreateReferralRequest request)
    {
        using var session = _documentStore.LightweightSession();

        var referral = new Referral
        {
            PatientId = request.PatientId,
            PatientName = request.PatientName,
            ReferralSource = request.ReferralSource,
            Specialty = request.Specialty,
            Pathway = request.Pathway,
            Priority = request.Priority,
            ClinicalIndication = request.ClinicalIndication,
            ReferralDate = DateTime.UtcNow,
            Status = ReferralStatus.Pending
        };

        session.Store(referral);

        // Automatically create a waiting list entry for tracking the NHS 18-week RTT pathway
        var waitListEntry = new WaitingListEntry
        {
            ReferralId = referral.Id,
            PatientId = request.PatientId,
            PatientName = request.PatientName,
            Specialty = request.Specialty,
            Pathway = request.Pathway,
            DateAdded = DateTime.UtcNow,
            Status = "Waiting"
        };

        session.Store(waitListEntry);
        await session.SaveChangesAsync();

        _logger.LogInformation("Referral {ReferralId} created and Waitlist Entry generated for Patient {PatientId} (Pathway: {Pathway})", 
            referral.Id, request.PatientId, request.Pathway);

        return Ok(new { ReferralId = referral.Id, WaitingListId = waitListEntry.Id, Message = "Referral registered on Waiting List." });
    }

    [HttpGet("waitinglist")]
    public async Task<IActionResult> GetWaitingList([FromQuery] PathwayType? pathway)
    {
        using var session = _documentStore.QuerySession();
        var query = session.Query<WaitingListEntry>().Where(x => x.Status == "Waiting");

        if (pathway.HasValue)
        {
            query = query.Where(x => x.Pathway == pathway.Value);
        }

        var list = await query.ToListAsync();
        return Ok(list);
    }

    #endregion

    #region Appointment & Inpatient Booking

    [HttpPost("bookings")]
    public async Task<IActionResult> BookAppointment([FromBody] BookAppointmentRequest request)
    {
        using var session = _documentStore.LightweightSession();

        var booking = new Booking
        {
            PatientId = request.PatientId,
            PatientName = request.PatientName,
            AppointmentDate = request.AppointmentDate,
            Type = request.Type,
            ClinicNameOrWard = request.ClinicNameOrWard,
            ClinicianName = request.ClinicianName,
            Status = "Scheduled"
        };

        // If booking is related to a waitlist entry, mark waitlist entry as scheduled
        if (request.WaitingListEntryId.HasValue)
        {
            var entry = await session.LoadAsync<WaitingListEntry>(request.WaitingListEntryId.Value);
            if (entry != null)
            {
                entry.Status = "Scheduled";
                session.Store(entry);
            }
        }

        session.Store(booking);
        await session.SaveChangesAsync();

        _logger.LogInformation("Booking {BookingId} scheduled for Patient {PatientId} (Type: {Type})", 
            booking.Id, request.PatientId, request.Type);

        return Ok(new { BookingId = booking.Id, Message = "Appointment booked successfully." });
    }

    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookings()
    {
        using var session = _documentStore.QuerySession();
        var list = await session.Query<Booking>().OrderBy(x => x.AppointmentDate).ToListAsync();
        return Ok(list);
    }

    #endregion

    #region Emergency Care

    [HttpPost("emergency/attend")]
    public async Task<IActionResult> LogEmergencyArrival([FromBody] EmergencyArrivalRequest request)
    {
        using var session = _documentStore.LightweightSession();

        var attendance = new EmergencyAttendance
        {
            PatientId = request.PatientId,
            PatientName = request.PatientName,
            ArrivalTime = DateTime.UtcNow,
            ChiefComplaint = request.ChiefComplaint,
            Status = AttendanceStatus.AwaitingTriage,
            Triage = TriageCategory.Standard // default standard triage
        };

        session.Store(attendance);
        await session.SaveChangesAsync();

        _logger.LogInformation("Emergency attendance {AttendanceId} logged for Patient {PatientId}", attendance.Id, request.PatientId);

        return Ok(new { AttendanceId = attendance.Id, Message = "ED Arrival registered." });
    }

    [HttpPost("emergency/triage")]
    public async Task<IActionResult> TriageEmergencyPatient([FromBody] EmergencyTriageRequest request)
    {
        using var session = _documentStore.LightweightSession();

        var attendance = await session.LoadAsync<EmergencyAttendance>(request.AttendanceId);
        if (attendance == null)
            return NotFound("Emergency attendance record not found.");

        attendance.Triage = request.Triage;
        attendance.TriageNotes = request.TriageNotes;
        attendance.Status = AttendanceStatus.WaitingForTreatment;
        attendance.TriageCompletedAt = DateTime.UtcNow;

        session.Store(attendance);
        await session.SaveChangesAsync();

        _logger.LogInformation("Emergency attendance {AttendanceId} triaged as Category {Triage}", attendance.Id, request.Triage);

        return Ok(new { Message = "ED Triage complete." });
    }

    [HttpGet("emergency/active")]
    public async Task<IActionResult> GetActiveEmergencyBoard()
    {
        using var session = _documentStore.QuerySession();
        
        // Active patients currently in ED (not yet discharged or admitted to inpatient ward)
        var list = await session.Query<EmergencyAttendance>()
            .Where(x => x.Status != AttendanceStatus.Discharged && x.Status != AttendanceStatus.AdmittedToWard)
            .OrderBy(x => (int)x.Triage) // Highest urgency (1 - Immediate) first
            .ToListAsync();

        return Ok(list);
    }

    #endregion

    #region Clinical Case Notes & Documents

    [HttpPost("documents")]
    public async Task<IActionResult> SaveClinicalDocument([FromBody] SaveDocumentRequest request)
    {
        using var session = _documentStore.LightweightSession();

        var document = new ClinicalDocument
        {
            PatientId = request.PatientId,
            Title = request.Title,
            DocumentType = request.DocumentType,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
            Author = User.Identity?.Name ?? "Unknown Clinician"
        };

        session.Store(document);
        await session.SaveChangesAsync();

        _logger.LogInformation("Clinical document {DocId} ({DocType}) saved for Patient {PatientId}", 
            document.Id, request.DocumentType, request.PatientId);

        return Ok(new { DocumentId = document.Id, Message = "Clinical Document saved." });
    }

    [HttpGet("documents/patient/{patientId}")]
    public async Task<IActionResult> GetPatientDocuments(Guid patientId)
    {
        using var session = _documentStore.QuerySession();
        
        var docs = await session.Query<ClinicalDocument>()
            .Where(x => x.PatientId == patientId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(docs);
    }

    #endregion
}

public record CreateReferralRequest(
    Guid PatientId,
    string PatientName,
    string ReferralSource,
    string Specialty,
    PathwayType Pathway,
    ReferralPriority Priority,
    string ClinicalIndication
);

public record BookAppointmentRequest(
    Guid PatientId,
    string PatientName,
    DateTime AppointmentDate,
    BookingType Type,
    string ClinicNameOrWard,
    string ClinicianName,
    Guid? WaitingListEntryId
);

public record EmergencyArrivalRequest(
    Guid PatientId,
    string PatientName,
    string ChiefComplaint
);

public record EmergencyTriageRequest(
    Guid AttendanceId,
    TriageCategory Triage,
    string TriageNotes
);

public record SaveDocumentRequest(
    Guid PatientId,
    string Title,
    string DocumentType,
    string Content
);
