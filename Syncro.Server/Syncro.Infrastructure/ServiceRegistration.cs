using Amazon.S3;
using Amazon.Extensions.NETCore.Setup;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Syncro.Infrastructure.Selectel;
using Syncro.Application.SelectelStorage;
using Syncro.Application.Interfaces.Repositories;

public static class ServiceRegistration
{
    public static void AddCoreServicesExtension(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IMediaMessageService, MediaMessageService>();
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
        services.AddScoped<IPersonalAccountInfoService, PersonalAccountInfoService>();
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
        services.AddScoped<IPersonalAccountInfoRepository, PersonalAccountInfoRepository>();
    }

    public static void AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCoreRepositoriesExtension(configuration);
        services.AddCoreServicesExtension(configuration);
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
}