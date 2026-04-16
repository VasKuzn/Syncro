namespace Syncro.Infrastructure.Services
{
    public class SteamRecommendationService : ISteamRecommendationService
    {
        private readonly ISteamRecommendationRepository _steamRecommendationRepository;

        public SteamRecommendationService(ISteamRecommendationRepository steamRecommendationRepository)
        {
            _steamRecommendationRepository = steamRecommendationRepository;
        }

        public async Task<SteamRecommendationModel> AddSteamRecommendationAsync(SteamRecommendationModel steamRecommendationModel)
        {
            if (steamRecommendationModel == null)
            {
                throw new ArgumentNullException(nameof(steamRecommendationModel), "steamRecommendationModel cannot be null");
            }
            return await _steamRecommendationRepository.AddSteamRecommendationAsync(steamRecommendationModel);
        }

        public async Task<bool> DeleteSteamRecommendationAsync(Guid steamRecommendationId)
        {
            return await _steamRecommendationRepository.DeleteSteamRecommendationAsync(steamRecommendationId);
        }

        public async Task<SteamRecommendationModel?> GetSteamRecommendationByAccountIdAsync(Guid accountId)
        {
            return await _steamRecommendationRepository.GetSteamRecommendationByAccountIdAsync(accountId);
        }

        public async Task<List<Guid>> GetSteamRecommendationsByAccountGamesAsync(Guid accountId)
        {
            return await _steamRecommendationRepository.GetSteamRecommendationsByAccountGamesAsync(accountId);
        }

        public async Task<SteamRecommendationModel> UpdateSteamRecommendationAsync(Guid accountId, SteamRecommendationDTO steamRecommendationDTO)
        {
            var existingSteamRecommendation = await _steamRecommendationRepository.GetSteamRecommendationByAccountIdAsync(accountId);

            existingSteamRecommendation.FirstGame = steamRecommendationDTO.FirstGame;
            existingSteamRecommendation.SecondGame = steamRecommendationDTO.SecondGame;
            existingSteamRecommendation.ThirdGame = steamRecommendationDTO.ThirdGame;
            existingSteamRecommendation.LastTimeUpdated = steamRecommendationDTO.LastTimeUpdated;

            var updatedSteamRecommendation = await _steamRecommendationRepository.UpdateSteamRecommendationAsync(existingSteamRecommendation);
            return updatedSteamRecommendation;
        }
        public async Task<SteamRecommendationModel> UpsertSteamIdAsync(Guid accountId, string steamId)
        {
            if (string.IsNullOrWhiteSpace(steamId))
                throw new ArgumentException("SteamId cannot be empty");

            var existing = await _steamRecommendationRepository.GetSteamRecommendationByAccountIdAsync(accountId);

            if (existing != null)
            {
                existing.SteamId = steamId;
                return await _steamRecommendationRepository.UpdateSteamRecommendationAsync(existing);
            }
            else
            {
                var newRecord = new SteamRecommendationModel
                {
                    AccountId = accountId,
                    SteamId = steamId,
                };
                return await _steamRecommendationRepository.AddSteamRecommendationAsync(newRecord);
            }
        }
    }
}