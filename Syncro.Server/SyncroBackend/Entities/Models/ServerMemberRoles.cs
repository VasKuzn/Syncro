namespace SyncroBackend.Entities.Models
{
    public class ServerMemberRoles
    {
        public Guid Id { get; set; }
        public Guid serverId { get; set; }
        public Guid accountId { get; set; }
        public Guid roleId { get; set; }
    }
}