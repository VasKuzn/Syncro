namespace SyncroBackend.Interfaces
{
    public interface IGroupConferenceRepository<T>
    {
        public Task<List<T>> GetAllConferencesAsync();
        public Task<T> GetConferenceByIdAsync(Guid conferenceId);
        public Task<T> AddConferenceAsync(T conference);
        public Task<bool> DeleteConferenceAsync(Guid conferenceId);
        public Task<T> UpdateConferenceAsync(T conference);
        public Task<List<T>> GetAllConferencesByAccountAsync(Guid accountId);
    }
}