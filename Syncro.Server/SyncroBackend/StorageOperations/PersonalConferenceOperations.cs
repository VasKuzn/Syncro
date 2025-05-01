namespace SyncroBackend.StorageOperations
{
    public class PersonalConferenceOperations
    {
        private readonly DataBaseContext context;

        public PersonalConferenceOperations(DataBaseContext dbcontext)
        {
            this.context = dbcontext;
        }
        public Task<List<PersonalConferenceModel>> GetAll()
        {
            return context.personalConferences.ToListAsync();
        }
        public async Task<PersonalConferenceModel> AddPersonalConferenceAsync(PersonalConferenceModel personalConference)
        {
            var user1Exists = await context.accounts.AnyAsync(a => a.Id == personalConference.user1);
            var user2Exists = await context.accounts.AnyAsync(a => a.Id == personalConference.user2);
            if (!user1Exists || !user2Exists)
                throw new ArgumentException("One or both users don't exist");

            if (personalConference.user1 == personalConference.user2)
                throw new ArgumentException("Cannot create conference with yourself.");

            bool conferenceExists = await context.personalConferences.AnyAsync(p =>
            (p.user1 == personalConference.user1 && p.user2 == personalConference.user2) ||
            (p.user1 == personalConference.user2 && p.user2 == personalConference.user1));

            if (conferenceExists)
                throw new ArgumentException("Personal conference between these users already exists.");

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

    }
}