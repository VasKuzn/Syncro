namespace SyncroBackend.Interfaces
{
    public interface ISectorService
    {
        Task<List<SectorModel>> GetAllSectorsAsync();
        Task<List<SectorModel>> GetSectorsByServerIdAsync(Guid serverId);
        Task<SectorModel> GetSectorByIdAsync(Guid sectorId);
        Task<SectorModel> CreateSectorAsync(SectorModel sector);
        Task<bool> DeleteSectorAsync(Guid sectorId);
        Task<SectorModel> UpdateSectorAsync(Guid sectorId, SectorModelDTO sectorDto);
    }
}