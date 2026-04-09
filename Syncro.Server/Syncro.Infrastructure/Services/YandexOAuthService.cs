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
            _logger.LogInformation($"пользователь такой");
            _logger.LogInformation($"{yandexUser.Login} - логин");
            _logger.LogInformation($"{yandexUser.Id} - id");
            _logger.LogInformation($"{yandexUser.DefaultEmail} - default email");
            _logger.LogInformation($"{yandexUser.FirstName} - Имя");
            _logger.LogInformation($"{yandexUser.LastName} - Фамилия");
            _logger.LogInformation($"{yandexUser.RealName} - Реальное имя?");
            _logger.LogInformation($"{yandexUser.DefaultPhone.Number} - телефон");
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

        private async Task<string> GenerateUniqueNicknameAsync(YandexUserResponse yandexUser)
        {
            _logger.LogInformation($"Попали в метод генерации никнейма");
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
                _logger.LogInformation($"Вернули никнейм {baseNickname} - базовый");
                return baseNickname;
            }


            for (int suffix = 1; suffix <= 10000; suffix++)
            {
                string candidate = $"{baseNickname}_{suffix}";
                if (!await IsNicknameTaken(candidate))
                    _logger.LogInformation($"Вернули никнейм {candidate} - измененный");
                return candidate;
            }
            _logger.LogInformation($"Вернули никнейм рандомный");
            return $"{baseNickname}_{Guid.NewGuid():N[..8]}";
        }

        private string GenerateRandomPassword()
        {
            _logger.LogInformation($"Генерим пароль");
            const string validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
            var random = new Random();
            var password = new System.Text.StringBuilder();

            for (int i = 0; i < 16; i++)
            {
                password.Append(validChars[random.Next(validChars.Length)]);
            }
            _logger.LogInformation($"{password.ToString()} - Итоговый пароль");
            return password.ToString();
        }

        private string GenerateAccessToken(AccountModel account)
        {
            _logger.LogInformation($"Генерим токен");
            return _jwtProvider.GenerateToken(account);
        }
    }
}
