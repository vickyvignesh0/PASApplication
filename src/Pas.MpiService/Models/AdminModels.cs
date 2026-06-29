using System;
using System.Collections.Generic;

namespace Pas.MpiService.Models;

public class UserProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = "ClinicalStaff"; // "ClinicalStaff", "SystemAdmin", "WardManager"
    public int SmartcardLevel { get; set; } = 2; // 1 to 4
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class WardConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string WardCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int TotalBeds { get; set; }
    public bool IsInfectionControlZone { get; set; }
}

public class RolePermission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Role { get; set; } = string.Empty;
    public List<string> AllowedModules { get; set; } = new();
}
