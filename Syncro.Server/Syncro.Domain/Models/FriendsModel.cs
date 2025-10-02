namespace Syncro.Domain.Models
{
    public class FriendsModel
    {
        public Guid Id { get; set; }
        public required Guid userWhoSent { get; set; }
        public required Guid userWhoRecieved { get; set; }
        public required FriendsStatusEnum status { get; set; }
        public required DateTime friendsSince { get; set; }
    }
}