public class CspMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _cspHeader;

    public CspMiddleware(RequestDelegate next, string cspHeader)
    {
        _next = next;
        _cspHeader = cspHeader;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.Headers.Append("Content-Security-Policy", _cspHeader);
        await _next(context);
    }
}