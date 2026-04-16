namespace Syncro.Infrastructure.Repositories
{
    public class SteamRecommendationRepository : ISteamRecommendationRepository
    {
        private readonly DataBaseContext _context;

        public SteamRecommendationRepository(DataBaseContext dbcontext)
        {
            _context = dbcontext;
        }

        public async Task<SteamRecommendationModel?> GetSteamRecommendationByAccountIdAsync(Guid accountId)
        {
            return await _context.SteamRecommendations.FirstOrDefaultAsync(s => s.AccountId == accountId);
        }
        public async Task<SteamRecommendationModel> AddSteamRecommendationAsync(SteamRecommendationModel steamRecommendationModel)
        {
            await _context.SteamRecommendations.AddAsync(steamRecommendationModel);
            await _context.SaveChangesAsync();
            return steamRecommendationModel;
        }

        public async Task<SteamRecommendationModel> UpdateSteamRecommendationAsync(SteamRecommendationModel steamRecommendationModel)
        {
            _context.SteamRecommendations.Update(steamRecommendationModel);
            await _context.SaveChangesAsync();
            return steamRecommendationModel;
        }

        public async Task<bool> DeleteSteamRecommendationAsync(Guid steamRecommendationId)
        {
            var deleted = await _context.SteamRecommendations
                .Where(a => a.AccountId == steamRecommendationId)
                .ExecuteDeleteAsync();
            return deleted > 0;
        }
        public async Task<List<Guid>> GetSteamRecommendationsByAccountGamesAsync(Guid accountId)
        {
            var srm = await GetSteamRecommendationByAccountIdAsync(accountId);

            var matchingAccountIds = await _context.SteamRecommendations
                .Where(s =>
                    s.FirstGame == srm.FirstGame || s.FirstGame == srm.SecondGame || s.FirstGame == srm.ThirdGame ||
                    s.SecondGame == srm.FirstGame || s.SecondGame == srm.SecondGame || s.SecondGame == srm.ThirdGame ||
                    s.ThirdGame == srm.FirstGame || s.ThirdGame == srm.SecondGame || s.ThirdGame == srm.ThirdGame)
                .Select(s => s.AccountId)
                .ToListAsync();

            return matchingAccountIds;
        }
    }
}