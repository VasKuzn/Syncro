using Syncro.Application.ModelsDTO;

namespace Syncro.Application.Services
{
    public interface IYandexOAuthService
    {
        Task<YandexAuthResponse> AuthenticateWithYandexTokenAsync(string yandexToken);
    }
}
