namespace SyncroBackend.StorageOperations
{
    public class ServerMemberRepository : IServerMemberRepository
    {
        private readonly DataBaseContext _context;

        public ServerMemberRepository(DataBaseContext dbcontext)
        {
            _context = dbcontext;
        }

        public async Task<List<ServerMemberModel>> GetAllMembersAsync()
        {
            return await _context.serverMembers.ToListAsync();
        }

        public async Task<List<ServerMemberModel>> GetMembersByServerIdAsync(Guid serverId)
        {
            return await _context.serverMembers
                .Where(m => m.serverId == serverId)
                .ToListAsync();
        }

        public async Task<ServerMemberModel> GetMemberByIdAsync(Guid memberId)
        {
            return await _context.serverMembers
                .FirstOrDefaultAsync(m => m.Id == memberId)
                ?? throw new ArgumentException("Server member not found");
        }

        public async Task<ServerMemberModel> AddMemberAsync(ServerMemberModel member)
        {
            member.joiningDate = DateTime.UtcNow;
            await _context.serverMembers.AddAsync(member);
            await _context.SaveChangesAsync();
            return member;
        }

        public async Task<bool> DeleteMemberAsync(Guid memberId)
        {
            var deleted = await _context.serverMembers
                .Where(m => m.Id == memberId)
                .ExecuteDeleteAsync();
            return deleted > 0;
        }

        public async Task<ServerMemberModel> UpdateMemberAsync(ServerMemberModel member)
        {
            _context.serverMembers.Update(member);
            await _context.SaveChangesAsync();
            return member;
        }

        public async Task<bool> MemberExistsInServerAsync(Guid serverId, Guid accountId)
        {
            return await _context.serverMembers
                .AnyAsync(m => m.serverId == serverId && m.accountId == accountId);
        }

        public async Task<bool> ServerExistsAsync(Guid serverId)
        {
            return await _context.servers.AnyAsync(s => s.Id == serverId);
        }

        public async Task<bool> AccountExistsAsync(Guid accountId)
        {
            return await _context.accounts.AnyAsync(a => a.Id == accountId);
        }
    }
}