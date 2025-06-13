namespace SyncroBackend.Models
{
    public class SectorModelDto
    {
        public required string sectorName { get; set; }
        public string? sectorDescription { get; set; }
        public required CallTypesEnum sectorType { get; set; }
        public bool isPrivate { get; set; }
    }
}