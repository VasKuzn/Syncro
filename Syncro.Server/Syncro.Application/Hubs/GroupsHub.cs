namespace Syncro.Application.Hubs
{
    public class GroupsHub : Hub
    {
        private readonly ILogger<GroupsHub> _logger;

        public GroupsHub(ILogger<GroupsHub> logger)
        {
            _logger = logger;
        }

        public async Task SubscribeToGroupsUpdates(string groupId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"groups-{groupId}");
            _logger.LogInformation($"User {groupId} subscribed to group conferences updates");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}