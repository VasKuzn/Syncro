namespace SyncroBackend.Hubs
{
    public class ChatHub : Hub
    {
        private readonly IPersonalConferenceService _conferenceService;
        private readonly IMessageService _messageService;
        private readonly IAccountService _accountService;
        private static readonly ConcurrentDictionary<Guid, string> _activeConnections = new();
        public ChatHub(IPersonalConferenceService conferenceService, IAccountService accountService, IMessageService messageService)
        {
            _conferenceService = conferenceService;
            _accountService = accountService;
            _messageService = messageService;
        }
        public async Task JoinPersonalConference(Guid conferenceId, Guid userId)
        {
            var personalConference = await _conferenceService.GetPersonalConferenceByIdAsync(conferenceId);
            if (personalConference.user1 != userId && personalConference.user2 != userId)
            {
                throw new HubException($"{userId} Access denied to this personal conference");
            }
            var nameOfPersonalConference = GetConferenceGroupName(conferenceId);
            await Groups.AddToGroupAsync(Context.ConnectionId, nameOfPersonalConference);

            var otherUserId = personalConference.user1 == userId ? personalConference.user2 : personalConference.user1;
            var otherUser = await _accountService.GetAccountByIdAsync(otherUserId);

            await MarkAllMessagesAsRead(conferenceId, userId);

            await SendInitialConferenceData(conferenceId, userId, otherUserId, otherUser.isOnline);
        }
        private async Task MarkAllMessagesAsRead(Guid conferenceId, Guid readerId)
        {
            var unreadMessages = (await _messageService.GetAllMessagesAsync())
                .Where(m => m.personalConferenceId == conferenceId &&
                           m.accountId != readerId &&
                           !m.isRead)
                .ToList();

            foreach (var message in unreadMessages)
            {
                await _messageService.MarkMessageAsReadAsync(message.Id, readerId, true);
            }
        }
        public async Task LeavePersonalConference(Guid conferenceId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetConferenceGroupName(conferenceId));
        }
        public async Task SendPersonalMessageAsync(Guid conferenceId, Guid senderId, string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Message content cannot be empty");

            var conference = await _conferenceService.GetPersonalConferenceByIdAsync(conferenceId);
            if (conference.user1 != senderId && conference.user2 != senderId)
                throw new HubException("Sender is not a conference participant");

            var message = new MessageModel
            {
                messageContent = content,
                messageDateSent = DateTime.UtcNow,
                accountId = senderId,
                personalConferenceId = conferenceId,
                groupConferenceId = null,
                sectorId = null,
                previousMessageContent = null,
                isEdited = false,
                isPinned = false,
                isRead = false,
                referenceMessageId = null,
            };
            var createdMessage = await _messageService.CreateMessageAsync(message);
            var sender = await _accountService.GetAccountByIdAsync(senderId);

            await Clients.Group(GetConferenceGroupName(conferenceId))
                .SendAsync("ReceiveMessage", new
                {
                    MessageId = createdMessage.Id,
                    SenderId = senderId,
                    SenderName = sender.nickname,
                    Content = content,
                    Timestamp = DateTime.UtcNow,
                });
        }
        public async Task EditMessage(Guid messageId, string newContent)
        {
            var userId = GetUserIdFromContext();
            var message = await _messageService.GetMessageByIdAsync(messageId);

            if (!message.personalConferenceId.HasValue)
                throw new HubException("Message is not in a conference");

            if (message.accountId != userId)
                throw new HubException("Only message author can edit it");

            var updatedMessage = await _messageService.UpdateMessageTextAsync(
                messageId,
                new MessageDTO { messageContent = newContent });

            await Clients.Group(GetConferenceGroupName(message.personalConferenceId.Value))
                .SendAsync("MessageEdited", new
                {
                    MessageId = messageId,
                    NewContent = newContent,
                    EditTimestamp = DateTime.UtcNow
                });
        }

        public async Task DeleteMessage(Guid messageId)
        {
            var userId = GetUserIdFromContext();
            var message = await _messageService.GetMessageByIdAsync(messageId);
            var conference = await _conferenceService.GetPersonalConferenceByIdAsync(message.personalConferenceId.Value);
            if (message.accountId != userId && conference.user1 != userId && conference.user2 != userId)
                throw new HubException("No permission to delete message");
            if (await _messageService.DeleteMessageAsync(messageId))
            {
                await Clients.Group(GetConferenceGroupName(message.personalConferenceId.Value))
                    .SendAsync("MessageDeleted", messageId);
            }
        }

        public async Task TogglePinMessage(Guid messageId)
        {
            var userId = GetUserIdFromContext();
            var message = await _messageService.GetMessageByIdAsync(messageId);
            var conference = await _conferenceService.GetPersonalConferenceByIdAsync(message.personalConferenceId.Value);

            if (conference.user1 != userId && conference.user2 != userId)
                throw new HubException("No permission to pin message");

            var result = await _messageService.ToggleMessagePinAsync(messageId);

            await Clients.Group(GetConferenceGroupName(message.personalConferenceId.Value))
                .SendAsync("MessagePinToggled", new
                {
                    MessageId = messageId,
                    IsPinned = result.isPinned
                });
        }
        public override async Task OnConnectedAsync()
        {
            var userId = GetUserIdFromContext();
            _activeConnections[userId] = Context.ConnectionId;
            await _accountService.UpdateOnlineAccountAsync(userId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserIdFromContext();
            _activeConnections.TryRemove(userId, out _);
            await _accountService.UpdateOnlineAccountAsync(userId);
            await base.OnDisconnectedAsync(exception);
        }
        private string GetConferenceGroupName(Guid conferenceId)
        {
            return $"Personal conference {conferenceId}";
        }

        private Guid GetUserIdFromContext()
        {
            var httpContext = Context.GetHttpContext();
            return Guid.Parse(httpContext.Request.Query["userId"]);
        }
        public async Task LoadMoreMessages(Guid conferenceId, int loadedCount)
        {
            var messages = (await _messageService.GetAllMessagesAsync())
                .Where(m => m.personalConferenceId == conferenceId)
                .OrderByDescending(m => m.messageDateSent)
                .Skip(loadedCount)
                .Take(50)
                .ToList();

            await Clients.Caller.SendAsync("ReceiveMoreMessages", messages);
        }
        private async Task SendInitialConferenceData(Guid conferenceId, Guid userId, Guid otherUserId, bool isOtherOnline)
        {
            var messages = (await _messageService.GetAllMessagesAsync())
                .Where(m => m.personalConferenceId == conferenceId)
                .OrderByDescending(m => m.messageDateSent)
                .Take(50)
                .ToList();

            await Clients.Caller.SendAsync("ReceiveInitialData", new
            {
                Messages = messages,
                OtherUserId = otherUserId,
                IsOtherOnline = isOtherOnline
            });
        }
    }
}