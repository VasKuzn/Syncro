namespace Syncro.Api.Hubs
{
    public class FriendsHub : Hub
    {
        private readonly ILogger<FriendsHub> _logger;

        public FriendsHub(ILogger<FriendsHub> logger)
        {
            _logger = logger;
        }

        public async Task SubscribeToFriendsUpdates(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"friends-{userId}");

            await Groups.AddToGroupAsync(Context.ConnectionId, $"account-status-{userId}");


            _logger.LogInformation($"User {userId} subscribed to friends updates");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}