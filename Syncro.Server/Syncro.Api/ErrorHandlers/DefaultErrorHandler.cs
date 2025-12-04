using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Diagnostics;

namespace Syncro.Api.ErrorHandlers
{
    public class DefaultErrorHandler : IExceptionHandler
    {
        public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception ex, CancellationToken cancellationToken)
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            var problem = new ProblemDetails()
            {
                Status = context.Response.StatusCode,
                Title = "Internal Server Error",
                Detail = ex.Message,
                Instance = context.Request.Path,
                Type = "ServerError"
            };
            problem.Extensions["traceId"] = context.TraceIdentifier;
            await context.Response.WriteAsJsonAsync(problem, cancellationToken);
            return true;
        }
    }
}