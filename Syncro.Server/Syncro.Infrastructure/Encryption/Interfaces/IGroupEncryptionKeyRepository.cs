using Syncro.Infrastructure.Encryption.Models;

namespace Syncro.Infrastructure.Encryption.Interfaces
{
    public interface IGroupEncryptionKeyRepository
    {
        Task<GroupEncryptionKey?> GetActiveGroupKeyAsync(Guid groupId);
        Task<GroupEncryptionKey?> GetGroupKeyAsync(Guid groupId, int chainId);
        Task SaveGroupKeyAsync(GroupEncryptionKey key);
        Task UpdateGroupKeyAsync(GroupEncryptionKey key);
        Task<List<GroupEncryptionKey>> GetGroupKeysAsync(Guid groupId);
        Task RotateGroupKeyAsync(Guid groupId, Guid creatorId, string newSenderKey);
    }
}