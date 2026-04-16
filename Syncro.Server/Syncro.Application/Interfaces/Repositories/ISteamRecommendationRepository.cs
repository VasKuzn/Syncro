namespace Syncro.Application.Repositories
{
    public interface ISteamRecommendationRepository
    {
        Task<SteamRecommendationModel?> GetSteamRecommendationByAccountIdAsync(Guid accountId);
        Task<SteamRecommendationModel> AddSteamRecommendationAsync(SteamRecommendationModel steamRecommendationModel);
        Task<SteamRecommendationModel> UpdateSteamRecommendationAsync(SteamRecommendationModel steamRecommendationModel);
        Task<bool> DeleteSteamRecommendationAsync(Guid steamRecommendationId);
        Task<List<Guid>> GetSteamRecommendationsByAccountGamesAsync(Guid accountId);
    }
}