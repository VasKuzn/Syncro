using Microsoft.Extensions.Logging;
using Syncro.Infrastructure.Encryption.Interfaces;
using Syncro.Infrastructure.Encryption.Models;

namespace Syncro.Infrastructure.Encryption.Repositories
{
    public class UserEncryptionKeyRepository : IUserEncryptionKeyRepository
    {
        private readonly DataBaseContext _context;
        private readonly ILogger<UserEncryptionKeyRepository> _logger;

        public UserEncryptionKeyRepository(DataBaseContext context, ILogger<UserEncryptionKeyRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<UserEncryptionKey?> GetByUserIdAsync(Guid userId)
        {
            try
            {
                return await _context.UserEncryptionKeys
                    .FirstOrDefaultAsync(k => k.UserId == userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting encryption key for user {UserId}", userId);
                throw;
            }
        }

        public async Task SavePublicKeyAsync(Guid userId, string publicKey)
        {
            try
            {
                var existingKey = await GetByUserIdAsync(userId);

                if (existingKey != null)
                {
                    existingKey.PublicKey = publicKey;
                    existingKey.LastUpdated = DateTime.Now;
                    _context.UserEncryptionKeys.Update(existingKey);
                }
                else
                {
                    var newKey = new UserEncryptionKey
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        PublicKey = publicKey,
                        LastUpdated = DateTime.Now
                    };
                    await _context.UserEncryptionKeys.AddAsync(newKey);
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving public key for user {UserId}", userId);
                throw;
            }
        }

        public async Task<string> GetPublicKeyAsync(Guid userId)
        {
            try
            {
                var key = await GetByUserIdAsync(userId);

                if (key == null)
                {
                    throw new KeyNotFoundException($"Public key not found for user {userId}");
                }

                return key.PublicKey;
            }
            catch (KeyNotFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public key for user {UserId}", userId);
                throw;
            }
        }

        public async Task UpdateAsync(UserEncryptionKey key)
        {
            try
            {
                key.LastUpdated = DateTime.Now;
                _context.UserEncryptionKeys.Update(key);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating encryption key {KeyId}", key.Id);
                throw;
            }
        }

        public async Task<bool> ExistsAsync(Guid userId)
        {
            try
            {
                return await _context.UserEncryptionKeys
                    .AnyAsync(k => k.UserId == userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if key exists for user {UserId}", userId);
                throw;
            }
        }
    }
}