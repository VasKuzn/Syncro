namespace SyncroBackend.Models
{
    public class RolesModel
    {
        public Guid Id { get; set; }
        public Guid serverId { get; set; }
        public required string roleName { get; set; }
        public Permissions rolePermissions { get; set; }
        public required string color { get; set; }
        public bool isDisplayedSeparetely { get; set; }
        public long position { get; set; } // Позиция роли в иерархии (для сортировки).
    }
}