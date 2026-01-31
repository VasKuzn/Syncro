using Syncro.Infrastructure.Exceptions;

namespace Syncro.Infrastructure.Services
{
    public class PersonalConferenceService : IConferenceService<PersonalConferenceModel>
    {
        private readonly IConferenceRepository<PersonalConferenceModel> _personalConferenceRepository;

        public PersonalConferenceService(IConferenceRepository<PersonalConferenceModel> personalConferenceRepository)
        {
            _personalConferenceRepository = personalConferenceRepository;
        }
        public async Task<List<PersonalConferenceModel>> GetAllConferencesAsync()
        {
            return await _personalConferenceRepository.GetAllConferencesAsync();
        }
        public async Task<List<PersonalConferenceModel>> GetAllConferencesByAccountAsync(Guid id)
        {
            return await _personalConferenceRepository.GetAllConferencesByAccountAsync(id);
        }

        public async Task<PersonalConferenceModel> GetConferenceByIdAsync(Guid personalConferenceId)
        {
            return await _personalConferenceRepository.GetConferenceByIdAsync(personalConferenceId);
        }
        public async Task<PersonalConferenceModel> CreateConferenceAsync(PersonalConferenceModel personalConference)
        {
            if (personalConference.user1 == personalConference.user2)
                throw new ArgumentException("Cannot create personal conference with yourself.");

            if (!await _personalConferenceRepository.UsersExistAsync(personalConference.user1, personalConference.user2))
                throw new ArgumentException("One or both users don't exist");

            if (await _personalConferenceRepository.ConferenceExistsAsync(personalConference.user1, personalConference.user2))
                throw new ConflictException("Personal conference between these users already exists.");


            return await _personalConferenceRepository.AddConferenceAsync(personalConference);
        }

        public async Task<bool> DeleteConferenceAsync(Guid personalConferenceId)
        {
            return await _personalConferenceRepository.DeleteConferenceAsync(personalConferenceId);
        }
    }
}