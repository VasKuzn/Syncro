namespace SyncroBackend.Entities.Models
{
    public class GroupConferenceModel
    {
        public Guid Id { get; set; }
        public required string conferenceName { get; set; }
        public required CallTypesEnum groupConferenceType { get; set; }
    }
}