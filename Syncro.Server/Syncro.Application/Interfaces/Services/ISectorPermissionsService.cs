namespace Syncro.Application.Services
{
    public interface ISectorPermissionsService
    {
        Task<SectorPermissionsModel> GrantPermissionAsync(SectorPermissionsModel permission);
        Task<bool> RevokePermissionAsync(Guid permissionId);
        Task<bool> HasPermissionAsync(Guid accountId, Guid sectorId, Permissions permission);
        Task<List<Permissions>> GetPermissionsAsync(Guid accountId, Guid sectorId);
        Task<List<SectorPermissionsModel>> GetAccountPermissionsAsync(Guid accountId);
        Task<List<SectorPermissionsModel>> GetSectorPermissionsAsync(Guid sectorId);
    }
}