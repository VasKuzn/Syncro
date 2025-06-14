namespace SyncroBackend.Interfaces
{
    public interface IMessageService
    {
        public Task<List<MessageModel>> GetAllMessagesAsync();
        public Task<MessageModel> GetMessageByIdAsync(Guid messageId);
        public Task<MessageModel> CreateMessageAsync(MessageModel message);
        public Task<MessageModel> UpdateMessageTextAsync(Guid messageId, MessageDTO messageDTO);
        public Task<bool> DeleteMessageAsync(Guid messageId);
        public Task<MessageModel> ToggleMessagePinAsync(Guid messageId);
        public Task<MessageModel> MarkMessageAsReadAsync(Guid messageId, Guid readerId, bool isRead);
        public Task<MessageModel> SetMessageReferenceAsync(Guid messageId, Guid referencedMessageId);
    }
}