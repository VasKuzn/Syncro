namespace SyncroBackend.Interfaces
{
    public interface IConferenceRepository<T>
    {
        public Task<List<PersonalConferenceModel>> GetAllConferencesAsync();
        public Task<PersonalConferenceModel> GetConferenceByIdAsync(Guid personalConferenceId);
        public Task<PersonalConferenceModel> AddConferenceAsync(T personalConference);
        public Task<bool> DeleteConferenceAsync(Guid personaConferenceId);
        public Task<bool> UsersExistAsync(Guid user1Id, Guid user2Id);
        public Task<bool> ConferenceExistsAsync(Guid user1Id, Guid user2Id);

    }
}