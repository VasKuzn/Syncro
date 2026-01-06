using Syncro.Infrastructure.Encryption.Models;

namespace Syncro.Infrastructure.Encryption.Interfaces
{
    public interface IUserEncryptionKeyRepository
    {
        Task<UserEncryptionKey?> GetByUserIdAsync(Guid userId);
        Task SavePublicKeyAsync(Guid userId, string publicKey);
        Task<string> GetPublicKeyAsync(Guid userId);
        Task UpdateAsync(UserEncryptionKey key);
        Task<bool> ExistsAsync(Guid userId);
    }
}