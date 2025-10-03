namespace Syncro.Infrastructure.Repositories
{
    public class GroupConferenceRepository : IGroupConferenceRepository<GroupConferenceModel>
    {
        private readonly DataBaseContext _context;

        public GroupConferenceRepository(DataBaseContext dbcontext)
        {
            this._context = dbcontext;
        }
        public async Task<List<GroupConferenceModel>> GetAllConferencesAsync()
        {
            return await _context.groupConferences.ToListAsync();
        }
        public async Task<List<GroupConferenceModel>> GetAllConferencesByAccountAsync(Guid accountId)
        {
            var conferences = await _context.groupConferenceMembers
                .Where(m => m.accountId == accountId)
                .Join(
                    _context.groupConferences,
                    member => member.groupConferenceId,
                    conference => conference.Id,
                    (member, conference) => conference
                )
                .ToListAsync();

            return conferences;
        }

        public async Task<GroupConferenceModel> GetConferenceByIdAsync(Guid groupConferenceId)
        {
            return await _context.groupConferences.FirstOrDefaultAsync(g => g.Id == groupConferenceId) ?? throw new ArgumentException("Group conference not found");
        }
        public async Task<GroupConferenceModel> AddConferenceAsync(GroupConferenceModel groupConference)
        {
            await _context.groupConferences.AddAsync(groupConference);
            return groupConference;
        }
        public async Task<bool> DeleteConferenceAsync(Guid groupConferenceId)
        {
            var deleted = await _context.groupConferences
            .Where(p => p.Id == groupConferenceId)
            .ExecuteDeleteAsync();
            return deleted > 0;
        }

        public async Task<GroupConferenceModel> UpdateConferenceAsync(GroupConferenceModel conference)
        {
            _context.groupConferences.Update(conference);

            return conference;
        }
    }
}