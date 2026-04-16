using Syncro.Application.Repositories;
using Syncro.Application.TransferModels;

namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/steamrecommendations")]
    [Authorize]
    public class SteamRecommendationsController : ControllerBase
    {
        private readonly ISteamRecommendationService _steamRecommendationService;
        private readonly IAccountService _accountService;
        private readonly ILogger<SteamRecommendationsController> _logger;
        private readonly IConfiguration _configuration;

        public SteamRecommendationsController(
            ISteamRecommendationService steamRecommendationService,
            IAccountService accountService,
            IConfiguration configuration,
            ILogger<SteamRecommendationsController> logger)
        {
            _steamRecommendationService = steamRecommendationService;
            _accountService = accountService;
            _configuration = configuration;
            _logger = logger;
        }

        private Guid GetCurrentUserId()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                throw new UnauthorizedAccessException("User is not authenticated.");
            return userId;
        }
        [HttpGet("games")]
        public async Task<ActionResult<object>> GetRecentlyPlayedGames()
        {
            try
            {
                var userId = GetCurrentUserId();
                var recommendation = await _steamRecommendationService.GetSteamRecommendationByAccountIdAsync(userId);
                if (recommendation == null || string.IsNullOrEmpty(recommendation.SteamId))
                    return BadRequest(new { message = "Steam ID не привязан в настройках аккаунта" });

                var steamId = recommendation.SteamId;
                var apiKey = _configuration["Steam:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                    return StatusCode(500, new { message = "Steam API key не настроен на сервере" });

                using var httpClient = new HttpClient();
                var steamUrl = $"https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key={apiKey}&steamid={steamId}&format=json";

                var response = await httpClient.GetAsync(steamUrl);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, new { message = "Ошибка при запросе к Steam API", details = content });

                return Ok(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching games from Steam API");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }
        // GET: api/steamrecommendations/me
        [HttpGet("me")]
        public async Task<ActionResult<SteamRecommendationModel>> GetMySteamRecommendation()
        {
            try
            {
                var userId = GetCurrentUserId();
                var recommendation = await _steamRecommendationService.GetSteamRecommendationByAccountIdAsync(userId);
                if (recommendation == null)
                    return NotFound(new { message = "Steam recommendation not found for current user" });
                return Ok(recommendation);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting steam recommendation for current user");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/steamrecommendations/me
        [HttpPost("me")]
        public async Task<ActionResult<SteamRecommendationModel>> UpsertMySteamId([FromBody] SteamIdRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = GetCurrentUserId();
                var result = await _steamRecommendationService.UpsertSteamIdAsync(userId, request.SteamId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upserting steam id for current user");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/steamrecommendations/account/{accountId}
        [HttpGet("account/{accountId}")]
        public async Task<ActionResult<SteamRecommendationModel>> GetByAccountId(Guid accountId)
        {
            try
            {
                var recommendation = await _steamRecommendationService.GetSteamRecommendationByAccountIdAsync(accountId);
                if (recommendation == null)
                    return NotFound(new { message = "Steam recommendation not found for this account" });
                return Ok(recommendation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting steam recommendation for account {AccountId}", accountId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/steamrecommendations
        [HttpPost]
        public async Task<ActionResult<SteamRecommendationModel>> AddSteamRecommendation([FromBody] SteamRecommendationModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var created = await _steamRecommendationService.AddSteamRecommendationAsync(model);
                return CreatedAtAction(nameof(GetByAccountId), new { accountId = created.AccountId }, created);
            }
            catch (ArgumentNullException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating steam recommendation");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PUT: api/steamrecommendations/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<SteamRecommendationModel>> UpdateSteamRecommendation(Guid id, [FromBody] SteamRecommendationDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var updated = await _steamRecommendationService.UpdateSteamRecommendationAsync(id, dto);
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating steam recommendation with id {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // DELETE: api/steamrecommendations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSteamRecommendation(Guid id)
        {
            try
            {
                var deleted = await _steamRecommendationService.DeleteSteamRecommendationAsync(id);
                if (!deleted)
                    return NotFound(new { message = $"Steam recommendation with id {id} not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting steam recommendation with id {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/steamrecommendations/{accountId}/matches
        [HttpGet("{accountId}/matches")]
        public async Task<ActionResult<List<SteamMatchAccountModel>>> GetMatchesByAccountGames(Guid accountId)
        {
            try
            {
                // 1. Получаем текущего пользователя и его игры
                var currentUserRecommendation = await _steamRecommendationService
                    .GetSteamRecommendationByAccountIdAsync(accountId);
                if (currentUserRecommendation == null)
                    return NotFound(new { message = "Steam recommendation not found for current user" });

                var currentUserGameIds = new List<int>();
                if (int.TryParse(currentUserRecommendation.FirstGame, out int fg)) currentUserGameIds.Add(fg);
                if (int.TryParse(currentUserRecommendation.SecondGame, out int sg)) currentUserGameIds.Add(sg);
                if (int.TryParse(currentUserRecommendation.ThirdGame, out int tg)) currentUserGameIds.Add(tg);

                // 2. Получаем ID аккаунтов с совпадениями (уже отфильтровано репозиторием)
                var matchingAccountIds = await _steamRecommendationService
                    .GetSteamRecommendationsByAccountGamesAsync(accountId);

                // 3. Исключаем самого себя
                matchingAccountIds = matchingAccountIds.Where(id => id != accountId).ToList();

                var result = new List<SteamMatchAccountModel>();

                foreach (var matchedAccountId in matchingAccountIds)
                {
                    var userAccount = await _accountService.GetAccountByIdAsync(matchedAccountId);
                    var mapped = TranferModelsMapper.AccountNoPasswordWithIdModelMapMapper(userAccount);

                    // Загружаем рекомендации этого пользователя для определения общих игр
                    var otherRecommendation = await _steamRecommendationService
                        .GetSteamRecommendationByAccountIdAsync(matchedAccountId);

                    var commonAppIds = new List<int>();
                    if (otherRecommendation != null)
                    {
                        var otherGameIds = new List<int>();
                        if (int.TryParse(otherRecommendation.FirstGame, out int ofg)) otherGameIds.Add(ofg);
                        if (int.TryParse(otherRecommendation.SecondGame, out int osg)) otherGameIds.Add(osg);
                        if (int.TryParse(otherRecommendation.ThirdGame, out int otg)) otherGameIds.Add(otg);

                        commonAppIds = currentUserGameIds.Intersect(otherGameIds).ToList();
                    }

                    var matchModel = new SteamMatchAccountModel
                    {
                        id = mapped.id,
                        nickname = mapped.nickname,
                        email = mapped.email,
                        firstname = mapped.firstname,
                        lastname = mapped.lastname,
                        phonenumber = mapped.phonenumber,
                        avatar = mapped.avatar,
                        CommonGameAppIds = commonAppIds
                    };

                    result.Add(matchModel);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting matches for account {AccountId}", accountId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }

    public class SteamIdRequest
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string SteamId { get; set; }
    }
    public class SteamMatchAccountModel : AccountNoPasswordWithIdModel
    {
        public List<int> CommonGameAppIds { get; set; } = new();
    }
}