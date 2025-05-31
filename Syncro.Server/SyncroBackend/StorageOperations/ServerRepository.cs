namespace SyncroBackend.StorageOperations
{
    public class ServerRepository : IServerRepository
    {
        private readonly DataBaseContext _context;

        public ServerRepository(DataBaseContext dbcontext)
        {
            _context = dbcontext;
        }

        public async Task<List<ServerModel>> GetAllServersAsync()
        {
            return await _context.servers.ToListAsync();
        }

        public async Task<ServerModel> GetServerByIdAsync(Guid serverId)
        {
            return await _context.servers
                .FirstOrDefaultAsync(s => s.Id == serverId)
                ?? throw new ArgumentException("Server not found");
        }

        public async Task<ServerModel> AddServerAsync(ServerModel server)
        {
            server.creationDate = DateTime.UtcNow;
            await _context.servers.AddAsync(server);
            await _context.SaveChangesAsync();
            return server;
        }

        public async Task<bool> DeleteServerAsync(Guid serverId)
        {
            var deleted = await _context.servers
                .Where(s => s.Id == serverId)
                .ExecuteDeleteAsync();
            return deleted > 0;
        }

        public async Task<ServerModel> UpdateServerAsync(ServerModel server)
        {
            _context.servers.Update(server);
            await _context.SaveChangesAsync();
            return server;
        }

        public async Task<bool> UserExistsAsync(Guid userId)
        {
            return await _context.accounts.AnyAsync(a => a.Id == userId);
        }

        public async Task<bool> ServerNameExistsAsync(string serverName)
        {
            return await _context.servers.AnyAsync(s => s.serverName == serverName);
        }
    }
}