
using NeDiscord.Server.Extensions;

namespace NeDiscord.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddServiceCollection(builder.Configuration);

            var app = builder.Build();
            app.Use(async (context, next) =>
            {
                context.Response.Headers["Content-Type"] = "text/html; charset=utf-8";
                await next();
            });
            app.UseDefaultFiles();
            app.UseStaticFiles();
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseHttpsRedirection();
            app.UseAuthorization();
            app.MapFallbackToController("Index", "Fallback");
            app.MapControllers();
            app.UseCors("CorsPolicy");


            app.MapFallbackToFile("/index.html");

            app.Run();
        }
    }
}
