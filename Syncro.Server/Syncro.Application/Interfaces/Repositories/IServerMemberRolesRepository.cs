namespace Syncro.Application.Repositories
{
    public interface IServerMemberRolesRepository
    {
        Task<List<ServerMemberRoles>> GetAllMemberRolesAsync();
        Task<List<ServerMemberRoles>> GetMemberRolesAsync(Guid serverId, Guid accountId);
        Task<List<ServerMemberRoles>> GetRoleAssignmentsAsync(Guid roleId);
        Task<ServerMemberRoles> GetMemberRoleByIdAsync(Guid id);
        Task<ServerMemberRoles> AddMemberRoleAsync(ServerMemberRoles memberRole);
        Task<bool> DeleteMemberRoleAsync(Guid id);
        Task<bool> MemberRoleExistsAsync(Guid serverId, Guid accountId, Guid roleId);
        Task<bool> MemberExistsInServerAsync(Guid serverId, Guid accountId);
        Task<bool> RoleExistsInServerAsync(Guid serverId, Guid roleId);
    }
}