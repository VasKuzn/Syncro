namespace SyncroBackend.Entities.Models
{
    public class ServerModel
    {
        public Guid Id { get; set; }
        public required string serverName { get; set; }
        public Guid ownerId { get; set; }
        public string? serverDescription { get; set; }
        public DateTime creationDate { get; set; }
    }
}