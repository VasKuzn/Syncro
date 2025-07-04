namespace SyncroBackend.Entities.Models
{
    public class GroupConferenceMemberModel
    {
        public Guid Id { get; set; }
        public Guid accountId { get; set; }
        public Guid groupConferenceId { get; set; }
        public required DateTime joiningDate { get; set; }
        public string? groupConferenceNickname { get; set; }
        public required Guid roleId { get; set; }
    }
}