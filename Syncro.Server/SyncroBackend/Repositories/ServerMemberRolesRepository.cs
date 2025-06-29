namespace SyncroBackend.Repositories
{
    public class ServerMemberRolesRepository : IServerMemberRolesRepository
    {
        private readonly DataBaseContext _context;

        public ServerMemberRolesRepository(DataBaseContext dbcontext)
        {
            _context = dbcontext;
        }

        public async Task<List<ServerMemberRoles>> GetAllMemberRolesAsync()
        {
            return await _context.serverMemberRoles.ToListAsync();
        }

        public async Task<List<ServerMemberRoles>> GetMemberRolesAsync(Guid serverId, Guid accountId)
        {
            return await _context.serverMemberRoles
                .Where(x => x.serverId == serverId && x.accountId == accountId)
                .ToListAsync();
        }

        public async Task<List<ServerMemberRoles>> GetRoleAssignmentsAsync(Guid roleId)
        {
            return await _context.serverMemberRoles
                .Where(x => x.roleId == roleId)
                .ToListAsync();
        }

        public async Task<ServerMemberRoles> GetMemberRoleByIdAsync(Guid id)
        {
            return await _context.serverMemberRoles
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new ArgumentException("Member role assignment not found");
        }

        public async Task<ServerMemberRoles> AddMemberRoleAsync(ServerMemberRoles memberRole)
        {
            await _context.serverMemberRoles.AddAsync(memberRole);
            await _context.SaveChangesAsync();
            return memberRole;
        }

        public async Task<bool> DeleteMemberRoleAsync(Guid id)
        {
            var deleted = await _context.serverMemberRoles
                .Where(x => x.Id == id)
                .ExecuteDeleteAsync();
            return deleted > 0;
        }

        public async Task<bool> MemberRoleExistsAsync(Guid serverId, Guid accountId, Guid roleId)
        {
            return await _context.serverMemberRoles
                .AnyAsync(x => x.serverId == serverId &&
                             x.accountId == accountId &&
                             x.roleId == roleId);
        }

        public async Task<bool> MemberExistsInServerAsync(Guid serverId, Guid accountId)
        {
            return await _context.serverMembers
                .AnyAsync(x => x.serverId == serverId && x.accountId == accountId);
        }

        public async Task<bool> RoleExistsInServerAsync(Guid serverId, Guid roleId)
        {
            return await _context.roles
                .AnyAsync(x => x.Id == roleId && x.serverId == serverId);
        }
    }
}