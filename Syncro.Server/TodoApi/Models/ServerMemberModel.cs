namespace TodoApi.Models
{
    public class ServerMemberModel
    {
        public Guid Id { get; set; }
        public Guid serverId { get; set; }
        public Guid accountId { get; set; }
        public DateTime joiningDate { get; set; }
        public DateTime serverNickname {get;set;}
        public bool isBanned {get;set;}
        public string banReason {get;set;}
    }
}