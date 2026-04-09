using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Syncro.Application.JWT;

namespace Syncro.Infrastructure.Services
{
    public class YandexOAuthService : IYandexOAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly IAccountService _accountService;
        private readonly IPersonalAccountInfoService _personalAccountInfoService;
        private readonly IJwtProvider _jwtProvider;
        private readonly ILogger<YandexOAuthService> _logger;
        private const string YandexUserInfoUrl = "https://login.yandex.ru/info";

        public YandexOAuthService(
            HttpClient httpClient,
            IAccountService accountService,
            IPersonalAccountInfoService personalAccountInfoService,
            IJwtProvider jwtProvider,
            ILogger<YandexOAuthService> logger)
        {
            _httpClient = httpClient;
            _accountService = accountService;
            _personalAccountInfoService = personalAccountInfoService;
            _jwtProvider = jwtProvider;
            _logger = logger;
        }

        public async Task<YandexAuthResponse> AuthenticateWithYandexTokenAsync(string yandexToken)
        {
            try
            {
                var yandexUser = await GetYandexUserInfoAsync(yandexToken);

                if (yandexUser == null || string.IsNullOrEmpty(yandexUser.DefaultEmail))
                {
                    throw new Exception("Failed to retrieve user info from Yandex or email is missing");
                }

                AccountModel? existingAccount = null;
                try
                {
                    existingAccount = await _accountService.GetAccountByEmailAsync(yandexUser.DefaultEmail);
                }
                catch (ArgumentException)
                {
                }

                AccountModel account;

                if (existingAccount != null)
                {
                    account = await UpdateYandexUserAsync(existingAccount.Id, yandexUser);
                }
                else
                {
                    account = await CreateYandexUserAsync(yandexUser);
                }

                var accessToken = GenerateAccessToken(account);

                return new YandexAuthResponse
                {
                    AccessToken = accessToken,
                    Message = existingAccount != null ? "Login successful" : "Account created and logged in successfully"
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError($"HTTP error while communicating with Yandex: {ex.Message}");
                throw new Exception($"Failed to contact Yandex authentication service: {ex.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error during Yandex authentication: {ex.Message}");
                throw;
            }
        }

        private async Task<YandexUserResponse?> GetYandexUserInfoAsync(string yandexToken)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, YandexUserInfoUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", yandexToken);
            request.Headers.Add("Accept", "application/json");

            using var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Yandex API error: {response.StatusCode} - {errorContent}");
                throw new Exception($"Yandex API returned error: {response.StatusCode}");
            }

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var yandexUser = JsonSerializer.Deserialize<YandexUserResponse>(content, options);
            return yandexUser;
        }

        private async Task<AccountModel> CreateYandexUserAsync(YandexUserResponse yandexUser)
        {
            var nickname = await GenerateUniqueNicknameAsync(yandexUser);

            var randomPassword = GenerateRandomPassword();
            var hashedPassword = BCrypt.Net.BCrypt.EnhancedHashPassword(randomPassword);

            var newAccount = new AccountModel
            {
                Id = Guid.NewGuid(),
                nickname = nickname,
                email = yandexUser.DefaultEmail,
                password = hashedPassword,
                firstname = yandexUser.FirstName,
                lastname = yandexUser.LastName,
                phonenumber = yandexUser.DefaultPhone?.Number ?? string.Empty
            };

            var createdAccount = await _accountService.CreateAccountAsync(newAccount);
            await _personalAccountInfoService.CreatePersonalAccountInfoAsync(createdAccount.Id);

            return createdAccount;
        }

        private async Task<AccountModel> UpdateYandexUserAsync(Guid accountId, YandexUserResponse yandexUser)
        {
            var updateDto = new AccountPartialUpdateDTO
            {
                firstname = yandexUser.FirstName,
                lastname = yandexUser.LastName,
                phonenumber = yandexUser.DefaultPhone?.Number
            };

            var updatedAccount = await _accountService.UpdateAccountPartialAsync(accountId, updateDto);

            return updatedAccount;
        }

        private async Task<string> GenerateUniqueNicknameAsync(YandexUserResponse yandexUser)
        {
            string baseNickname = !string.IsNullOrWhiteSpace(yandexUser.Login)
                ? yandexUser.Login
                : $"user_{Guid.NewGuid():N}";

            async Task<bool> IsNicknameTaken(string nickname)
            {
                try
                {
                    await _accountService.GetAccountByNicknameAsync(nickname);
                    return true;
                }
                catch (ArgumentException)
                {
                    return false;
                }
            }

            if (!await IsNicknameTaken(baseNickname))
            {
                return baseNickname;
            }


            for (int suffix = 1; suffix <= 10000; suffix++)
            {
                string candidate = $"{baseNickname}_{suffix}";
                if (!await IsNicknameTaken(candidate))
                    return candidate;
            }
            return $"{baseNickname}_{Guid.NewGuid():N[..8]}";
        }

        private string GenerateRandomPassword()
        {
            const string validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
            var random = new Random();
            var password = new System.Text.StringBuilder();

            for (int i = 0; i < 16; i++)
            {
                password.Append(validChars[random.Next(validChars.Length)]);
            }
            return password.ToString();
        }

        private string GenerateAccessToken(AccountModel account)
        {
            return _jwtProvider.GenerateToken(account);
        }
    }
}
