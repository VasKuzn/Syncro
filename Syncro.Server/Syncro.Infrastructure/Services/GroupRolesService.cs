namespace Syncro.Infrastructure.Services
{
    public class GroupRolesService : IGroupRoleService
    {
        private readonly IGroupRolesRepository _groupRolesRepository;

        public GroupRolesService(IGroupRolesRepository groupRolesRepository)
        {
            _groupRolesRepository = groupRolesRepository;
        }

        public async Task<ConferenceRolesModel> CreateGroupRoleAsync(ConferenceRolesModel conferenceRole)
        {
            return await _groupRolesRepository.CreateGroupRoleAsync(conferenceRole);
        }

        public async Task<bool> DeleteGroupRoleAsync(Guid conferenceRoleId)
        {
            return await _groupRolesRepository.DeleteGroupRoleAsync(conferenceRoleId);
        }

        public async Task<List<ConferenceRolesModel>> GetAllGroupRolesAsync()
        {
            return await _groupRolesRepository.GetAllGroupRolesAsync();
        }

        public async Task<ConferenceRolesModel> GetGroupRoleByIdAsync(Guid conferenceRoleId)
        {
            return await _groupRolesRepository.GetGroupRoleByIdAsync(conferenceRoleId);
        }

        public async Task<ConferenceRolesModel> UpdateGroupRoleAsync(Guid conferenceRoleId, Permissions permissions)
        {
            if (conferenceRoleId == Guid.Empty)
            {
                throw new ArgumentException("Conference role ID cannot be empty", nameof(conferenceRoleId));
            }

            if (permissions == Permissions.None)
            {
                throw new ArgumentException("Permissions cannot be None", nameof(permissions));
            }
            var existingRole = await _groupRolesRepository.GetGroupRoleByIdAsync(conferenceRoleId);
            if (existingRole == null)
            {
                throw new KeyNotFoundException($"Conference role with ID {conferenceRoleId} not found");
            }
            existingRole.rolePermissions = permissions;
            var updatedRole = await _groupRolesRepository.UpdateGroupRoleAsync(existingRole);
            return updatedRole;
        }
    }
}