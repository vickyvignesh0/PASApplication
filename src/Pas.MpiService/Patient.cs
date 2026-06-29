using Pas.Shared;

namespace Pas.MpiService;

public class Patient
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? NhsNumber { get; set; }
    public string? ChiNumber { get; set; }
    public string? IhiNumber { get; set; }
    public string CurrentWard { get; set; } = string.Empty;
    public string CurrentBed { get; set; } = string.Empty;
    public bool IsAdmitted { get; set; }
    public DateTime? AdmittedAt { get; set; }

    // Marten event sourcing applies these methods by convention
    public void Apply(PatientRegisteredEvent @event)
    {
        Id = @event.PatientId;
        FirstName = @event.FirstName;
        LastName = @event.LastName;
        DateOfBirth = @event.DateOfBirth;
        NhsNumber = @event.NhsNumber;
        ChiNumber = @event.ChiNumber;
        IhiNumber = @event.IhiNumber;
    }

    public void Apply(PatientAdmittedEvent @event)
    {
        CurrentWard = @event.WardCode;
        CurrentBed = @event.BedNumber;
        IsAdmitted = true;
        AdmittedAt = @event.AdmittedAt;
    }

    public void Apply(PatientTransferredEvent @event)
    {
        CurrentWard = @event.ToWardCode;
        CurrentBed = @event.ToBedNumber;
    }

    public void Apply(PatientDischargedEvent @event)
    {
        CurrentWard = string.Empty;
        CurrentBed = string.Empty;
        IsAdmitted = false;
        AdmittedAt = null;
    }
}
