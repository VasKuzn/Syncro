namespace Syncro.Domain.Models
{
    public class SectorPermissionsModel
    {
        public Guid Id { get; set; }
        public Guid serverId { get; set; }
        public Guid roleId { get; set; }
        public Guid sectorId { get; set; }
        public Guid accountId { get; set; }
        public Permissions sectorPermissions { get; set; }
        public DateTime assignedAt { get; set; } = DateTime.UtcNow;
    }
}