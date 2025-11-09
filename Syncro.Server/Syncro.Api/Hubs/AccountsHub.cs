using System.Collections.Concurrent;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;


namespace Syncro.Api.Hubs
{

    [AllowAnonymous]
    public class AccountsHub : Hub
    {
        private readonly ILogger<AccountsHub> _logger;
        private readonly IFriendsService _friendsService;
        private readonly IHubContext<FriendsHub> _friendsHubContext;

        private static readonly ConcurrentDictionary<string, string> _connectionToUser = new();
        private static readonly ConcurrentDictionary<string, int> _userConnectionCounts = new();

        public AccountsHub(ILogger<AccountsHub> logger, IFriendsService friendsService, IHubContext<FriendsHub> friendsHubContext)
        {
            _logger = logger;
            _friendsService = friendsService;
            _friendsHubContext = friendsHubContext;
        }

        public async Task Register(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("Register called with empty userId for connection {ConnectionId}", Context.ConnectionId);
                return;
            }

            _connectionToUser[Context.ConnectionId] = userId;

            var newCount = _userConnectionCounts.AddOrUpdate(userId, 1, (_, old) => old + 1);

            if (newCount == 1)
            {
                _logger.LogInformation("User {UserId} went online", userId);

                if (Guid.TryParse(userId, out var userGuid))
                {
                    try
                    {
                        var friends = await _friendsService.GetFriendsByAccountAsync(userGuid);
                        var friendIds = friends
                            .Where(f => f.status == Syncro.Domain.Enums.FriendsStatusEnum.Accepted)
                            .Select(f => f.userWhoSent == userGuid ? f.userWhoRecieved : f.userWhoSent)
                            .Distinct();

                        foreach (var friendId in friendIds)
                        {
                            await _friendsHubContext.Clients.Group($"friends-{friendId}").SendAsync("AccountActivity", new
                            {
                                UserId = userId,
                                IsOnline = true,
                                Timestamp = DateTime.UtcNow
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to notify friends for user {UserId}", userId);
                    }
                }
            }

            if (Guid.TryParse(userId, out var callerGuid))
            {
                try
                {
                    var friends = await _friendsService.GetFriendsByAccountAsync(callerGuid);
                    var friendIds = friends
                        .Where(f => f.status == Syncro.Domain.Enums.FriendsStatusEnum.Accepted)
                        .Select(f => f.userWhoSent == callerGuid ? f.userWhoRecieved : f.userWhoSent)
                        .Distinct()
                        .Select(g => g.ToString())
                        .Where(s => _userConnectionCounts.ContainsKey(s));

                    await Clients.Caller.SendAsync("OnlineFriends", friendIds.ToList());
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to build OnlineFriends for caller {CallerId}", userId);
                    await Clients.Caller.SendAsync("OnlineFriends", new List<string>());
                }
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                if (_connectionToUser.TryRemove(Context.ConnectionId, out var userId))
                {
                    var newCount = _userConnectionCounts.AddOrUpdate(userId, 0, (_, old) => Math.Max(old - 1, 0));

                    if (newCount == 0)
                    {
                        _userConnectionCounts.TryRemove(userId, out _);
                        _logger.LogInformation("User {UserId} went offline", userId);

                        if (Guid.TryParse(userId, out var userGuid))
                        {
                            try
                            {
                                var friends = await _friendsService.GetFriendsByAccountAsync(userGuid);
                                var friendIds = friends
                                    .Where(f => f.status == Syncro.Domain.Enums.FriendsStatusEnum.Accepted)
                                    .Select(f => f.userWhoSent == userGuid ? f.userWhoRecieved : f.userWhoSent)
                                    .Distinct();

                                foreach (var friendId in friendIds)
                                {
                                    await _friendsHubContext.Clients.Group($"friends-{friendId}").SendAsync("AccountActivity", new
                                    {
                                        UserId = userId,
                                        IsOnline = false,
                                        Timestamp = DateTime.UtcNow
                                    });
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to notify friends about offline for user {UserId}", userId);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling disconnection for {ConnectionId}", Context.ConnectionId);
            }

            _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        public static IReadOnlyCollection<string> GetOnlineUsers()
        {
            return _userConnectionCounts.Where(kv => kv.Value > 0).Select(kv => kv.Key).ToList().AsReadOnly();
        }
    }
}