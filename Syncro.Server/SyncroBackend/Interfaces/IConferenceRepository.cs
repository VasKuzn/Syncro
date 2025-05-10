namespace SyncroBackend.Interfaces
{
    public interface IConferenceRepository<T>
    {
        public Task<List<T>> GetAllConferencesAsync();
        public Task<T> GetConferenceByIdAsync(Guid conferenceId);
        public Task<T> AddConferenceAsync(T conference);
        public Task<bool> DeleteConferenceAsync(Guid conferenceId);
        public Task<bool> UsersExistAsync(Guid user1Id, Guid user2Id);
        public Task<bool> ConferenceExistsAsync(Guid user1Id, Guid user2Id);
    }
}