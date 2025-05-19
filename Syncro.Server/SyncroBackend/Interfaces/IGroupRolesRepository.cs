namespace SyncroBackend.Interfaces
{
    public interface IGroupRolesRepository
    {
        public Task<List<ConferenceRolesModel>> GetAllGroupRolesAsync();
        public Task<ConferenceRolesModel> GetGroupRoleByIdAsync(Guid conferenceRoleId);
        public Task<ConferenceRolesModel> CreateGroupRoleAsync(ConferenceRolesModel conferenceRole);
        public Task<bool> DeleteGroupRoleAsync(Guid conferenceRoleId);
        public Task<ConferenceRolesModel> UpdateGroupRoleAsync(ConferenceRolesModel conferenceRole);
    }
}