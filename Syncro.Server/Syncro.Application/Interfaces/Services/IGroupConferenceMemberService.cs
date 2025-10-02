namespace Syncro.Application.Services
{
    public interface IGroupConferenceMemberService
    {
        public Task<List<GroupConferenceMemberModel>> GetAllGroupConferenceMembersAsync();
        public Task<List<GroupConferenceMemberModel>> GetAllMembersByConferenceAsync(Guid conferenceId);
        public Task<GroupConferenceMemberModel> GetMemberByIdAsync(Guid conferenceMemberId);
        public Task<GroupConferenceMemberModel> GetMemberByIdByConferenceAsync(Guid conferenceMemberId, Guid conferenceId);
        public Task<GroupConferenceMemberModel> CreateConferenceMemberAsync(GroupConferenceMemberModel groupConferenceMember);
        public Task<bool> DeleteGroupMemberAsync(Guid conferenceMemberId);
        public Task<GroupConferenceMemberModel> UpdateConferenceMemberAsync(Guid conferenceMemberId, ConferenceMemberModelDTO conferenceMemberModelDto);
    }
}