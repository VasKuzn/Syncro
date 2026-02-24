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

        var configuration = context.RequestServices.GetRequiredService<IConfiguration>();
        var env = context.RequestServices.GetRequiredService<IWebHostEnvironment>();

        // В режиме разработки пропускаем все запросы
        if (env.IsDevelopment())
        {
            await _next(context);
            return;
        }

        // PRODUCTION: Проверка Origin или Referer
        var origin = context.Request.Headers["Origin"].ToString();
        var referer = context.Request.Headers["Referer"].ToString();
        var allowedUrl = configuration["Frontend_Url:Url"] ?? "https://syncro-test.ru";

        // Если нет ни Origin, ни Referer - блокируем (Postman, curl)
        if (string.IsNullOrEmpty(origin) && string.IsNullOrEmpty(referer))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Access denied: Direct API access is not allowed.");
            return;
        }

        bool isValid = false;

        // Проверяем Origin, если он есть
        if (!string.IsNullOrEmpty(origin))
        {
            isValid = origin.StartsWith(allowedUrl, StringComparison.OrdinalIgnoreCase);
        }
        // Если Origin нет, но есть Referer - проверяем Referer
        else if (!string.IsNullOrEmpty(referer))
        {
            isValid = referer.StartsWith(allowedUrl, StringComparison.OrdinalIgnoreCase);
        }

        if (!isValid)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Access denied: Invalid origin or referer.");
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

        await _next(context);
    }
}