var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddApiAuthentication(builder.Configuration);
builder.Services.Configure<JWToptions>(configuration.GetSection(nameof(JWToptions)));

builder.Services.AddDbContext<DataBaseContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .SetIsOriginAllowed(_ => true)
              .AllowCredentials();
    });
});
//
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddScoped<IJwtProvider, JWTProvider>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IConferenceRepository<PersonalConferenceModel>, PersonalConferenceRepository>();
builder.Services.AddScoped<IConferenceService<PersonalConferenceModel>, PersonalConferenceService>();
builder.Services.AddScoped<IGroupConferenceRepository<GroupConferenceModel>, GroupConferenceRepository>();
builder.Services.AddScoped<IGroupConferenceService<GroupConferenceModel>, GroupConferenceService>();
builder.Services.AddScoped<IGroupRolesRepository, GroupRolesRepository>();
builder.Services.AddScoped<IGroupRoleService, GroupRolesService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();
//dotnet run --urls="http://localhost:5000"

app.UseAuthentication();
app.UseAuthorization();
app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.Strict,
    HttpOnly = HttpOnlyPolicy.Always,
    Secure = CookieSecurePolicy.Always,
});
app.UseCors("AllowAll");

app.MapControllers();

app.MapHub<ChatHub>("/chatHub");

app.UseDefaultFiles();
app.UseStaticFiles();

app.Run();
