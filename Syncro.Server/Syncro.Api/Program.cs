using Microsoft.EntityFrameworkCore;
using Syncro.Api.Extensions;
using Syncro.Infrastructure.Data.DataBaseContext;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

//INFRASTRUCTURE LAYER core+infrastructure
builder.Services.AddInfrastructureServices(configuration);
//PRESENTATION LAYER все web сервисы - контроллеры, signalr, authentication... 
builder.Services.AddWebServices(configuration);

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "csrf-token";
    options.Cookie.SameSite = SameSiteMode.Lax;

    options.SuppressXFrameOptionsHeader = false;

    if (builder.Environment.IsDevelopment())
    {
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    }
    else
    {
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    }
});
// обработчики исключений
builder.Services.AddErrorHandlers(configuration);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DataBaseContext>();
    db.Database.Migrate();
}

app.ConfigureWebApplication();

app.Run();
