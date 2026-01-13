using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Syncro.Domain.Models;
using Syncro.Infrastructure.Encryption.Interfaces;
using Syncro.Infrastructure.Encryption.Models;

namespace Syncro.Infrastructure.Encryption.Services
{
    public class EncryptionService : IEncryptionService
    {
        private readonly IMemoryCache _cache;
        private readonly IUserEncryptionKeyRepository _keyRepository;
        private readonly IEncryptionSessionRepository _sessionRepository;
        private readonly IGroupEncryptionKeyRepository _groupKeyRepository;
        private readonly ILogger<EncryptionService> _logger;

        public EncryptionService(
            IMemoryCache cache,
            IUserEncryptionKeyRepository keyRepository,
            IEncryptionSessionRepository sessionRepository,
            IGroupEncryptionKeyRepository groupKeyRepository,
            ILogger<EncryptionService> logger)
        {
            _cache = cache;
            _keyRepository = keyRepository;
            _sessionRepository = sessionRepository;
            _groupKeyRepository = groupKeyRepository;
            _logger = logger;
        }

        public async Task<KeyPair> GenerateKeyPairAsync(Guid userId)
        {
            using var ecdh = ECDiffieHellman.Create(ECCurve.NamedCurves.nistP256);
            var privateKey = ecdh.ExportECPrivateKey();
            var publicKey = ecdh.ExportSubjectPublicKeyInfo();

            var keyPair = new KeyPair
            {
                PublicKey = Convert.ToBase64String(publicKey),
                PrivateKey = Convert.ToBase64String(privateKey)
            };

            await _keyRepository.SavePublicKeyAsync(userId, keyPair.PublicKey);

            var cacheKey = $"private_key_{userId}";
            _cache.Set(cacheKey, keyPair.PrivateKey, TimeSpan.FromHours(1));

            return keyPair;
        }

        public async Task<string> GetPublicKeyAsync(Guid userId)
        {
            return await _keyRepository.GetPublicKeyAsync(userId);
        }

        public async Task<bool> InitializeSessionAsync(Guid userId, Guid contactId, string contactPublicKey)
        {
            try
            {
                var cacheKey = $"private_key_{userId}";
                if (!_cache.TryGetValue(cacheKey, out string? privateKeyBase64) || string.IsNullOrEmpty(privateKeyBase64))
                {
                    throw new InvalidOperationException("Private key not found. Generate keys first.");
                }

                var privateKey = Convert.FromBase64String(privateKeyBase64);
                var publicKey = Convert.FromBase64String(contactPublicKey);

                using var ecdh = ECDiffieHellman.Create();
                ecdh.ImportECPrivateKey(privateKey, out _);

                using var contactEcdh = ECDiffieHellman.Create();
                contactEcdh.ImportSubjectPublicKeyInfo(publicKey, out _);

                var sharedSecret = ecdh.DeriveKeyMaterial(contactEcdh.PublicKey);

                var sessionData = new SessionData
                {
                    SharedSecret = Convert.ToBase64String(sharedSecret),
                    ContactPublicKey = contactPublicKey,
                    UserPrivateKey = privateKeyBase64,
                    EstablishedAt = DateTime.UtcNow
                };

                var sessionJson = JsonSerializer.Serialize(sessionData);

                await _sessionRepository.SaveSessionAsync(new EncryptionSession
                {
                    UserId = userId,
                    ContactId = contactId,
                    SessionData = sessionJson,
                    CreatedAt = DateTime.UtcNow,
                    LastUsed = DateTime.UtcNow
                });

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing encryption session");
                return false;
            }
        }

        public async Task<bool> HasSessionAsync(Guid userId, Guid contactId)
        {
            var session = await _sessionRepository.GetSessionAsync(userId, contactId);
            if (session == null)
            {
                session = await _sessionRepository.GetSessionAsync(contactId, userId);
            }
            return session != null;
        }

        public async Task<EncryptionResult> EncryptMessageAsync(string plaintext, Guid senderId, Guid recipientId, Guid? groupId = null)
        {
            try
            {
                if (string.IsNullOrEmpty(plaintext))
                    throw new ArgumentException("Plaintext cannot be empty");

                byte[] encryptedData;
                EncryptionMetadata metadata;

                if (groupId.HasValue)
                {
                    var result = await EncryptGroupMessageAsync(plaintext, senderId, groupId.Value);
                    encryptedData = result.EncryptedData;
                    metadata = result.Metadata;
                }
                else
                {
                    var result = await EncryptPersonalMessageAsync(plaintext, senderId, recipientId);
                    encryptedData = result.EncryptedData;
                    metadata = result.Metadata;
                }

                return new EncryptionResult
                {
                    EncryptedData = encryptedData,
                    EncryptedBase64 = Convert.ToBase64String(encryptedData),
                    Metadata = metadata
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error encrypting message");
                throw;
            }
        }

        private async Task<(byte[] EncryptedData, EncryptionMetadata Metadata)> EncryptPersonalMessageAsync(string plaintext, Guid senderId, Guid recipientId)
        {
            var session = await _sessionRepository.GetSessionAsync(senderId, recipientId);
            if (session == null)
            {
                throw new InvalidOperationException($"No encryption session found for user {senderId} and contact {recipientId}");
            }

            var sessionKey = await DeriveSessionKey(session);

            using var aes = Aes.Create();
            aes.Key = sessionKey;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor();
            using var ms = new MemoryStream();

            using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
            using (var sw = new StreamWriter(cs, Encoding.UTF8))
            {
                sw.Write(plaintext);
            }

            var encryptedData = ms.ToArray();

            var metadata = new EncryptionMetadata
            {
                Version = 1,
                Timestamp = DateTime.UtcNow,
                SenderId = senderId,
                RecipientId = recipientId,
                IV = Convert.ToBase64String(aes.IV),
                Algorithm = "AES-256-CBC",
                KeyDerivation = "ECDH-HKDF",
                Note = "Personal message encryption"
            };

            return (encryptedData, metadata);
        }

        private async Task<(byte[] EncryptedData, EncryptionMetadata Metadata)>
            EncryptGroupMessageAsync(string plaintext, Guid senderId, Guid groupId)
        {
            var groupKey = await _groupKeyRepository.GetActiveGroupKeyAsync(groupId);
            if (groupKey == null)
            {
                throw new InvalidOperationException($"No active group key found for group {groupId}");
            }

            var senderKeyBytes = Convert.FromBase64String(groupKey.SenderKey);

            using var aes = Aes.Create();
            aes.Key = senderKeyBytes;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor();
            using var ms = new MemoryStream();

            using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
            using (var sw = new StreamWriter(cs, Encoding.UTF8))
            {
                sw.Write(plaintext);
            }

            var encryptedData = ms.ToArray();

            var metadata = new EncryptionMetadata
            {
                Version = 1,
                Timestamp = DateTime.UtcNow,
                SenderId = senderId,
                GroupId = groupId,
                IV = Convert.ToBase64String(aes.IV),
                ChainId = groupKey.ChainId,
                Algorithm = "AES-256-CBC",
                KeyDerivation = "Group Sender Key",
                Note = "Group message encryption"
            };

            return (encryptedData, metadata);
        }

        public async Task<DecryptionResult> DecryptMessageAsync(string encryptedBase64, string metadataJson, Guid recipientId)
        {
            try
            {
                if (string.IsNullOrEmpty(encryptedBase64))
                    return new DecryptionResult { Success = false, Error = "Encrypted data is empty" };

                if (string.IsNullOrEmpty(metadataJson))
                    return new DecryptionResult { Success = false, Error = "Metadata is empty" };

                var metadata = JsonSerializer.Deserialize<EncryptionMetadata>(metadataJson);
                if (metadata == null)
                    return new DecryptionResult { Success = false, Error = "Invalid metadata format" };

                var encryptedData = Convert.FromBase64String(encryptedBase64);
                string plaintext;

                if (metadata.GroupId.HasValue)
                {
                    plaintext = await DecryptGroupMessageAsync(encryptedData, metadata, recipientId);
                }
                else if (metadata.RecipientId.HasValue)
                {
                    plaintext = await DecryptPersonalMessageAsync(encryptedData, metadata, recipientId);
                }
                else
                {
                    return new DecryptionResult { Success = false, Error = "Invalid metadata: missing RecipientId or GroupId" };
                }

                return new DecryptionResult
                {
                    Plaintext = plaintext,
                    Success = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error decrypting message");
                return new DecryptionResult
                {
                    Success = false,
                    Error = $"Decryption failed: {ex.Message}"
                };
            }
        }

        private async Task<string> DecryptPersonalMessageAsync(byte[] ciphertext, EncryptionMetadata metadata, Guid senderId)
        {
            var session = await _sessionRepository.GetSessionAsync(senderId, metadata.RecipientId);
            if (session == null)
            {
                throw new InvalidOperationException($"No encryption session found for decryption");
            }

            var sessionKey = await DeriveSessionKey(session);

            using var aes = Aes.Create();
            aes.Key = sessionKey;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;
            aes.IV = Convert.FromBase64String(metadata.IV);

            using var decryptor = aes.CreateDecryptor();
            using var ms = new MemoryStream(ciphertext);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs, Encoding.UTF8);
            return sr.ReadToEnd();
        }

        private async Task<string> DecryptGroupMessageAsync(byte[] ciphertext, EncryptionMetadata metadata, Guid recipientId)
        {
            if (!metadata.GroupId.HasValue)
                throw new ArgumentException("GroupId is required for group message decryption");

            var groupKey = await _groupKeyRepository.GetActiveGroupKeyAsync(metadata.GroupId.Value);
            if (groupKey == null)
            {
                throw new InvalidOperationException($"No active group key found for group {metadata.GroupId}");
            }

            var senderKeyBytes = Convert.FromBase64String(groupKey.SenderKey);

            using var aes = Aes.Create();
            aes.Key = senderKeyBytes;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;
            aes.IV = Convert.FromBase64String(metadata.IV);

            using var decryptor = aes.CreateDecryptor();
            using var ms = new MemoryStream(ciphertext);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs, Encoding.UTF8);

            return sr.ReadToEnd();
        }

        private async Task<byte[]> DeriveSessionKey(EncryptionSession session)
        {
            var sessionData = JsonSerializer.Deserialize<SessionData>(session.SessionData);
            if (sessionData == null)
                throw new InvalidOperationException("Invalid session data");

            var sharedSecret = Convert.FromBase64String(sessionData.SharedSecret);

            using var hkdf = new HMACSHA256(sharedSecret);
            var salt = Encoding.UTF8.GetBytes("session_salt");
            var info = Encoding.UTF8.GetBytes($"session_{session.UserId}_{session.ContactId}");

            var prk = hkdf.ComputeHash(salt);
            using var hmac = new HMACSHA256(prk);

            var t = new byte[0];
            var result = new byte[0];

            for (int i = 1; result.Length < 32; i++)
            {
                var input = ConcatArrays(t, info, BitConverter.GetBytes(i));
                t = hmac.ComputeHash(input);
                result = ConcatArrays(result, t);
            }

            Array.Resize(ref result, 32);
            return result;
        }

        public async Task<GroupKeyBundle> CreateGroupSessionAsync(Guid groupId, Guid creatorId, List<Guid> memberIds)
        {
            using var rng = RandomNumberGenerator.Create();
            var senderKey = new byte[32];
            rng.GetBytes(senderKey);

            var groupKey = new GroupEncryptionKey
            {
                Id = Guid.NewGuid(),
                GroupConferenceId = groupId,
                SenderKey = Convert.ToBase64String(senderKey),
                CreatorId = creatorId,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                ChainId = 1
            };

            var distributionMessages = new Dictionary<Guid, string>();
            foreach (var memberId in memberIds)
            {
                if (memberId == creatorId) continue;

                try
                {
                    var memberPublicKey = await GetPublicKeyAsync(memberId);
                    distributionMessages[memberId] = $"encrypted_group_key_for_{memberId}";
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get public key for member {MemberId}", memberId);
                }
            }

            groupKey.DistributionMessage = JsonSerializer.Serialize(distributionMessages);

            await _groupKeyRepository.SaveGroupKeyAsync(groupKey);

            return new GroupKeyBundle
            {
                GroupId = groupId,
                SenderKey = groupKey.SenderKey,
                DistributionMessages = distributionMessages
            };
        }

        private static byte[] ConcatArrays(params byte[][] arrays)
        {
            var result = new byte[arrays.Sum(a => a.Length)];
            var offset = 0;
            foreach (var array in arrays)
            {
                Buffer.BlockCopy(array, 0, result, offset, array.Length);
                offset += array.Length;
            }
            return result;
        }
    }
}