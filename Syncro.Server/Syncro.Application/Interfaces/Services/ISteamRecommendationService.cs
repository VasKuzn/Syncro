namespace Syncro.Application.Repositories
{
    public interface ISteamRecommendationService
    {
        Task<SteamRecommendationModel?> GetSteamRecommendationByAccountIdAsync(Guid accountId);
        Task<SteamRecommendationModel> AddSteamRecommendationAsync(SteamRecommendationModel steamRecommendationModel);
        Task<SteamRecommendationModel> UpdateSteamRecommendationAsync(Guid accountId, SteamRecommendationDTO steamRecommendationDTO);
        Task<bool> DeleteSteamRecommendationAsync(Guid steamRecommendationId);
        Task<List<Guid>> GetSteamRecommendationsByAccountGamesAsync(Guid accountId);
        Task<SteamRecommendationModel> UpsertSteamIdAsync(Guid accountId, string steamId);
    }
}