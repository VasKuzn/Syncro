using Microsoft.AspNetCore.DataProtection;

namespace Syncro.Infrastructure.Services
{
    public class DataProtectionService : IProtectionService
    {
        private readonly IDataProtector _protector;

        public DataProtectionService(IDataProtectionProvider provider)
        {
            _protector = provider.CreateProtector("Syncro.YandexCalendar.Password");
        }

        public string Encrypt(string plaintext) => _protector.Protect(plaintext);
        public string Decrypt(string ciphertext) => _protector.Unprotect(ciphertext);
    }
}
