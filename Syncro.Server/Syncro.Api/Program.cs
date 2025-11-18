using Microsoft.EntityFrameworkCore;
using Syncro.Api.Extensions;
using Syncro.Infrastructure.Data.DataBaseContext;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

//INFRASTRUCTURE LAYER core+infrastructure
builder.Services.AddInfrastructureServices(configuration);
//PRESENTATION LAYER все web сервисы - контроллеры, signalr, authentication... 
builder.Services.AddWebServices(configuration);


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DataBaseContext>();
    db.Database.Migrate();
}

app.ConfigureWebApplication();

app.Run();
