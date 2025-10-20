namespace Syncro.Application.Services
{
    public interface IConferenceService<T>
    {
        public Task<List<T>> GetAllConferencesAsync();
        public Task<T> GetConferenceByIdAsync(Guid conferenceId);
        public Task<T> CreateConferenceAsync(T conference);
        public Task<bool> DeleteConferenceAsync(Guid conferenceId);
        public Task<List<T>> GetAllConferencesByAccountAsync(Guid id);
    }
}