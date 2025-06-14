namespace SyncroBackend.Models
{
    public class RolesModelDto
    {
        public required string roleName { get; set; }
        public Permissions rolePermissions { get; set; }
        public required string color { get; set; }
        public bool isDisplayedSeparetely { get; set; }
    }
}