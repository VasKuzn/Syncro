var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

//PRESENTATION LAYER все web сервисы - контроллеры, signalr... 
builder.Services.AddWebServices(configuration);

//CORE LAYER все scoped зависимости интерфейсов+сервисов+репозиториев
builder.Services.AddCoreServicesExtension(configuration);
builder.Services.AddCoreRepositoriesExtension(configuration);
//INFRASTRUCTURE LAYER s3 и сервисы в будущем
builder.Services.AddInfrastructureServices(configuration);

var app = builder.Build();

app.ConfigureWebApplication();

app.Run();
