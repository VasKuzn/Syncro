namespace Syncro.Application.ModelsDTO
{
    public class RolesModelDTO
    {
        public required string roleName { get; set; }
        public Permissions rolePermissions { get; set; }
        public required string color { get; set; }
    }
}