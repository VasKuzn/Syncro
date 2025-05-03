namespace SyncroBackend.StorageOperations
{
    public class PersonalConferenceRepository : IPersonalConferenceRepository
    {
        private readonly DataBaseContext context;

        public PersonalConferenceRepository(DataBaseContext dbcontext)
        {
            this.context = dbcontext;
        }
        public async Task<List<PersonalConferenceModel>> GetAllPersonalConferencesAsync()
        {
            return await context.personalConferences.ToListAsync();
        }

        public async Task<PersonalConferenceModel> GetPersonalConferenceByIdAsync(Guid personalConferenceId)
        {
            return await context.personalConferences.FirstOrDefaultAsync(p => p.Id == personalConferenceId) ?? throw new ArgumentException("Personal conference not found");
        }

        public async Task<PersonalConferenceModel> AddPersonalConferenceAsync(PersonalConferenceModel personalConference)
        {
            personalConference.startingDate = DateTime.UtcNow;
            personalConference.lastActivity = DateTime.UtcNow;

            await context.personalConferences.AddAsync(personalConference);
            await context.SaveChangesAsync();
            return personalConference;
        }
        public async Task<bool> DeletePersonalConferenceAsync(Guid personaConferenceId)
        {
            var deleted = await context.personalConferences
            .Where(p => p.Id == personaConferenceId)
            .ExecuteDeleteAsync();
            return deleted > 0;
        }

        public async Task<bool> UsersExistAsync(Guid user1Id, Guid user2Id)
        {
            return await context.accounts.CountAsync(a => a.Id == user1Id || a.Id == user2Id) == 2;
        }

        public async Task<bool> ConferenceExistsAsync(Guid user1Id, Guid user2Id)
        {
            return await context.personalConferences.AnyAsync(p => (p.user1 == user1Id && p.user2 == user2Id) || (p.user1 == user2Id && p.user2 == user1Id));
        }
    }
}