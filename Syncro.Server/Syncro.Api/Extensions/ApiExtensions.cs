using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Syncro.Application.JWT;
using Syncro.Infrastructure.JWT;

namespace Syncro.Api.Extensions
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