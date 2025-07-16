namespace SyncroBackend.Interfaces
{
    public interface IMessageRepository
    {
        public Task<List<MessageModel>> GetAllMessagesAsync();
        public Task<MessageModel> GetMessageByIdAsync(Guid messageId);
        public Task<MessageModel> AddMessageAsync(MessageModel message);
        public Task<bool> DeleteMessageAsync(Guid messageId);
        public Task<MessageModel> UpdateMessageTextAsync(MessageModel message);
        public Task<MessageModel> UpdateMessageAdditionalChangeAsync(Guid messageId, bool? togglePin = null, bool? toggleRead = null, Guid? setReferenceMessageId = null);
        public Task<List<MessageModel>> GetAllMessagesByPersonalConferenceAsync(Guid personalConferenceId);
    }
}