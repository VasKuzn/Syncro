namespace Syncro.Infrastructure.Services
{
    public class GroupConferenceMemberService : IGroupConferenceMemberService
    {
        private readonly IGroupConferenceMemberRepository _groupConferenceMemberRepository;

        public GroupConferenceMemberService(IGroupConferenceMemberRepository groupConferenceMemberRepository)
        {
            _groupConferenceMemberRepository = groupConferenceMemberRepository;
        }

        public async Task<GroupConferenceMemberModel> CreateConferenceMemberAsync(GroupConferenceMemberModel groupConferenceMember)
        {
            return await _groupConferenceMemberRepository.AddConferenceMemberAsync(groupConferenceMember);
        }

        public async Task<bool> DeleteGroupMemberAsync(Guid conferenceMemberId)
        {
            return await _groupConferenceMemberRepository.DeleteGroupMemberAsync(conferenceMemberId);
        }

        public async Task<List<GroupConferenceMemberModel>> GetAllGroupConferenceMembersAsync()
        {
            return await _groupConferenceMemberRepository.GetAllMembersAsync() ?? throw new ArgumentException("No members found");
        }

        public async Task<List<GroupConferenceMemberModel>> GetAllMembersByConferenceAsync(Guid conferenceId)
        {
            return await _groupConferenceMemberRepository.GetAllMembersByConferenceAsync(conferenceId) ?? throw new ArgumentException("No members of conference found");
        }

        public async Task<GroupConferenceMemberModel> GetMemberByIdAsync(Guid conferenceMemberId)
        {
            return await _groupConferenceMemberRepository.GetMemberByIdAsync(conferenceMemberId) ?? throw new ArgumentException("Member is not found");
        }

        public async Task<GroupConferenceMemberModel> GetMemberByIdByConferenceAsync(Guid conferenceMemberId, Guid conferenceId)
        {
            return await _groupConferenceMemberRepository.GetMemberByIdByConferenceAsync(conferenceMemberId, conferenceId) ?? throw new ArgumentException($"No member in {conferenceId} found");
        }

        public async Task<GroupConferenceMemberModel> UpdateConferenceMemberAsync(Guid conferenceMemberId, ConferenceMemberModelDTO conferenceMemberModelDto)
        {
            if (string.IsNullOrWhiteSpace(conferenceMemberModelDto.groupConferenceNickname))
                throw new ArgumentException("Nickname cannot be empty to change");
            var editedGroupMember = await GetMemberByIdAsync(conferenceMemberId);
            editedGroupMember.groupConferenceNickname = conferenceMemberModelDto.groupConferenceNickname;
            return await _groupConferenceMemberRepository.UpdateConferenceMemberAsync(editedGroupMember);
        }
    }
}