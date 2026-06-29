using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Pas.MpiService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // Symmetric key for local signing
    public static readonly string SecretKey = "SuperSecretKeyForNHSAndHSEInteroperability123!";
    public static readonly string Issuer = "CarePortalPAS";
    public static readonly string Audience = "CarePortalUsers";

    [HttpPost("login-simulated")]
    public IActionResult LoginSimulated([FromBody] LoginRequest request)
    {
        string username = "Dr. Fiona Gallagher";
        string role = "ClinicalStaff";
        string identifier = "FG-99021";

        if (request.UseSmartcard)
        {
            // Simulate reading card metadata via NHS CIS2 integration
            username = "Dr. Fiona Gallagher (NHS Smartcard)";
            role = "ClinicalStaff";
            identifier = "NHS-SC-883921";
        }
        else
        {
            // Simple credential fallback verification
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Credentials are required.");
            }

            if (request.Username.ToLower() == "admin")
            {
                username = "System Administrator";
                role = "SystemAdmin";
                identifier = "ADMIN-001";
            }
            else
            {
                username = request.Username;
            }
        }

        // Generate JWT Token
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(SecretKey);
        
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, username),
            new(ClaimTypes.Role, role),
            new("nhs_user_id", identifier),
            new("auth_method", request.UseSmartcard ? "CIS2_Smartcard" : "Password")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8), // Standard clinical shift length
            Issuer = Issuer,
            Audience = Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var jwtString = tokenHandler.WriteToken(token);

        return Ok(new LoginResponse(jwtString, username, role, identifier));
    }
}

public record LoginRequest(
    string? Username,
    string? Password,
    bool UseSmartcard
);

public record LoginResponse(
    string Token,
    string DisplayName,
    string Role,
    string UserIdentifier
);
