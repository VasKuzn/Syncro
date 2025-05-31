namespace SyncroBackend.StorageOperations
{
    public class SectorPermissionsRepository : ISectorPermissionsRepository
    {
        private readonly DataBaseContext _context;

        public SectorPermissionsRepository(DataBaseContext dbcontext)
        {
            _context = dbcontext;
        }

        public async Task<SectorPermissionsModel> AddAsync(SectorPermissionsModel permission)
        {
            permission.assignedAt = DateTime.UtcNow;
            await _context.sectorPermissions.AddAsync(permission);
            await _context.SaveChangesAsync();
            return permission;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            return await _context.sectorPermissions
                .Where(x => x.Id == id)
                .ExecuteDeleteAsync() > 0;
        }

        public async Task<bool> ExistsAsync(Guid sectorId, Guid roleId, Guid accountId)
        {
            return await _context.sectorPermissions
                .AnyAsync(x => x.sectorId == sectorId &&
                              x.roleId == roleId &&
                              x.accountId == accountId);
        }

        public async Task<SectorPermissionsModel> GetByIdAsync(Guid id)
        {
            return await _context.sectorPermissions
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new ArgumentException("Permission not found");
        }

        public async Task<List<SectorPermissionsModel>> GetByAccountIdAsync(Guid accountId)
        {
            return await _context.sectorPermissions
                .Where(x => x.accountId == accountId)
                .ToListAsync();
        }

        public async Task<List<SectorPermissionsModel>> GetByRoleIdAsync(Guid roleId)
        {
            return await _context.sectorPermissions
                .Where(x => x.roleId == roleId)
                .ToListAsync();
        }

        public async Task<List<SectorPermissionsModel>> GetBySectorIdAsync(Guid sectorId)
        {
            return await _context.sectorPermissions
                .Where(x => x.sectorId == sectorId)
                .ToListAsync();
        }

        public async Task<bool> AccountHasPermissionAsync(Guid accountId, Guid sectorId, Permissions permission)
        {
            var permissions = await _context.sectorPermissions
                .Where(x => x.accountId == accountId && x.sectorId == sectorId)
                .Select(x => x.sectorPermissions)
                .ToListAsync();

            return permissions.Any(p => p.HasFlag(permission));
        }

        public async Task<List<Permissions>> GetAccountPermissionsAsync(Guid accountId, Guid sectorId)
        {
            return await _context.sectorPermissions
                .Where(x => x.accountId == accountId && x.sectorId == sectorId)
                .Select(x => x.sectorPermissions)
                .ToListAsync();
        }
    }
}