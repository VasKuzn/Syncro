namespace Syncro.Application.Repositories
{
    public interface ISectorPermissionsRepository
    {
        Task<List<SectorPermissionsModel>> GetBySectorIdAsync(Guid sectorId);
        Task<List<SectorPermissionsModel>> GetByRoleIdAsync(Guid roleId);
        Task<List<SectorPermissionsModel>> GetByAccountIdAsync(Guid accountId);
        Task<SectorPermissionsModel> GetByIdAsync(Guid id);
        Task<SectorPermissionsModel> AddAsync(SectorPermissionsModel permission);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> ExistsAsync(Guid sectorId, Guid roleId, Guid accountId);
        Task<bool> AccountHasPermissionAsync(Guid accountId, Guid sectorId, Permissions permission);
        Task<List<Permissions>> GetAccountPermissionsAsync(Guid accountId, Guid sectorId);
    }
}