namespace SyncroBackend.Interfaces
{
    public interface ISectorRepository
    {
        Task<List<SectorModel>> GetAllSectorsAsync();
        Task<List<SectorModel>> GetSectorsByServerIdAsync(Guid serverId);
        Task<SectorModel> GetSectorByIdAsync(Guid sectorId);
        Task<SectorModel> AddSectorAsync(SectorModel sector);
        Task<bool> DeleteSectorAsync(Guid sectorId);
        Task<SectorModel> UpdateSectorAsync(SectorModel sector);
        Task<bool> SectorNameExistsInServerAsync(Guid serverId, string sectorName);
        Task<bool> ServerExistsAsync(Guid serverId);
    }
}