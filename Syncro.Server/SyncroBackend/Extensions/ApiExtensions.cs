using Amazon.S3;

namespace SyncroBackend.Extensions
{
    public static class ApiExtensions
    {
        public static void AddApiAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            var jwtOptions = configuration.GetSection("JWToptions").Get<JWToptions>();

            if (string.IsNullOrEmpty(jwtOptions?.secretKey))
            {
                throw new ArgumentNullException("JWT secret key is not configured");
            }

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.TokenValidationParameters = new()
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtOptions.secretKey))
                };
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        context.Token = context.Request.Cookies["access-token"];
                        return Task.CompletedTask;
                    }
                };
            });

            services.AddAuthorization();
            services.AddScoped<IJwtProvider, JWTProvider>();
        }
        public static void AddCoreServicesExtension(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<IMessageService, MessageService>();
            services.AddScoped<IConferenceService<PersonalConferenceModel>, PersonalConferenceService>();
            services.AddScoped<IGroupConferenceService<GroupConferenceModel>, GroupConferenceService>();
            services.AddScoped<IGroupConferenceMemberService, GroupConferenceMemberService>();
            services.AddScoped<IGroupRoleService, GroupRolesService>();
            services.AddScoped<IFriendsService, FriendsService>();
            services.AddScoped<IServerService, ServerService>();
            services.AddScoped<IRolesService, ServerRolesService>();
            services.AddScoped<IServerMemberService, ServerMemberService>();
            services.AddScoped<IServerMemberRolesService, ServerMemberRolesService>();
            services.AddScoped<ISectorService, SectorService>();
            services.AddScoped<ISectorPermissionsService, SectorPermissionsService>();
        }
        public static void AddCoreRepositoriesExtension(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<IAccountRepository, AccountRepository>();
            services.AddScoped<IMessageRepository, MessageRepository>();
            services.AddScoped<IConferenceRepository<PersonalConferenceModel>, PersonalConferenceRepository>();
            services.AddScoped<IGroupConferenceRepository<GroupConferenceModel>, GroupConferenceRepository>();
            services.AddScoped<IGroupConferenceMemberRepository, GroupConferenceMemberRepository>();
            services.AddScoped<IGroupRolesRepository, GroupRolesRepository>();
            services.AddScoped<IFriendsRepository, FriendsRepository>();
            services.AddScoped<IServerRepository, ServerRepository>();
            services.AddScoped<IRolesRepository, ServerRolesRepository>();
            services.AddScoped<IServerMemberRepository, ServerMemberRepository>();
            services.AddScoped<IServerMemberRolesRepository, ServerMemberRolesRepository>();
            services.AddScoped<ISectorRepository, SectorRepository>();
            services.AddScoped<ISectorPermissionsRepository, SectorPermissionsRepository>();
        }

        public static void AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDataBaseServices(configuration);
            services.AddS3Services(configuration);
        }

        public static void AddS3Services(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDefaultAWSOptions(configuration.GetAWSOptions());
            services.AddAWSService<IAmazonS3>();
            services.AddSingleton<ISelectelStorageService, SelectelStorageService>();
        }
        public static void AddDataBaseServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<DataBaseContext>(options => options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));
        }
        public static void AddWebServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddWebControllers(configuration);
            services.AddSwaggerGen();
            services.AddAuthenticationServices(configuration);
            services.AddCorsPolicy(configuration);
        }
        public static void AddWebControllers(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddControllers();
            services.AddEndpointsApiExplorer();
            services.AddSignalR();
        }
        public static void AddAuthenticationServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddApiAuthentication(configuration);
            services.Configure<JWToptions>(configuration.GetSection(nameof(JWToptions)));
        }
        public static void AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.AllowAnyHeader()
                        .AllowAnyMethod()
                        .SetIsOriginAllowed(_ => true)
                        .AllowCredentials();
                });
            });
        }
    }
}