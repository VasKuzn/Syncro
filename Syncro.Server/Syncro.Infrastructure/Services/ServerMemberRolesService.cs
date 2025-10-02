namespace Syncro.Infrastructure.Services
{
    public class ServerMemberRolesService : IServerMemberRolesService
    {
        private readonly IServerMemberRolesRepository _repository;
        private readonly IServerMemberRepository _memberRepository;
        private readonly IRolesRepository _rolesRepository;

        public ServerMemberRolesService(
            IServerMemberRolesRepository repository,
            IServerMemberRepository memberRepository,
            IRolesRepository rolesRepository)
        {
            _repository = repository;
            _memberRepository = memberRepository;
            _rolesRepository = rolesRepository;
        }

        public async Task<List<ServerMemberRoles>> GetMemberRolesAsync(Guid serverId, Guid accountId)
        {
            return await _repository.GetMemberRolesAsync(serverId, accountId);
        }

        public async Task<List<ServerMemberRoles>> GetRoleAssignmentsAsync(Guid roleId)
        {
            return await _repository.GetRoleAssignmentsAsync(roleId);
        }

        public async Task<ServerMemberRoles> AssignRoleToMemberAsync(ServerMemberRoles memberRole)
        {
            if (!await _memberRepository.MemberExistsInServerAsync(memberRole.serverId, memberRole.accountId))
                throw new ArgumentException("Member does not exist in this server");

            if (!await _rolesRepository.RoleExistsInServerAsync(memberRole.serverId, memberRole.roleId))
                throw new ArgumentException("Role does not exist in this server");

            if (await _repository.MemberRoleExistsAsync(memberRole.serverId, memberRole.accountId, memberRole.roleId))
                throw new ArgumentException("Role is already assigned to this member");

            return await _repository.AddMemberRoleAsync(memberRole);
        }

        public async Task<bool> RemoveRoleFromMemberAsync(Guid assignmentId)
        {
            return await _repository.DeleteMemberRoleAsync(assignmentId);
        }

        public async Task<bool> RemoveAllRolesFromMemberAsync(Guid serverId, Guid accountId)
        {
            var roles = await _repository.GetMemberRolesAsync(serverId, accountId);
            foreach (var role in roles)
            {
                await _repository.DeleteMemberRoleAsync(role.Id);
            }
            return true;
        }
    }
}