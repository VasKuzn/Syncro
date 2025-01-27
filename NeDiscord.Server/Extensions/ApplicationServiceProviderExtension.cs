namespace NeDiscord.Server.Extensions
{
    public static class ApplicationServiceProviderExtension
    {
        public static IServiceProvider AddCustomService(this IServiceProvider services, IConfiguration configuration)
        {
            using var scope = services.CreateScope();
            return services;
        }
    }
}
