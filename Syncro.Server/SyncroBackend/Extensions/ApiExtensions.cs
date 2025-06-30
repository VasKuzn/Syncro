using Microsoft.AspNetCore.Authentication.JwtBearer;

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
        }
    }
}