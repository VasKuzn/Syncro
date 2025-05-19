namespace SyncroBackend.Interfaces
{
    public interface IGroupRoleService
    {
        public Task<List<ConferenceRolesModel>> GetAllGroupRolesAsync();
        public Task<ConferenceRolesModel> GetGroupRoleByIdAsync(Guid conferenceRoleId);
        public Task<ConferenceRolesModel> CreateGroupRoleAsync(ConferenceRolesModel conferenceRole);
        public Task<bool> DeleteGroupRoleAsync(Guid conferenceRoleId);
        public Task<ConferenceRolesModel> UpdateGroupRoleAsync(Guid conferenceId, Permissions permissions);
    }
}