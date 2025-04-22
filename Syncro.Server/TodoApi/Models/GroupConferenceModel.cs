namespace TodoApi.Models
{
    public class GroupConferenceModel
    {
        public Guid Id { get; set; }
        public required string conferenceName { get; set; }
        public required string groupConferenceType { get; set; }
    }
}