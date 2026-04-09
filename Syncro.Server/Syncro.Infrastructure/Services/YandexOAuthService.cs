using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Syncro.Application.Services;
using Syncro.Application.ModelsDTO;
using Syncro.Application.JWT;
using Syncro.Domain.Models;
using Syncro.Infrastructure.Exceptions;

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
                _logger.LogInformation($"Начали получать инфу от яндекса");
                var yandexUser = await GetYandexUserInfoAsync(yandexToken);
                _logger.LogInformation($"Закончили получать инфу от яндекса");
                if (yandexUser == null || string.IsNullOrEmpty(yandexUser.DefaultEmail))
                {
                    throw new Exception("Failed to retrieve user info from Yandex or email is missing");
                }
                _logger.LogInformation($"Проверка есть ли пользователь у нас в БД");
                // Проверяем существует ли уже пользователь с этим email
                AccountModel? existingAccount = null;
                try
                {
                    existingAccount = await _accountService.GetAccountByEmailAsync(yandexUser.DefaultEmail);
                    _logger.LogInformation($"ЕСТЬ");
                }
                catch (ArgumentException)
                {
                    _logger.LogInformation($"НЕТ");
                    // Пользователь не найден - это нормально
                }

                AccountModel account;

                if (existingAccount != null)
                {
                    _logger.LogInformation($"Обновили существующего");
                    // Обновляем существующего пользователя информацией из Yandex
                    account = await UpdateYandexUserAsync(existingAccount.Id, yandexUser);
                }
                else
                {
                    // Создаем нового пользователя
                    _logger.LogInformation($"Создали нового");
                    account = await CreateYandexUserAsync(yandexUser);
                    _logger.LogInformation($"{account.Id}");
                    _logger.LogInformation($"{account.firstname}");
                    _logger.LogInformation($"{account.lastname}");
                    _logger.LogInformation($"{account.nickname}");
                    _logger.LogInformation($"{account.email}");
                    _logger.LogInformation($"{account.phonenumber}");
                    _logger.LogInformation($"{account.password}");
                }

                // Генерируем JWT token
                var accessToken = GenerateAccessToken(account);
                _logger.LogInformation($"{accessToken} - access token");

                return new YandexAuthResponse
                {
                    AccessToken = accessToken,
                    Message = existingAccount != null ? "Login successful" : "Account created and logged in successfully"
                };
            }
            catch (System.Net.Http.HttpRequestException ex)
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
            _logger.LogInformation($"пользователь такой");
            _logger.LogInformation($"{yandexUser.Login} - логин");
            _logger.LogInformation($"{yandexUser.Id} - id");
            _logger.LogInformation($"{yandexUser.Emails} - emails");
            _logger.LogInformation($"{yandexUser.DefaultEmail} - default email");
            _logger.LogInformation($"{yandexUser.FirstName} - Имя");
            _logger.LogInformation($"{yandexUser.LastName} - Фамилия");
            _logger.LogInformation($"{yandexUser.RealName} - Реальное имя?");
            _logger.LogInformation($"{yandexUser.DefaultPhone} - телефон");
            return yandexUser;
        }

        private async Task<AccountModel> CreateYandexUserAsync(YandexUserResponse yandexUser)
        {
            // Генерируем уникальный никнейм если нужен
            var nickname = GenerateUniqueNickname(yandexUser);

            // Генерируем случайный пароль (он не будет использоваться, но нужен для модели)
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

            _logger.LogInformation($"New user created from Yandex OAuth: {createdAccount.Id}");

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

            _logger.LogInformation($"User updated from Yandex OAuth: {accountId}");

            return updatedAccount;
        }

        private string GenerateUniqueNickname(YandexUserResponse yandexUser)
        {
            var baseNickname = yandexUser.DisplayName ?? yandexUser.Login ?? $"user_{Guid.NewGuid().ToString().Substring(0, 8)}";

            // Если никнейм уже занят, добавляем случайный суффикс
            var nickname = baseNickname;
            var attemptCount = 0;

            while (attemptCount < 10)
            {
                try
                {
                    _accountService.GetAccountByNicknameAsync(nickname).Wait();
                    // Если не выкинулось исключение, никнейм занят
                    nickname = $"{baseNickname}_{Guid.NewGuid().ToString().Substring(0, 6)}";
                    attemptCount++;
                }
                catch (ArgumentException)
                {
                    // Никнейм свободен
                    break;
                }
            }

            if (attemptCount >= 10)
            {
                nickname = $"user_{Guid.NewGuid().ToString().Substring(0, 8)}";
            }

            return nickname;
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
