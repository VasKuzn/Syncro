using Microsoft.AspNetCore.Antiforgery;

namespace Syncro.Api.Extensions
{
    public static class WebApplicationExtensions
    {
        public static void ConfigureWebApplication(this WebApplication app)
        {
            app.ConfigurePipeline();
            app.ConfigureEndpoints();
        }
        public static void ConfigurePipeline(this WebApplication app)
        {
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                // Production: nginx handles HTTPS (SSL termination)
                // ForwardedHeaders middleware reads X-Forwarded-Proto and other headers from nginx
                app.UseForwardedHeaders(new ForwardedHeadersOptions
                {
                    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor |
                                       Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
                });
            }

            app.UseCors("FrontendPolicy");
            app.UseCookiePolicy(new CookiePolicyOptions
            {
                MinimumSameSitePolicy = SameSiteMode.Lax,
                Secure = CookieSecurePolicy.SameAsRequest,
            });

            app.UseRouting();
            app.UseAntiforgery();

            app.UseAuthentication();
            app.UseAuthorization();
            var excludedPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "/friendshub",
                "/groupshub",
                "/groupmessageshub",
                "/accountshub",
                "/personalmessageshub",
                "/videochathub",
                "/swagger"
            };
            string cspPolicy = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' yastatic.net mc.yandex.ru mc.yandex.com mc.admetrica.ru; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: mc.yandex.ru mc.yandex.com mc.admetrica.ru avatars.mds.yandex.net; font-src 'self' data:; connect-src 'self' https: mc.yandex.ru mc.yandex.com autofill.yandex.ru login.yandex.ru suggest-maps.yandex.net; frame-src 'self' https://autofill.yandex.ru; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
            app.UseMiddleware<CspMiddleware>(cspPolicy);
            app.UseMiddleware<AntiDirectAccessMiddleware>(excludedPaths);

        }
        public static void ConfigureEndpoints(this WebApplication app)
        {
            app.MapControllers();
            app.MapHub<FriendsHub>("/friendshub");
            app.MapHub<GroupsHub>("/groupshub");
            app.MapHub<AccountsHub>("/accountshub");
            app.MapHub<GroupMessagesHub>("/groupmessageshub");
            app.MapHub<PersonalMessagesHub>("/personalmessageshub");
            app.MapHub<VideoChatHub>("/videochathub");
        }
    }
}