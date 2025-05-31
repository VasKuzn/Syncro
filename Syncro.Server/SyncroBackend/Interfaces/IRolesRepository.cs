namespace SyncroBackend.Interfaces
{
    public interface IRolesRepository
    {
        Task<List<RolesModel>> GetAllRolesAsync();
        Task<List<RolesModel>> GetRolesByServerIdAsync(Guid serverId);
        Task<RolesModel> GetRoleByIdAsync(Guid roleId);
        Task<RolesModel> AddRoleAsync(RolesModel role);
        Task<bool> DeleteRoleAsync(Guid roleId);
        Task<RolesModel> UpdateRoleAsync(RolesModel role);
        Task<bool> RoleNameExistsInServerAsync(Guid serverId, string roleName);
        Task<bool> ServerExistsAsync(Guid serverId);
    }
}