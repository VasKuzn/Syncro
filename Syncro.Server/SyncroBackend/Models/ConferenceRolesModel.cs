namespace SyncroBackend.Models
{
    public class ConferenceRolesModel
    {
        public Guid Id { get; set; }
        public Permissions rolePermissions { get; set; }
        public Guid conferenceId { get; set; }
    }
}