namespace TodoApi.Models
{
    public class PersonalConferenceModel
    {
        public Guid Id { get; set; }
        public Guid user1 { get; set; }
        public Guid user2 { get; set; }
        public bool isFriend {get;set;}
        public DateTime startingDate { get; set; }
        public DateTime lastActivity {get;set;}
        public string callType {get;set;}
    }
}