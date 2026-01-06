using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Syncro.Infrastructure.Encryption.Models
{
    public class UserEncryptionKey
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string PublicKey { get; set; } = null!;
        public string? SignedPreKey { get; set; }
        public string? OneTimePreKeys { get; set; } // JSON массив одноразовых ключей
        public string? IdentityKey { get; set; }
        public DateTime LastUpdated { get; set; }
    }
    public class EncryptionSession
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid ContactId { get; set; } // Для кого эта сессия
        public string SessionData { get; set; } = null!; // JSON с данными сессии
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUsed { get; set; }
    }
    public class GroupEncryptionKey
    {
        public Guid Id { get; set; }
        public Guid GroupConferenceId { get; set; }
        public string SenderKey { get; set; } = null!; // Ключ отправителя для группы
        public string DistributionMessage { get; set; } = null!; // Зашифрованные ключи для участников
        public Guid CreatorId { get; set; }
        public int ChainId { get; set; } = 0; // Идентификатор цепочки для смены ключей
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; } = true;
    }
    public class KeyPair
    {
        public string PublicKey { get; set; } = null!;
        public string PrivateKey { get; set; } = null!;
    }

    public class SessionData
    {
        public string SharedSecret { get; set; } = null!;
        public string ContactPublicKey { get; set; } = null!;
        public string UserPrivateKey { get; set; } = null!;
        public DateTime EstablishedAt { get; set; }
    }

    public class GroupKeyBundle
    {
        public Guid GroupId { get; set; }
        public string SenderKey { get; set; } = null!;
        public Dictionary<Guid, string> DistributionMessages { get; set; } = null!;
    }
    public class EncryptionMetadata
    {
        public int Version { get; set; } = 1;
        public DateTime Timestamp { get; set; }
        public Guid SenderId { get; set; }
        public Guid? RecipientId { get; set; }
        public Guid? GroupId { get; set; }
        public string IV { get; set; } = null!; // Initialization Vector в Base64
        public int? ChainId { get; set; } // Для групповых сообщений
        public string Algorithm { get; set; } = "AES-256-CBC";
        public string KeyDerivation { get; set; } = "ECDH-HKDF";
        public string? Note { get; set; }
    }

    public class EncryptionResult
    {
        public byte[] EncryptedData { get; set; } = null!;
        public string EncryptedBase64 { get; set; } = null!;
        public EncryptionMetadata Metadata { get; set; } = null!;
    }

    public class DecryptionResult
    {
        public string Plaintext { get; set; } = null!;
        public bool Success { get; set; }
        public string? Error { get; set; }
    }
}