namespace Syncro.Api.Hubs
{
    //[Authorize]
    public class VideoChatHub : Hub
    {
        public async Task SendOffer(string receiverId, string offer)
        {
            await Clients.User(receiverId).SendAsync("ReceiveOffer", Context.UserIdentifier, offer);
        }
        public async Task SendAnswer(string receiverId, string answer)
        {
            await Clients.User(receiverId).SendAsync("ReceiveAnswer", answer);
        }
        public async Task SendIceCandidate(string receiverId, string candidate)
        {
            await Clients.User(receiverId).SendAsync("ReceiveIceCandidate", candidate);
        }
        public async Task EndCall(string receiverId)
        {
            await Clients.User(receiverId).SendAsync("CallEnded");
        }
    }
}