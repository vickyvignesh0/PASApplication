using System;
using System.Threading.Tasks;
using Marten;
using Pas.MpiService.Models;
using Pas.Shared;

namespace Pas.MpiService;

public static class DbSeeder
{
    public static async Task SeedDataAsync(IDocumentStore store)
    {
        using var session = store.LightweightSession();

        // Check if database is already seeded
        var existingPatients = await session.Query<Patient>().AnyAsync();
        if (existingPatients)
        {
            return; // Already seeded
        }

        // 1. Seed Patients via Event Sourcing (MPI)
        var patient1Id = Guid.Parse("1e19485b-e48f-410a-8bf8-234b679f2ea3");
        var patient2Id = Guid.Parse("503a45c3-a3d8-4903-88fe-7be23fb94b28");
        var patient3Id = Guid.Parse("9f0412ab-f75e-4efb-8877-bb8909ac1e89");
        var patient4Id = Guid.Parse("f87a32bd-442a-4632-9011-aa9b2319df43");
        var patient5Id = Guid.Parse("c2e9a21b-871d-40ba-ae29-cc823fb88e21");
        var patient6Id = Guid.Parse("5eb91a4b-88b1-4091-a201-cf92cbb88319");
        var patient7Id = Guid.Parse("8d839212-fc39-4d8b-9021-aa021cbbd210");

        var reg1 = new PatientRegisteredEvent(patient1Id, "Alastair", "Campbell", new DateTime(1962, 4, 12), "485 777 3456", null, null, "G83047", "42 High Street", "SW1A 1AA");
        var reg2 = new PatientRegisteredEvent(patient2Id, "Fiona", "O'Connor", new DateTime(1978, 8, 25), null, null, "800 120 4567", "G83047", "12 O'Connell Street", "D01 A274");
        var reg3 = new PatientRegisteredEvent(patient3Id, "Eoin", "MacDonald", new DateTime(1955, 11, 3), null, "031155 1234", null, "G83047", "10 Royal Mile", "EH1 1TB");
        var reg4 = new PatientRegisteredEvent(patient4Id, "Sarah", "Jenkins", new DateTime(1989, 1, 30), "943 456 7821", null, null, "G83047", "15 Victoria Road", "M1 1AE");
        var reg5 = new PatientRegisteredEvent(patient5Id, "Declan", "Murphy", new DateTime(2001, 7, 15), null, null, "800 789 1011", "G83047", "5 Merrion Square", "D02 YX02");
        var reg6 = new PatientRegisteredEvent(patient6Id, "Seamus", "Brogan", new DateTime(1984, 5, 20), "419 881 3322", null, null, "G83047", "88 Shankill Road", "BT13 2BD");
        var reg7 = new PatientRegisteredEvent(patient7Id, "Bernadette", "O'Reilly", new DateTime(1947, 9, 8), null, null, "800 234 5678", "G83047", "14 O'Callaghan Ave", "Cork");

        session.Events.StartStream<Patient>(patient1Id, reg1);
        session.Events.StartStream<Patient>(patient2Id, reg2);
        session.Events.StartStream<Patient>(patient3Id, reg3);
        session.Events.StartStream<Patient>(patient4Id, reg4);
        session.Events.StartStream<Patient>(patient5Id, reg5);
        session.Events.StartStream<Patient>(patient6Id, reg6);
        session.Events.StartStream<Patient>(patient7Id, reg7);

        // Admit some patients to wards (attaching ADT events to patient aggregate stream)
        var adm1 = new PatientAdmittedEvent(Guid.NewGuid(), patient1Id, "Acute Medical Unit (AMU)", "Bed A1", "Dr. Emily Briggs", DateTime.UtcNow.AddHours(-4), "None");
        var adm2 = new PatientAdmittedEvent(Guid.NewGuid(), patient2Id, "Coronary Care Unit (CCU)", "Bay 2 - Bed B", "Dr. Emily Briggs", DateTime.UtcNow.AddDays(-1), "MRSA Screen Positive (Precautionary Isolation)");
        var adm3 = new PatientAdmittedEvent(Guid.NewGuid(), patient3Id, "Geriatic Assessment Ward", "Bed C4", "Dr. Emily Briggs", DateTime.UtcNow.AddDays(-3), "Fall Risk - High Assist");
        var adm4 = new PatientAdmittedEvent(Guid.NewGuid(), patient5Id, "Acute Medical Unit (AMU)", "Bed A4", "Dr. Emily Briggs", DateTime.UtcNow.AddHours(-12), "COVID-19 Contact - Watch List");

        session.Events.Append(patient1Id, adm1);
        session.Events.Append(patient2Id, adm2);
        session.Events.Append(patient3Id, adm3);
        session.Events.Append(patient5Id, adm4);

        // 2. Seed Referrals & Waiting Lists
        var referral1 = new Referral
        {
            Id = Guid.NewGuid(),
            PatientId = patient1Id,
            PatientName = "Campbell, Alastair",
            ReferralSource = "GP Vance",
            Specialty = "Cardiology",
            Pathway = PathwayType.Outpatient,
            Priority = ReferralPriority.Routine,
            ReferralDate = DateTime.UtcNow.AddDays(-14),
            Status = ReferralStatus.Pending,
            ClinicalIndication = "Palpitations and mild dyspnea."
        };

        var referral2 = new Referral
        {
            Id = Guid.NewGuid(),
            PatientId = patient2Id,
            PatientName = "O'Connor, Fiona",
            ReferralSource = "e-RS",
            Specialty = "Orthopaedics",
            Pathway = PathwayType.Inpatient,
            Priority = ReferralPriority.Urgent,
            ReferralDate = DateTime.UtcNow.AddDays(-110),
            Status = ReferralStatus.Pending,
            ClinicalIndication = "Degenerative osteoarthritis, requires hip arthroplasty."
        };

        var referral3 = new Referral
        {
            Id = Guid.NewGuid(),
            PatientId = patient3Id,
            PatientName = "MacDonald, Eoin",
            ReferralSource = "GP Vance",
            Specialty = "Geriatrics",
            Pathway = PathwayType.Inpatient,
            Priority = ReferralPriority.Routine,
            ReferralDate = DateTime.UtcNow.AddDays(-30),
            Status = ReferralStatus.Pending,
            ClinicalIndication = "Post-fall cognitive and mobility assessment."
        };

        session.Store(referral1);
        session.Store(referral2);
        session.Store(referral3);

        session.Store(new WaitingListEntry { ReferralId = referral1.Id, PatientId = patient1Id, PatientName = "Campbell, Alastair", Specialty = "Cardiology", Pathway = PathwayType.Outpatient, DateAdded = DateTime.UtcNow.AddDays(-14), Status = "Waiting" });
        session.Store(new WaitingListEntry { ReferralId = referral2.Id, PatientId = patient2Id, PatientName = "O'Connor, Fiona", Specialty = "Orthopaedics", Pathway = PathwayType.Inpatient, DateAdded = DateTime.UtcNow.AddDays(-110), Status = "Waiting" });
        session.Store(new WaitingListEntry { ReferralId = referral3.Id, PatientId = patient3Id, PatientName = "MacDonald, Eoin", Specialty = "Geriatrics", Pathway = PathwayType.Inpatient, DateAdded = DateTime.UtcNow.AddDays(-30), Status = "Waiting" });

        // 3. Seed Bookings
        session.Store(new Booking { PatientId = patient1Id, PatientName = "Campbell, Alastair", AppointmentDate = DateTime.UtcNow.AddDays(2), Type = BookingType.OutpatientClinic, ClinicNameOrWard = "Outpatient Clinic 3", ClinicianName = "Dr. Emily Briggs", Status = "Scheduled" });
        session.Store(new Booking { PatientId = patient5Id, PatientName = "Murphy, Declan", AppointmentDate = DateTime.UtcNow.AddDays(5), Type = BookingType.InpatientAdmission, ClinicNameOrWard = "Acute Medical Unit (AMU) - Bed 4", ClinicianName = "Dr. Emily Briggs", Status = "Scheduled" });

        // 4. Seed Emergency Attendances
        session.Store(new EmergencyAttendance { PatientId = patient4Id, PatientName = "Jenkins, Sarah", ArrivalTime = DateTime.UtcNow.AddHours(-3.2), Triage = TriageCategory.VeryUrgent, ChiefComplaint = "Severe Chest Pain & Dyspnea", TriageNotes = "ECG shows sinus tachycardia. Nil active ST elevation. Awaiting lab troponins.", Status = AttendanceStatus.UnderTreatment });
        session.Store(new EmergencyAttendance { PatientId = patient6Id, PatientName = "Brogan, Seamus", ArrivalTime = DateTime.UtcNow.AddMinutes(-30), Triage = TriageCategory.Standard, ChiefComplaint = "Minor laceration on left forearm", TriageNotes = "Clean wound. Awaiting suture clinic.", Status = AttendanceStatus.WaitingForTreatment });
        session.Store(new EmergencyAttendance { PatientId = patient7Id, PatientName = "O'Reilly, Bernadette", ArrivalTime = DateTime.UtcNow.AddMinutes(-5), Triage = TriageCategory.Immediate, ChiefComplaint = "Suspected stroke, slurred speech, FAST positive", TriageNotes = "Immediate transfer to Resus 1. CT Brain requested.", Status = AttendanceStatus.AwaitingTriage });

        // 5. Seed Documents
        var doc1 = new ClinicalDocument
        {
            PatientId = patient1Id,
            Title = "Referral Letter from General Practitioner",
            DocumentType = "ReferralLetter",
            Content = @"### PRIMARY CARE REFERRAL LETTER
**From:** Dr. Robert Vance, MD (Vance Clinic, London)
**To:** Clinical Lead, Specialty Medicine Department

**Clinical Indication:**
Patient presented with a history of recurring cardiovascular palpitations and moderate dyspnea on exertion.
Previous ECGs show intermittent sinus bradycardia.

**Current Medications:**
* Bisoprolol 2.5mg OD
* Atorvastatin 20mg ON

Please review for specialized diagnostic profiling and cardiac stress testing.",
            CreatedAt = DateTime.UtcNow.AddDays(-14),
            Author = "Dr. Robert Vance, GP"
        };

        var doc2 = new ClinicalDocument
        {
            PatientId = patient2Id,
            Title = "Discharge Summary - Orthopaedics Day Ward",
            DocumentType = "DischargeSummary",
            Content = @"### DISCHARGE SUMMARY & CLINICAL CODING
**Specialty:** Orthopaedics
**Admission Date:** 10 Jun 2026
**Discharge Date:** 10 Jun 2026

**Procedure:** Diagnostic Arthroscopy of Left Hip Joint.
**Findings:** Minimal cartilage fibrillation. Debrided local labral tear. No active infection.

**Clinical Codes:**
* SNOMED CT: 265622007 (Arthroscopy of hip joint)
* ICD-11: FA10.1 (Osteoarthritis of hip)

**Follow-up Plan:**
Physiotherapy referral made. Clinical review in outpatient template in 6 weeks.",
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            Author = "Dr. Emily Briggs, Consultant"
        };

        session.Store(doc1);
        session.Store(doc2);

        // 6. Seed User Profiles
        var user1 = new UserProfile { Id = Guid.NewGuid(), Username = "admin", DisplayName = "System Administrator", Role = "SystemAdmin", SmartcardLevel = 4, IsActive = true };
        var user2 = new UserProfile { Id = Guid.NewGuid(), Username = "fiona_sc", DisplayName = "Dr. Fiona Gallagher (NHS Smartcard)", Role = "ClinicalStaff", SmartcardLevel = 2, IsActive = true };
        var user3 = new UserProfile { Id = Guid.NewGuid(), Username = "emily_br", DisplayName = "Dr. Emily Briggs", Role = "ClinicalStaff", SmartcardLevel = 3, IsActive = true };

        session.Store(user1);
        session.Store(user2);
        session.Store(user3);

        // 7. Seed Wards Configuration
        var wConfig1 = new WardConfig { Id = Guid.NewGuid(), WardCode = "AMU", Name = "Acute Medical Unit (AMU)", TotalBeds = 24, IsInfectionControlZone = false };
        var wConfig2 = new WardConfig { Id = Guid.NewGuid(), WardCode = "CCU", Name = "Coronary Care Unit (CCU)", TotalBeds = 8, IsInfectionControlZone = true };
        var wConfig3 = new WardConfig { Id = Guid.NewGuid(), WardCode = "GER", Name = "Geriatic Assessment Ward", TotalBeds = 16, IsInfectionControlZone = false };
        var wConfig4 = new WardConfig { Id = Guid.NewGuid(), WardCode = "ED", Name = "Emergency Department (ED)", TotalBeds = 30, IsInfectionControlZone = false };

        session.Store(wConfig1);
        session.Store(wConfig2);
        session.Store(wConfig3);
        session.Store(wConfig4);

        // 8. Seed Role Permissions
        var perm1 = new RolePermission { Id = Guid.NewGuid(), Role = "SystemAdmin", AllowedModules = new System.Collections.Generic.List<string> { "BedBoard", "Referrals", "Booking", "Emergency", "Documents", "MpiDirectory", "AdminConfig" } };
        var perm2 = new RolePermission { Id = Guid.NewGuid(), Role = "ClinicalStaff", AllowedModules = new System.Collections.Generic.List<string> { "BedBoard", "Referrals", "Booking", "Emergency", "Documents" } };

        session.Store(perm1);
        session.Store(perm2);

        await session.SaveChangesAsync();
    }
}
