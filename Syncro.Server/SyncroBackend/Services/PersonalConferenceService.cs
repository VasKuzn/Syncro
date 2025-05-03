using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SyncroBackend.Services
{
    public class PersonalConferenceService : IPersonalConferenceService
    {
        private readonly IPersonalConferenceRepository _personalConferenceRepository;

        public PersonalConferenceService(IPersonalConferenceRepository personalConferenceRepository)
        {
            _personalConferenceRepository = personalConferenceRepository;
        }
        public async Task<List<PersonalConferenceModel>> GetAllPersonalConferencesAsync()
        {
            return await _personalConferenceRepository.GetAllPersonalConferencesAsync();
        }

        public async Task<PersonalConferenceModel> GetPersonalConferencesByIdAsync(Guid personalConferenceId)
        {
            return await _personalConferenceRepository.GetPersonalConferenceByIdAsync(personalConferenceId);
        }
        public async Task<PersonalConferenceModel> CreatePersonalConferenceAsync(PersonalConferenceModel personalConference)
        {
            if (personalConference.user1 == personalConference.user2)
                throw new ArgumentException("Cannot create personal conference with yourself.");

            if (!await _personalConferenceRepository.UsersExistAsync(personalConference.user1, personalConference.user2))
                throw new ArgumentException("One or both users don't exist");

            if (await _personalConferenceRepository.ConferenceExistsAsync(personalConference.user1, personalConference.user2))
                throw new ArgumentException("Personal conference between these users already exists.");


            return await _personalConferenceRepository.AddPersonalConferenceAsync(personalConference);
        }

        public async Task<bool> DeletePersonalConferenceAsync(Guid personalConferenceId)
        {
            return await _personalConferenceRepository.DeletePersonalConferenceAsync(personalConferenceId);
        }
    }
}