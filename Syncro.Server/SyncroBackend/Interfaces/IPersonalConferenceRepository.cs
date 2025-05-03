namespace SyncroBackend.Interfaces
{
    public interface IPersonalConferenceRepository
    {
        public Task<List<PersonalConferenceModel>> GetAllPersonalConferencesAsync();
        public Task<PersonalConferenceModel> GetPersonalConferenceByIdAsync(Guid personalConferenceId);
        public Task<PersonalConferenceModel> AddPersonalConferenceAsync(PersonalConferenceModel personalConference);
        public Task<bool> DeletePersonalConferenceAsync(Guid personaConferenceId);
        public Task<bool> UsersExistAsync(Guid user1Id, Guid user2Id);
        public Task<bool> ConferenceExistsAsync(Guid user1Id, Guid user2Id);

    }
}