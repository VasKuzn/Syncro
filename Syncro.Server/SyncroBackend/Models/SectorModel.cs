namespace SyncroBackend.Models
{
    public class SectorModel
    {
        public Guid Id { get; set; }
        public Guid serverId { get; set; }
        public required string sectorName { get; set; }
        public string? sectorDescription { get; set; }
        public required string sectorType { get; set; }
        public bool isPrivate { get; set; }
    }
}