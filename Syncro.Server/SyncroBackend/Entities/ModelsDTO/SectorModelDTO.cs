namespace SyncroBackend.Entities.ModelsDTO
{
    public class SectorModelDTO
    {
        public required string sectorName { get; set; }
        public string? sectorDescription { get; set; }
        public required CallTypesEnum sectorType { get; set; }
        public bool isPrivate { get; set; }
    }
}