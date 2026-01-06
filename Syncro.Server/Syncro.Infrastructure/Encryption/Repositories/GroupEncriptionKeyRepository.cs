using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Syncro.Infrastructure.Encryption.Interfaces;
using Syncro.Infrastructure.Encryption.Models;

namespace Syncro.Infrastructure.Encryption.Repositories
{
    public class GroupEncryptionKeyRepository : IGroupEncryptionKeyRepository
    {
        private readonly DataBaseContext _context;
        private readonly ILogger<GroupEncryptionKeyRepository> _logger;

        public GroupEncryptionKeyRepository(DataBaseContext context, ILogger<GroupEncryptionKeyRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<GroupEncryptionKey?> GetActiveGroupKeyAsync(Guid groupId)
        {
            try
            {
                return await _context.GroupEncryptionKeys
                    .Where(k => k.GroupConferenceId == groupId && k.IsActive)
                    .OrderByDescending(k => k.CreatedAt)
                    .FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active group key for group {GroupId}", groupId);
                throw;
            }
        }

        public async Task<GroupEncryptionKey?> GetGroupKeyAsync(Guid groupId, int chainId)
        {
            try
            {
                return await _context.GroupEncryptionKeys
                    .FirstOrDefaultAsync(k => k.GroupConferenceId == groupId && k.ChainId == chainId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting group key for group {GroupId}, chain {ChainId}", groupId, chainId);
                throw;
            }
        }

        public async Task SaveGroupKeyAsync(GroupEncryptionKey key)
        {
            try
            {
                var oldKeys = await _context.GroupEncryptionKeys
                    .Where(k => k.GroupConferenceId == key.GroupConferenceId && k.IsActive)
                    .ToListAsync();

                foreach (var oldKey in oldKeys)
                {
                    oldKey.IsActive = false;
                }

                key.Id = Guid.NewGuid();
                key.CreatedAt = DateTime.Now;
                key.IsActive = true;

                await _context.GroupEncryptionKeys.AddAsync(key);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving group key for group {GroupId}", key.GroupConferenceId);
                throw;
            }
        }

        public async Task UpdateGroupKeyAsync(GroupEncryptionKey key)
        {
            try
            {
                _context.GroupEncryptionKeys.Update(key);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating group key {KeyId}", key.Id);
                throw;
            }
        }

        public async Task<List<GroupEncryptionKey>> GetGroupKeysAsync(Guid groupId)
        {
            try
            {
                return await _context.GroupEncryptionKeys
                    .Where(k => k.GroupConferenceId == groupId)
                    .OrderByDescending(k => k.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting group keys for group {GroupId}", groupId);
                throw;
            }
        }

        public async Task RotateGroupKeyAsync(Guid groupId, Guid creatorId, string newSenderKey)
        {
            try
            {
                var currentKey = await GetActiveGroupKeyAsync(groupId);
                if (currentKey == null)
                {
                    throw new InvalidOperationException($"No active key found for group {groupId}");
                }

                var newKey = new GroupEncryptionKey
                {
                    Id = Guid.NewGuid(),
                    GroupConferenceId = groupId,
                    SenderKey = newSenderKey,
                    DistributionMessage = currentKey.DistributionMessage, // В реальности нужно перешифровать
                    CreatorId = creatorId,
                    ChainId = currentKey.ChainId + 1,
                    CreatedAt = DateTime.Now,
                    IsActive = true
                };

                currentKey.IsActive = false;
                _context.GroupEncryptionKeys.Update(currentKey);

                await _context.GroupEncryptionKeys.AddAsync(newKey);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rotating group key for group {GroupId}", groupId);
                throw;
            }
        }
    }
}