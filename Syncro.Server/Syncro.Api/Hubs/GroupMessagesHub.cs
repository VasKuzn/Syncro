namespace Syncro.Api.Hubs
{
    public class GroupMessagesHub : Hub
    {
        private readonly ILogger<GroupMessagesHub> _logger;

        public GroupMessagesHub(ILogger<GroupMessagesHub> logger)
        {
            _logger = logger;
        }

        public async Task SubscribeToGroupConference(string groupConferenceId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"groupConference-{groupConferenceId}");
            _logger.LogInformation($"Client subscribed to group {groupConferenceId}");
        }

        public async Task UnsubscribeFromGroupConference(string groupConferenceId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"groupConference-{groupConferenceId}");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}