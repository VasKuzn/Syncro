using System.Collections.Concurrent;

namespace Syncro.Api.Hubs
{

    public class AccountsHub : Hub
    {
        private readonly ILogger<AccountsHub> _logger;
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();

        public AccountsHub(ILogger<AccountsHub> logger)
        {
            _logger = logger;
        }

        public async Task SubscribeToAccountsUpdates(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"account-{userId}");

            _userConnections[Context.ConnectionId] = userId;

            await Clients.Group($"friends-{userId}").SendAsync("FriendStatusChanged", new
            {
                UserId = userId,
                IsOnline = true,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogInformation($"User {userId} subscribed to accounts updates");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_userConnections.TryRemove(Context.ConnectionId, out var userId))
            {
                await Clients.Group($"friends-{userId}").SendAsync("FriendStatusChanged", new
                {
                    UserId = userId,
                    IsOnline = false,
                    Timestamp = DateTime.UtcNow
                });
            }

            _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }

        public static IReadOnlyCollection<string> GetOnlineUsers()
        {
            return _userConnections.Values.Distinct().ToList().AsReadOnly();
        }
    }
}