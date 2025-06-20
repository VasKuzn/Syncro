
namespace SyncroBackend.Services
{
    public class GroupConferenceService : IGroupConferenceService<GroupConferenceModel>
    {
        // Подумать, что тут добавить. Суховато
        private readonly IGroupConferenceRepository<GroupConferenceModel> _groupConferenceRepository;

        public GroupConferenceService(IGroupConferenceRepository<GroupConferenceModel> groupConferenceRepository)
        {
            _groupConferenceRepository = groupConferenceRepository;
        }

        public async Task<List<GroupConferenceModel>> GetAllConferencesAsync()
        {
            return await _groupConferenceRepository.GetAllConferencesAsync();
        }
        public async Task<List<GroupConferenceModel>> GetAllConferencesByAccountAsync(Guid id)
        {
            return await _groupConferenceRepository.GetAllConferencesByAccountAsync(id);
        }

        public async Task<GroupConferenceModel> GetConferenceByIdAsync(Guid groupConferenceId)
        {
            return await _groupConferenceRepository.GetConferenceByIdAsync(groupConferenceId);
        }

        public async Task<GroupConferenceModel> CreateConferenceAsync(GroupConferenceModel groupConference)
        {
            return await _groupConferenceRepository.AddConferenceAsync(groupConference);
        }

        public async Task<bool> DeleteConferenceAsync(Guid conferenceId)
        {
            return await _groupConferenceRepository.DeleteConferenceAsync(conferenceId);
        }

        public async Task<GroupConferenceModel> UpdateConferenceAsync(Guid conferenceId, string conferenceNickname)
        {
            if (string.IsNullOrWhiteSpace(conferenceNickname))
                throw new ArgumentException("Nickname of conference cannot be empty");
            var editedGroupConference = await GetConferenceByIdAsync(conferenceId);

            editedGroupConference.conferenceName = conferenceNickname;
            return await _groupConferenceRepository.UpdateConferenceAsync(editedGroupConference);
        }
    }
}