namespace SyncroBackend.Interfaces
{
    public interface IPersonalConferenceService
    {
        public Task<List<PersonalConferenceModel>> GetAllPersonalConferencesAsync();
        public Task<PersonalConferenceModel> GetPersonalConferencesByIdAsync(Guid personalConferenceId);
        public Task<PersonalConferenceModel> CreatePersonalConferenceAsync(PersonalConferenceModel message);
        public Task<bool> DeletePersonalConferenceAsync(Guid personalConferenceId);

    }
}