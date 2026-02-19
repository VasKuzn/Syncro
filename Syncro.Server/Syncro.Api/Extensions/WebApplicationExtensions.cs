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

            //app.UseHttpsRedirection();
            app.UseCors("FrontendPolicy");

            app.UseCookiePolicy(new CookiePolicyOptions
            {
                MinimumSameSitePolicy = SameSiteMode.Strict,
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
                "/accountshub",
                "/personalmessageshub",
                "/videochathub",
                "/swagger"
            };
            string cspPolicy = "default - src 'self'; script - src 'self'; style - src 'self'; img - src 'self' data: https:; font - src 'self'; connect - src 'self'; frame - ancestors 'none'; base - uri 'self'; form - action 'self'";
            app.UseMiddleware<CspMiddleware>(cspPolicy);
            app.UseMiddleware<AntiDirectAccessMiddleware>(excludedPaths);

        }
        public static void ConfigureEndpoints(this WebApplication app)
        {
            app.MapControllers();
            app.MapHub<FriendsHub>("/friendshub");
            app.MapHub<GroupsHub>("/groupshub");
            app.MapHub<AccountsHub>("/accountshub");
            app.MapHub<PersonalMessagesHub>("/personalmessageshub");
            app.MapHub<VideoChatHub>("/videochathub");
        }
    }
}