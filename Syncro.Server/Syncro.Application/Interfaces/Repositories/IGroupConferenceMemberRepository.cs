namespace Syncro.Application.Repositories
{
    public interface IGroupConferenceMemberRepository
    {
        public Task<List<GroupConferenceMemberModel>> GetAllMembersAsync();
        public Task<List<GroupConferenceMemberModel>> GetAllMembersByConferenceAsync(Guid conferenceId);
        public Task<GroupConferenceMemberModel> GetMemberByIdAsync(Guid conferenceMemberId);
        public Task<GroupConferenceMemberModel> GetMemberByIdByConferenceAsync(Guid conferenceMemberId, Guid conferenceId);
        public Task<GroupConferenceMemberModel> AddConferenceMemberAsync(GroupConferenceMemberModel groupConferenceMember);
        public Task<bool> DeleteGroupMemberAsync(Guid conferenceMemberId);
        public Task<GroupConferenceMemberModel> UpdateConferenceMemberAsync(GroupConferenceMemberModel groupConferenceMember);

    }
}