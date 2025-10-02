namespace Syncro.Infrastructure.Services
{
    public class SectorService : ISectorService
    {
        private readonly ISectorRepository _sectorRepository;

        public SectorService(ISectorRepository sectorRepository)
        {
            _sectorRepository = sectorRepository;
        }

        public async Task<List<SectorModel>> GetAllSectorsAsync()
        {
            return await _sectorRepository.GetAllSectorsAsync();
        }

        public async Task<List<SectorModel>> GetSectorsByServerIdAsync(Guid serverId)
        {
            return await _sectorRepository.GetSectorsByServerIdAsync(serverId);
        }

        public async Task<SectorModel> GetSectorByIdAsync(Guid sectorId)
        {
            return await _sectorRepository.GetSectorByIdAsync(sectorId);
        }

        public async Task<SectorModel> CreateSectorAsync(SectorModel sector)
        {
            if (!await _sectorRepository.ServerExistsAsync(sector.serverId))
                throw new ArgumentException("Server doesn't exist");

            if (await _sectorRepository.SectorNameExistsInServerAsync(sector.serverId, sector.sectorName))
                throw new ArgumentException("Sector name already exists in this server");

            return await _sectorRepository.AddSectorAsync(sector);
        }

        public async Task<bool> DeleteSectorAsync(Guid sectorId)
        {
            return await _sectorRepository.DeleteSectorAsync(sectorId);
        }

        public async Task<SectorModel> UpdateSectorAsync(Guid sectorId, SectorModelDTO sectorDto)
        {
            var existingSector = await _sectorRepository.GetSectorByIdAsync(sectorId);

            existingSector.sectorName = sectorDto.sectorName;
            existingSector.sectorDescription = sectorDto.sectorDescription;
            existingSector.sectorType = sectorDto.sectorType;
            existingSector.isPrivate = sectorDto.isPrivate;

            return await _sectorRepository.UpdateSectorAsync(existingSector);
        }
    }
}