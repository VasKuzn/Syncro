var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
builder.Services.AddControllers();
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
builder.Services.AddScoped<IFriendsRepository, FriendsRepository>();
builder.Services.AddScoped<IFriendsService, FriendsService>();
builder.Services.AddScoped<IServerRepository, ServerRepository>();
builder.Services.AddScoped<IServerService, ServerService>();
builder.Services.AddScoped<IRolesRepository, ServerRolesRepository>();
builder.Services.AddScoped<IRolesService, ServerRolesService>();
builder.Services.AddScoped<IServerMemberRepository, ServerMemberRepository>();
builder.Services.AddScoped<IServerMemberService, ServerMemberService>();
builder.Services.AddScoped<IServerMemberRolesRepository, ServerMemberRolesRepository>();
builder.Services.AddScoped<IServerMemberRolesService, ServerMemberRolesService>();
builder.Services.AddScoped<ISectorRepository, SectorRepository>();
builder.Services.AddScoped<ISectorService, SectorService>();
builder.Services.AddScoped<ISectorPermissionsRepository, SectorPermissionsRepository>();
builder.Services.AddScoped<ISectorPermissionsService, SectorPermissionsService>();

var app = builder.Build();

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
