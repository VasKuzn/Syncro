namespace SyncroBackend.Interfaces
{
    public interface IRolesService
    {
        Task<List<RolesModel>> GetAllRolesAsync();
        Task<List<RolesModel>> GetRolesByServerIdAsync(Guid serverId);
        Task<RolesModel> GetRoleByIdAsync(Guid roleId);
        Task<RolesModel> CreateRoleAsync(RolesModel role);
        Task<bool> DeleteRoleAsync(Guid roleId);
        Task<RolesModel> UpdateRoleAsync(Guid roleId, RolesModelDto roleDto);
        Task<RolesModel> UpdateRolePositionAsync(Guid roleId, long newPosition);
    }
}