namespace Syncro.Infrastructure.Services
{
    public class ServerRolesService : IRolesService
    {
        private readonly IRolesRepository _rolesRepository;

        public ServerRolesService(IRolesRepository rolesRepository)
        {
            _rolesRepository = rolesRepository;
        }

        public async Task<List<RolesModel>> GetAllRolesAsync()
        {
            return await _rolesRepository.GetAllRolesAsync();
        }

        public async Task<List<RolesModel>> GetRolesByServerIdAsync(Guid serverId)
        {
            return await _rolesRepository.GetRolesByServerIdAsync(serverId);
        }

        public async Task<RolesModel> GetRoleByIdAsync(Guid roleId)
        {
            return await _rolesRepository.GetRoleByIdAsync(roleId);
        }

        public async Task<RolesModel> CreateRoleAsync(RolesModel role)
        {
            if (!await _rolesRepository.ServerExistsAsync(role.serverId))
                throw new ArgumentException("Server doesn't exist");

            if (await _rolesRepository.RoleNameExistsInServerAsync(role.serverId, role.roleName))
                throw new ArgumentException("Role name already exists in this server");

            return await _rolesRepository.AddRoleAsync(role);
        }

        public async Task<bool> DeleteRoleAsync(Guid roleId)
        {
            return await _rolesRepository.DeleteRoleAsync(roleId);
        }

        public async Task<RolesModel> UpdateRoleAsync(Guid roleId, RolesModelDTO roleDto)
        {
            var existingRole = await _rolesRepository.GetRoleByIdAsync(roleId);

            existingRole.roleName = roleDto.roleName;
            existingRole.rolePermissions = roleDto.rolePermissions;
            existingRole.color = roleDto.color;

            return await _rolesRepository.UpdateRoleAsync(existingRole);
        }

        public async Task<RolesModel> UpdateRolePositionAsync(Guid roleId, long newPosition)
        {
            var role = await _rolesRepository.GetRoleByIdAsync(roleId);
            var rolesInServer = await _rolesRepository.GetRolesByServerIdAsync(role.serverId);

            newPosition = Math.Max(1, Math.Min(newPosition, rolesInServer.Count));

            if (role.position != newPosition)
            {
                if (role.position < newPosition)
                {
                    foreach (var r in rolesInServer.Where(r => r.position > role.position && r.position <= newPosition))
                    {
                        r.position--;
                    }
                }
                else
                {
                    foreach (var r in rolesInServer.Where(r => r.position >= newPosition && r.position < role.position))
                    {
                        r.position++;
                    }
                }

                role.position = newPosition;
                await _rolesRepository.UpdateRoleAsync(role);
            }

            return role;
        }
    }
}