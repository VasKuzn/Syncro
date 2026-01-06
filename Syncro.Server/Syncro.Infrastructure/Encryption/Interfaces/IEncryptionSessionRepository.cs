using Syncro.Infrastructure.Encryption.Models;

namespace Syncro.Infrastructure.Encryption.Interfaces
{
    public interface IEncryptionSessionRepository
    {
        Task<EncryptionSession?> GetSessionAsync(Guid userId, Guid? contactId);
        Task SaveSessionAsync(EncryptionSession session);
        Task UpdateSessionAsync(EncryptionSession session);
        Task DeleteSessionAsync(Guid sessionId);
        Task<List<EncryptionSession>> GetUserSessionsAsync(Guid userId);
    }
}