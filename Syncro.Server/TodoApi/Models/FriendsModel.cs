namespace TodoApi.Models
{
    public class FriendsModel
    {
        public Guid Id { get; set; }
        public Guid userWhoSent { get; set; }
        public Guid userWhoRecieved { get; set; }
        public required string status { get; set; }
        public DateTime friendsSince { get; set; }
    }
}