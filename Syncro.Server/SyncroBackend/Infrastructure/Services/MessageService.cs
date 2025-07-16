namespace SyncroBackend.Infrastructure.Services
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;

        public MessageService(IMessageRepository messageRepository)
        {
            _messageRepository = messageRepository;
        }
        public async Task<List<MessageModel>> GetAllMessagesAsync()
        {
            return await _messageRepository.GetAllMessagesAsync();
        }

        public async Task<MessageModel> GetMessageByIdAsync(Guid messageId)
        {
            return await _messageRepository.GetMessageByIdAsync(messageId);
        }

        public async Task<MessageModel> CreateMessageAsync(MessageModel message)
        {
            if (message.messageContent == null)
            {
                throw new ArgumentException("message content is empty");
            }
            return await _messageRepository.AddMessageAsync(message);
        }

        public async Task<MessageModel> UpdateMessageTextAsync(Guid messageId, MessageDTO messageDTO)
        {
            if (string.IsNullOrWhiteSpace(messageDTO.messageContent))
                throw new ArgumentException("Message content cannot be empty");

            var editedMessage = await GetMessageByIdAsync(messageId);

            editedMessage.previousMessageContent = editedMessage.messageContent;
            editedMessage.messageContent = messageDTO.messageContent;
            editedMessage.isEdited = true;
            return await _messageRepository.UpdateMessageTextAsync(editedMessage);

        }
        public async Task<MessageModel> MarkMessageAsReadAsync(Guid messageId, Guid readerId, bool isRead)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);
            if (message.accountId != readerId)
            {
                return await _messageRepository.UpdateMessageAdditionalChangeAsync(messageId, toggleRead: isRead);
            }
            return message;
        }

        public async Task<MessageModel> SetMessageReferenceAsync(Guid messageId, Guid referencedMessageId)
        {
            return await _messageRepository.UpdateMessageAdditionalChangeAsync(messageId, setReferenceMessageId: referencedMessageId);
        }

        public async Task<MessageModel> ToggleMessagePinAsync(Guid messageId)
        {
            return await _messageRepository.UpdateMessageAdditionalChangeAsync(messageId, togglePin: true);
        }

        public async Task<bool> DeleteMessageAsync(Guid messageId)
        {
            return await _messageRepository.DeleteMessageAsync(messageId);
        }

        public async Task<List<MessageModel>> GetAllMessagesByPersonalConferenceAsync(Guid personalConferenceId)
        {
            return await _messageRepository.GetAllMessagesByPersonalConferenceAsync(personalConferenceId);
        }
    }
}