namespace SyncroBackend.StorageOperations
{
    public class SectorRepository : ISectorRepository
    {
        private readonly DataBaseContext _context;

        public SectorRepository(DataBaseContext dbcontext)
        {
            _context = dbcontext;
        }

        public async Task<List<SectorModel>> GetAllSectorsAsync()
        {
            return await _context.sectors.ToListAsync();
        }

        public async Task<List<SectorModel>> GetSectorsByServerIdAsync(Guid serverId)
        {
            return await _context.sectors
                .Where(s => s.serverId == serverId)
                .ToListAsync();
        }

        public async Task<SectorModel> GetSectorByIdAsync(Guid sectorId)
        {
            return await _context.sectors
                .FirstOrDefaultAsync(s => s.Id == sectorId)
                ?? throw new ArgumentException("Sector not found");
        }

        public async Task<SectorModel> AddSectorAsync(SectorModel sector)
        {
            await _context.sectors.AddAsync(sector);
            await _context.SaveChangesAsync();
            return sector;
        }

        public async Task<bool> DeleteSectorAsync(Guid sectorId)
        {
            var deleted = await _context.sectors
                .Where(s => s.Id == sectorId)
                .ExecuteDeleteAsync();
            return deleted > 0;
        }

        public async Task<SectorModel> UpdateSectorAsync(SectorModel sector)
        {
            _context.sectors.Update(sector);
            await _context.SaveChangesAsync();
            return sector;
        }

        public async Task<bool> SectorNameExistsInServerAsync(Guid serverId, string sectorName)
        {
            return await _context.sectors
                .AnyAsync(s => s.serverId == serverId && s.sectorName == sectorName);
        }

        public async Task<bool> ServerExistsAsync(Guid serverId)
        {
            return await _context.servers.AnyAsync(s => s.Id == serverId);
        }
    }
}