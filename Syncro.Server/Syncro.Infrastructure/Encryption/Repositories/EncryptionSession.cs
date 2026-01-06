using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Syncro.Infrastructure.Encryption.Interfaces;
using Syncro.Infrastructure.Encryption.Models;

namespace Syncro.Infrastructure.Encryption.Repositories
{
    public class EncryptionSessionRepository : IEncryptionSessionRepository
    {
        private readonly DataBaseContext _context;
        private readonly ILogger<EncryptionSessionRepository> _logger;

        public EncryptionSessionRepository(DataBaseContext context, ILogger<EncryptionSessionRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<EncryptionSession?> GetSessionAsync(Guid userId, Guid? contactId)
        {
            try
            {
                var foundSession = await _context.EncryptionSessions.FirstOrDefaultAsync(s => (s.UserId == userId && s.ContactId == contactId) || (s.UserId == contactId && s.ContactId == userId));
                return foundSession;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting session for user {UserId} and contact {ContactId}", userId, contactId);
                throw;
            }
        }

        public async Task SaveSessionAsync(EncryptionSession session)
        {
            try
            {
                var existingSession = await GetSessionAsync(session.UserId, session.ContactId);

                if (existingSession != null)
                {
                    existingSession.SessionData = session.SessionData;
                    existingSession.LastUsed = DateTime.Now;
                    _context.EncryptionSessions.Update(existingSession);
                }
                else
                {
                    session.Id = Guid.NewGuid();
                    session.CreatedAt = DateTime.Now;
                    session.LastUsed = DateTime.Now;
                    await _context.EncryptionSessions.AddAsync(session);
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving session for user {UserId}", session.UserId);
                throw;
            }
        }

        public async Task UpdateSessionAsync(EncryptionSession session)
        {
            try
            {
                session.LastUsed = DateTime.Now;
                _context.EncryptionSessions.Update(session);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating session {SessionId}", session.Id);
                throw;
            }
        }

        public async Task DeleteSessionAsync(Guid sessionId)
        {
            try
            {
                var session = await _context.EncryptionSessions.FindAsync(sessionId);
                if (session != null)
                {
                    _context.EncryptionSessions.Remove(session);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting session {SessionId}", sessionId);
                throw;
            }
        }

        public async Task<List<EncryptionSession>> GetUserSessionsAsync(Guid userId)
        {
            try
            {
                return await _context.EncryptionSessions
                    .Where(s => s.UserId == userId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sessions for user {UserId}", userId);
                throw;
            }
        }
    }
}