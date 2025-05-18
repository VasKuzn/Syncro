namespace SyncroBackend.Hubs
{
    public class GroupChatHub : Hub
    {
        private readonly IGroupConferenceService<GroupConferenceModel> _conferenceService;
        private readonly IGroupConferenceMemberService _memberService;
        private readonly IMessageService _messageService;
        private readonly IAccountService _accountService;
        private static readonly ConcurrentDictionary<Guid, string> _activeConnections = new();

        public GroupChatHub(
            IGroupConferenceService<GroupConferenceModel> conferenceService,
            IGroupConferenceMemberService memberService,
            IMessageService messageService,
            IAccountService accountService)
        {
            _conferenceService = conferenceService;
            _memberService = memberService;
            _messageService = messageService;
            _accountService = accountService;
        }

        public async Task JoinGroupConference(Guid conferenceId, Guid userId)
        {
            // Проверяем, что пользователь является участником группы
            var members = await _memberService.GetAllMembersByConferenceAsync(conferenceId);
            if (!members.Any(m => m.accountId == userId))
                throw new HubException($"User {userId} is not a member of conference {conferenceId}");

            var groupName = GetGroupConferenceName(conferenceId);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            await MarkAllMessagesAsRead(conferenceId, userId);

            await SendInitialConferenceData(conferenceId, userId);
        }

        private async Task MarkAllMessagesAsRead(Guid conferenceId, Guid readerId)
        {
            var unreadMessages = (await _messageService.GetAllMessagesAsync())
                .Where(m => m.groupConferenceId == conferenceId &&
                           m.accountId != readerId &&
                           !m.isRead)
                .ToList();

            foreach (var message in unreadMessages)
            {
                await _messageService.MarkMessageAsReadAsync(message.Id, readerId, true);
            }
        }

        public async Task LeaveGroupConference(Guid conferenceId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupConferenceName(conferenceId));
        }

        public async Task SendGroupMessage(Guid conferenceId, Guid senderId, string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Message content cannot be empty");

            var members = await _memberService.GetAllMembersByConferenceAsync(conferenceId);
            if (!members.Any(m => m.accountId == senderId))
                throw new HubException("Sender is not a conference participant");

            var message = new MessageModel
            {
                messageContent = content,
                messageDateSent = DateTime.UtcNow,
                accountId = senderId,
                groupConferenceId = conferenceId,
                personalConferenceId = null,
                sectorId = null,
                previousMessageContent = null,
                isEdited = false,
                isPinned = false,
                isRead = false,
                referenceMessageId = null,
            };

            var createdMessage = await _messageService.CreateMessageAsync(message);
            var sender = await _accountService.GetAccountByIdAsync(senderId);

            await Clients.Group(GetGroupConferenceName(conferenceId))
                .SendAsync("ReceiveGroupMessage", new
                {
                    MessageId = createdMessage.Id,
                    SenderId = senderId,
                    SenderName = sender.nickname,
                    Content = content,
                    Timestamp = DateTime.UtcNow,
                    GroupId = conferenceId
                });
        }

        public async Task EditGroupMessage(Guid messageId, string newContent)
        {
            var userId = GetUserIdFromContext();
            var message = await _messageService.GetMessageByIdAsync(messageId);

            if (!message.groupConferenceId.HasValue)
                throw new HubException("Message is not in a group conference");

            // Проверяем права на редактирование (только автор) - потом сделать
            var updatedMessage = await _messageService.UpdateMessageTextAsync(
                messageId,
                new MessageDTO { messageContent = newContent });

            await Clients.Group(GetGroupConferenceName(message.groupConferenceId.Value))
                .SendAsync("GroupMessageEdited", new
                {
                    MessageId = messageId,
                    NewContent = newContent,
                    EditTimestamp = DateTime.UtcNow
                });
        }

        public async Task DeleteGroupMessage(Guid messageId)
        {
            var userId = GetUserIdFromContext();
            var message = await _messageService.GetMessageByIdAsync(messageId);

            if (!message.groupConferenceId.HasValue)
                throw new HubException("Message is not in a group conference");

            // Проверяем права (автор или администратор группы) - аналогично


            if (await _messageService.DeleteMessageAsync(messageId))
            {
                await Clients.Group(GetGroupConferenceName(message.groupConferenceId.Value))
                    .SendAsync("GroupMessageDeleted", messageId);
            }
        }

        public async Task TogglePinGroupMessage(Guid messageId)
        {
            var userId = GetUserIdFromContext();
            var message = await _messageService.GetMessageByIdAsync(messageId);

            if (!message.groupConferenceId.HasValue)
                throw new HubException("Message is not in a group conference");

            // Только администраторы могут закреплять - попробовать сделать потом
            var result = await _messageService.ToggleMessagePinAsync(messageId);

            await Clients.Group(GetGroupConferenceName(message.groupConferenceId.Value))
                .SendAsync("GroupMessagePinToggled", new
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

        private string GetGroupConferenceName(Guid conferenceId)
        {
            return $"Group conference {conferenceId}";
        }

        private Guid GetUserIdFromContext()
        {
            var httpContext = Context.GetHttpContext();
            return Guid.Parse(httpContext.Request.Query["userId"]);
        }

        public async Task LoadMoreGroupMessages(Guid conferenceId, int loadedCount)
        {
            var messages = (await _messageService.GetAllMessagesAsync())
                .Where(m => m.groupConferenceId == conferenceId)
                .OrderByDescending(m => m.messageDateSent)
                .Skip(loadedCount)
                .Take(50)
                .ToList();

            await Clients.Caller.SendAsync("ReceiveMoreGroupMessages", messages);
        }

        private async Task SendInitialConferenceData(Guid conferenceId, Guid userId)
        {
            var messages = (await _messageService.GetAllMessagesAsync())
                .Where(m => m.groupConferenceId == conferenceId)
                .OrderByDescending(m => m.messageDateSent)
                .Take(50)
                .ToList();

            var groupInfo = await _conferenceService.GetConferenceByIdAsync(conferenceId);
            var members = await _memberService.GetAllMembersByConferenceAsync(conferenceId);

            await Clients.Caller.SendAsync("ReceiveGroupInitialData", new
            {
                Messages = messages,
                GroupInfo = groupInfo,
                Members = members.Select(m => new
                {
                    UserId = m.accountId,
                    Nickname = m.groupConferenceNickname,
                }),
                CurrentUserId = userId
            });
        }
    }
}