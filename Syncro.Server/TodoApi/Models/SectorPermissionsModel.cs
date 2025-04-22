namespace TodoApi.Models
{
    public class SectorPermissionsModel
    {
        public Guid Id { get; set; }
        public Guid roleId { get; set; }
        public Guid sectorId { get; set; }
        public Permissions sectorPermissions { get; set; } // аналогично тому что есть в rolesModel
    }
}