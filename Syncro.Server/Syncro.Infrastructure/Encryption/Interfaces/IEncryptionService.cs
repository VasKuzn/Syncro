using Syncro.Infrastructure.Encryption.Models;

namespace Syncro.Infrastructure.Encryption.Interfaces
{
    public interface IEncryptionService
    {
        Task<EncryptionResult> EncryptMessageAsync(string plaintext, Guid senderId, Guid recipientId, Guid? groupId = null);
        Task<DecryptionResult> DecryptMessageAsync(string encryptedBase64, string metadataJson, Guid senderId);
        Task<KeyPair> GenerateKeyPairAsync(Guid userId);
        Task<string> GetPublicKeyAsync(Guid userId);
        Task<bool> InitializeSessionAsync(Guid userId, Guid contactId, string contactPublicKey);
        Task<bool> HasSessionAsync(Guid userId, Guid contactId);
        Task<GroupKeyBundle> CreateGroupSessionAsync(Guid groupId, Guid creatorId, List<Guid> memberIds);
    }
}