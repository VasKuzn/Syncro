namespace Syncro.Application.Hubs
{
    public class PersonalMessagesHub : Hub
    {
        private readonly ILogger<PersonalMessagesHub> _logger;

        public PersonalMessagesHub(ILogger<PersonalMessagesHub> logger)
        {
            _logger = logger;
        }

        public async Task SubscribeToPersonalConference(Guid personalConferenceId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"personalconference-{personalConferenceId}");
            _logger.LogInformation($"User {Context.ConnectionId} subscribed to personal conference {personalConferenceId}");
        }

        public async Task UnsubscribeFromPersonalConference(Guid personalConferenceId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"personalconference-{personalConferenceId}");
            _logger.LogInformation($"User {Context.ConnectionId} unsubscribed from personal conference {personalConferenceId}");
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"Client connected: {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}