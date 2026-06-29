using Marten;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pas.MpiService.Models;

namespace Pas.MpiService.Controllers;

[Authorize(Roles = "SystemAdmin")]
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IDocumentStore _documentStore;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IDocumentStore documentStore, ILogger<AdminController> logger)
    {
        _documentStore = documentStore;
        _logger = logger;
    }

    #region User Management

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        using var session = _documentStore.QuerySession();
        var list = await session.Query<UserProfile>().ToListAsync();
        return Ok(list);
    }

    [HttpPost("users")]
    public async Task<IActionResult> SaveUser([FromBody] UserProfile user)
    {
        using var session = _documentStore.LightweightSession();
        session.Store(user);
        await session.SaveChangesAsync();

        _logger.LogInformation("Administrative User Profile {Username} saved/updated.", user.Username);
        return Ok(new { Message = "User profile saved successfully.", UserId = user.Id });
    }

    #endregion

    #region Ward Configuration

    [HttpGet("wards")]
    public async Task<IActionResult> GetWards()
    {
        using var session = _documentStore.QuerySession();
        var list = await session.Query<WardConfig>().ToListAsync();
        return Ok(list);
    }

    [HttpPost("wards")]
    public async Task<IActionResult> SaveWard([FromBody] WardConfig ward)
    {
        using var session = _documentStore.LightweightSession();
        session.Store(ward);
        await session.SaveChangesAsync();

        _logger.LogInformation("Ward configuration {WardCode} updated.", ward.WardCode);
        return Ok(new { Message = "Ward configuration saved successfully.", WardId = ward.Id });
    }

    #endregion

    #region Permissions Matrix

    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions()
    {
        using var session = _documentStore.QuerySession();
        var list = await session.Query<RolePermission>().ToListAsync();
        return Ok(list);
    }

    [HttpPost("permissions")]
    public async Task<IActionResult> SavePermission([FromBody] RolePermission permission)
    {
        using var session = _documentStore.LightweightSession();
        session.Store(permission);
        await session.SaveChangesAsync();

        _logger.LogInformation("Role permission matrix updated for role {Role}.", permission.Role);
        return Ok(new { Message = "Role permission matrix updated successfully." });
    }

    #endregion
}
