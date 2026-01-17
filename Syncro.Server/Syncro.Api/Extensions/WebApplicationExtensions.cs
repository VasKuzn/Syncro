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
            app.UseCors("AllowAll");
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseCookiePolicy(new CookiePolicyOptions
            {
                MinimumSameSitePolicy = SameSiteMode.Strict,
                HttpOnly = HttpOnlyPolicy.Always,
                Secure = CookieSecurePolicy.Always,
            });

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