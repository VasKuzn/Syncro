namespace Syncro.Application.Services
{
    public interface IServerMemberRolesService
    {
        Task<List<ServerMemberRoles>> GetMemberRolesAsync(Guid serverId, Guid accountId);
        Task<List<ServerMemberRoles>> GetRoleAssignmentsAsync(Guid roleId);
        Task<ServerMemberRoles> AssignRoleToMemberAsync(ServerMemberRoles memberRole);
        Task<bool> RemoveRoleFromMemberAsync(Guid assignmentId);
        Task<bool> RemoveAllRolesFromMemberAsync(Guid serverId, Guid accountId);
    }
}