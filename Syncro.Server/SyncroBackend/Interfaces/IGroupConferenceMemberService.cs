using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SyncroBackend.Interfaces
{
    public interface IGroupConferenceMemberService
    {
        public Task<List<GroupConferenceMemberModel>> GetAllGroupConferenceMembersAsync();
        public Task<List<GroupConferenceMemberModel>> GetAllMembersByConferenceAsync(Guid conferenceId);
        public Task<GroupConferenceMemberModel> GetMemberByIdAsync(Guid conferenceMemberId);
        public Task<GroupConferenceMemberModel> GetMemberByIdByConferenceAsync(Guid conferenceMemberId, Guid conferenceId);
        public Task<GroupConferenceMemberModel> CreateConferenceMemberAsync(GroupConferenceMemberModel groupConferenceMember);
        public Task<bool> DeleteGroupMemberAsync(Guid conferenceMemberId);
        public Task<GroupConferenceMemberModel> UpdateConferenceMemberAsync(Guid conferenceMemberId, ConferenceMemberModelDto conferenceMemberModelDto);
    }
}