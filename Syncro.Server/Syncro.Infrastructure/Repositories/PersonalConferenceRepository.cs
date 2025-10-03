namespace Syncro.Infrastructure.Repositories
{
    public class PersonalConferenceRepository : IConferenceRepository<PersonalConferenceModel>
    {
        private readonly DataBaseContext _context;

        public PersonalConferenceRepository(DataBaseContext dbcontext)
        {
            this._context = dbcontext;
        }
        public async Task<List<PersonalConferenceModel>> GetAllConferencesAsync()
        {
            return await _context.personalConferences.ToListAsync();
        }
        public async Task<List<PersonalConferenceModel>> GetAllConferencesByAccountAsync(Guid id)
        {
            var perConf = await _context.personalConferences
                .Where(p => p.user1 == id || p.user2 == id)
                .ToListAsync();

            return perConf;
        }

        public async Task<PersonalConferenceModel> GetConferenceByIdAsync(Guid personalConferenceId)
        {
            return await _context.personalConferences.FirstOrDefaultAsync(p => p.Id == personalConferenceId) ?? throw new ArgumentException("Personal conference not found");
        }

        public async Task<PersonalConferenceModel> AddConferenceAsync(PersonalConferenceModel personalConference)
        {
            personalConference.startingDate = DateTime.UtcNow;
            personalConference.lastActivity = DateTime.UtcNow;

            await _context.personalConferences.AddAsync(personalConference);
            return personalConference;
        }
        public async Task<bool> DeleteConferenceAsync(Guid personaConferenceId)
        {
            var deleted = await _context.personalConferences
            .Where(p => p.Id == personaConferenceId)
            .ExecuteDeleteAsync();
            return deleted > 0;
        }

        public async Task<bool> UsersExistAsync(Guid user1Id, Guid user2Id)
        {
            return await _context.accounts.CountAsync(a => a.Id == user1Id || a.Id == user2Id) == 2;
        }

        public async Task<bool> ConferenceExistsAsync(Guid user1Id, Guid user2Id)
        {
            return await _context.personalConferences.AnyAsync(p => (p.user1 == user1Id && p.user2 == user2Id) || (p.user1 == user2Id && p.user2 == user1Id));
        }
    }
}