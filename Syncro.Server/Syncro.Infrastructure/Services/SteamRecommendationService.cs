using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Syncro.Infrastructure.Services
{
    public class SteamRecommendationService : ISteamRecommendationService
    {
        private readonly ISteamRecommendationRepository _steamRecommendationRepository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SteamRecommendationService> _logger;

        public SteamRecommendationService(ISteamRecommendationRepository steamRecommendationRepository, IConfiguration configuration,
        ILogger<SteamRecommendationService> logger)
        {
            _steamRecommendationRepository = steamRecommendationRepository;
            _configuration = configuration;
            _logger = logger;
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

        public async Task<SteamRecommendationModel> RefreshGamesFromSteamAsync(Guid accountId)
        {
            var recommendation = await _steamRecommendationRepository.GetSteamRecommendationByAccountIdAsync(accountId);
            if (recommendation == null)
                throw new ArgumentException("Steam recommendation not found");
            if (string.IsNullOrEmpty(recommendation.SteamId))
                throw new InvalidOperationException("Steam ID not set");

            var apiKey = _configuration["Steam:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                throw new InvalidOperationException("Steam API key not configured");

            using var httpClient = new HttpClient();
            var steamUrl = $"https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key={apiKey}&steamid={recommendation.SteamId}&format=json";
            var response = await httpClient.GetAsync(steamUrl);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to fetch games from Steam API. Status: {StatusCode}", response.StatusCode);
                throw new Exception("Failed to fetch games from Steam API");
            }

            var content = await response.Content.ReadAsStringAsync();
            var gamesData = JsonSerializer.Deserialize<SteamGamesResponse>(content);
            var games = gamesData?.response?.games;

            if (games == null || games.Count == 0)
            {
                recommendation.FirstGame = null;
                recommendation.SecondGame = null;
                recommendation.ThirdGame = null;
            }
            else
            {
                // Берём три игры с наибольшим временем игры
                var topGames = games.OrderByDescending(g => g.playtime_forever).Take(3).ToList();
                recommendation.FirstGame = topGames.ElementAtOrDefault(0)?.appid.ToString();
                recommendation.SecondGame = topGames.ElementAtOrDefault(1)?.appid.ToString();
                recommendation.ThirdGame = topGames.ElementAtOrDefault(2)?.appid.ToString();
            }

            recommendation.LastTimeUpdated = DateTime.UtcNow;
            await _steamRecommendationRepository.UpdateSteamRecommendationAsync(recommendation);
            return recommendation;
        }

        // Вспомогательные классы для десериализации (можно вынести в отдельный файл)
        private class SteamGamesResponse
        {
            public SteamResponse response { get; set; }
            public class SteamResponse
            {
                public List<SteamGame> games { get; set; }
            }
            public class SteamGame
            {
                public int appid { get; set; }
                public string name { get; set; }
                public int playtime_forever { get; set; }
                public string img_icon_url { get; set; }
            }
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