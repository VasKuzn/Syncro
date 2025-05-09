namespace SyncroBackend.Interfaces
{
    public interface IConferenceService<T>
    {
        public Task<List<PersonalConferenceModel>> GetAllConferencesAsync();
        public Task<PersonalConferenceModel> GetConferenceByIdAsync(Guid personalConferenceId);
        public Task<PersonalConferenceModel> CreateConferenceAsync(T message);
        public Task<bool> DeleteConferenceAsync(Guid personalConferenceId);

    }
}