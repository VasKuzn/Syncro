public class AntiDirectAccessMiddleware
{
    private readonly RequestDelegate _next;
    private readonly HashSet<string> _excludedPaths;

    public AntiDirectAccessMiddleware(RequestDelegate next, HashSet<string> excludedPaths)
    {
        _next = next;
        _excludedPaths = excludedPaths;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

        if (_excludedPaths.Any(excluded => path.StartsWith(excluded.ToLowerInvariant())))
        {
            await _next(context);
            return;
        }

        // Проверяем наличие Sec-Fetch заголовков (современные браузеры)
        var secFetchMode = context.Request.Headers["Sec-Fetch-Mode"].FirstOrDefault();
        var secFetchDest = context.Request.Headers["Sec-Fetch-Dest"].FirstOrDefault();
        var secFetchSite = context.Request.Headers["Sec-Fetch-Site"].FirstOrDefault();

        if (!string.IsNullOrEmpty(secFetchMode) || !string.IsNullOrEmpty(secFetchDest))
        {
            // Если это навигация или встраиваемый ресурс — запрещаем
            if (secFetchMode == "navigate" ||
                secFetchDest == "document" ||
                secFetchDest == "object" ||
                secFetchDest == "embed")
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync("Direct navigation to API is not allowed.");
                return;
            }

            await _next(context);
            return;
        }

        // Если Sec-Fetch заголовков нет (старые браузеры) — проверяем X-Requested-With, TODO - пока не реализовано
        if (!context.Request.Headers.TryGetValue("X-Requested-With", out var xrwValue) ||
            xrwValue != "XMLHttpRequest")
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Direct access to API is forbidden.");
            return;
        }

        await _next(context);
    }
}