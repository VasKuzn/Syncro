namespace TodoApi.Models
{
    public class GroupConferenceMemberModel
    {
        public Guid Id { get; set; }
        public Guid accountId { get; set; }
        public Guid groupConferenceId { get; set; }
        public DateTime joiningDate { get; set; }
        public string? groupConferenceNickname { get; set; }
    }
}