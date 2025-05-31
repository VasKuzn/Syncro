namespace SyncroBackend.StorageOperations
{
    public class ServerRolesRepository : IRolesRepository
    {
        private readonly DataBaseContext _context;

        public ServerRolesRepository(DataBaseContext dbcontext)
        {
            _context = dbcontext;
        }

        public async Task<List<RolesModel>> GetAllRolesAsync()
        {
            return await _context.roles
                .OrderBy(r => r.position)
                .ToListAsync();
        }

        public async Task<List<RolesModel>> GetRolesByServerIdAsync(Guid serverId)
        {
            return await _context.roles
                .Where(r => r.serverId == serverId)
                .OrderBy(r => r.position)
                .ToListAsync();
        }

        public async Task<RolesModel> GetRoleByIdAsync(Guid roleId)
        {
            return await _context.roles
                .FirstOrDefaultAsync(r => r.Id == roleId)
                ?? throw new ArgumentException("Role not found");
        }

        public async Task<RolesModel> AddRoleAsync(RolesModel role)
        {
            var maxPosition = await _context.roles
                .Where(r => r.serverId == role.serverId)
                .MaxAsync(r => (long?)r.position) ?? 0;

            role.position = maxPosition + 1;

            await _context.roles.AddAsync(role);
            await _context.SaveChangesAsync();
            return role;
        }

        public async Task<bool> DeleteRoleAsync(Guid roleId)
        {
            var deleted = await _context.roles
                .Where(r => r.Id == roleId)
                .ExecuteDeleteAsync();
            return deleted > 0;
        }

        public async Task<RolesModel> UpdateRoleAsync(RolesModel role)
        {
            _context.roles.Update(role);
            await _context.SaveChangesAsync();
            return role;
        }

        public async Task<bool> RoleNameExistsInServerAsync(Guid serverId, string roleName)
        {
            return await _context.roles
                .AnyAsync(r => r.serverId == serverId && r.roleName == roleName);
        }

        public async Task<bool> ServerExistsAsync(Guid serverId)
        {
            return await _context.servers.AnyAsync(s => s.Id == serverId);
        }
    }
}