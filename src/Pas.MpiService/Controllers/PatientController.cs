using Marten;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pas.MpiService.Application;

namespace Pas.MpiService.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PatientController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly IDocumentStore _documentStore;
    private readonly ILogger<PatientController> _logger;

    public PatientController(IPatientService patientService, IDocumentStore documentStore, ILogger<PatientController> logger)
    {
        _patientService = patientService;
        _documentStore = documentStore;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterPatient([FromBody] RegisterPatientRequest request)
    {
        try
        {
            var patientId = await _patientService.RegisterPatientAsync(
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

            return Ok(new { PatientId = patientId, Message = "Patient registered and event published." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("admit")]
    public async Task<IActionResult> AdmitPatient([FromBody] AdmitPatientRequest request)
    {
        try
        {
            var admissionId = await _patientService.AdmitPatientAsync(
                request.PatientId,
                request.WardCode,
                request.BedNumber,
                request.AdmittingConsultant,
                request.InfectionControlAlerts
            );

            return Ok(new { AdmissionId = admissionId, Message = "Patient admission recorded." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> TransferPatient([FromBody] TransferPatientRequest request)
    {
        try
        {
            await _patientService.TransferPatientAsync(
                request.AdmissionId,
                request.PatientId,
                request.ToWardCode,
                request.ToBedNumber
            );

            return Ok(new { Message = "Patient transfer recorded." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("discharge")]
    public async Task<IActionResult> DischargePatient([FromBody] DischargePatientRequest request)
    {
        try
        {
            await _patientService.DischargePatientAsync(
                request.AdmissionId,
                request.PatientId,
                request.DischargeSummary,
                request.ClinicalCodingCode
            );

            return Ok(new { Message = "Patient discharge recorded." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPatient(Guid id)
    {
        using var session = _documentStore.QuerySession();
        // Aggregate state dynamically by replaying events (CQRS Read)
        var patient = await session.Events.AggregateStreamAsync<Patient>(id);
        if (patient == null)
            return NotFound();

        return Ok(patient);
    }

    [HttpGet("bedboard")]
    public async Task<IActionResult> GetBedBoard()
    {
        using var session = _documentStore.QuerySession();
        
        // Querying the read model projection table maintained by Marten (CQRS Read)
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
