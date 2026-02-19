using Microsoft.AspNetCore.Antiforgery;

[ApiController]
[Route("api/security")]
public class SecurityController : ControllerBase
{
    private readonly IAntiforgery _antiforgery;

    public SecurityController(IAntiforgery antiforgery)
    {
        _antiforgery = antiforgery;
    }

    [HttpGet("csrf-token")]
    public IActionResult GetCsrfToken()
    {
        var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new { token = tokens.RequestToken });
    }
}