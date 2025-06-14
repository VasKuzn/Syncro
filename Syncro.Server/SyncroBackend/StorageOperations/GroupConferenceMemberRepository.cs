using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SyncroBackend.StorageOperations
{
    public class GroupConferenceMemberRepository : IGroupConferenceMemberRepository
    {
        private readonly DataBaseContext _context;

        public GroupConferenceMemberRepository(DataBaseContext dbcontext)
        {
            this._context = dbcontext;
        }

        public async Task<GroupConferenceMemberModel> AddConferenceMemberAsync(GroupConferenceMemberModel conferenceMember)
        {
            await _context.groupConferenceMembers.AddAsync(conferenceMember);
            await _context.SaveChangesAsync();
            return conferenceMember;
        }

        public async Task<bool> DeleteGroupMemberAsync(Guid conferenceMemberId)
        {
            var deleted = await _context.groupConferenceMembers
                .Where(a => a.Id == conferenceMemberId)
                .ExecuteDeleteAsync();
            return deleted > 0;
        }

        public async Task<List<GroupConferenceMemberModel>> GetAllMembersAsync()
        {
            return await _context.groupConferenceMembers.ToListAsync();
        }

        public async Task<List<GroupConferenceMemberModel>> GetAllMembersByConferenceAsync(Guid conferenceId)
        {
            return await _context.groupConferenceMembers.Where(g => g.groupConferenceId == conferenceId).ToListAsync() ?? throw new ArgumentException("Members not found");
        }

        public async Task<GroupConferenceMemberModel> GetMemberByIdAsync(Guid conferenceMemberId)
        {
            return await _context.groupConferenceMembers.FirstOrDefaultAsync(g => g.accountId == conferenceMemberId) ?? throw new ArgumentException("Member not found");
        }

        public async Task<GroupConferenceMemberModel> GetMemberByIdByConferenceAsync(Guid conferenceMemberId, Guid conferenceId)
        {
            return await _context.groupConferenceMembers.FirstOrDefaultAsync(g => g.accountId == conferenceMemberId && g.groupConferenceId == conferenceId) ?? throw new ArgumentException("Member not found");
        }

        public async Task<GroupConferenceMemberModel> UpdateConferenceMemberAsync(GroupConferenceMemberModel conferenceMember)
        {
            _context.groupConferenceMembers.Update(conferenceMember);
            await _context.SaveChangesAsync();
            return conferenceMember;
        }
    }
}