namespace SyncroBackend.Entities.ModelsDTO
{
    public class ConferenceMemberModelDTO
    {
        public Guid accountId { get; set; }
        public Guid groupConferenceId { get; set; }
        public required DateTime joiningDate { get; set; }
        public string? groupConferenceNickname { get; set; }
        public required Guid roleId { get; set; }
    }
}