public interface ICouchBaseMessagesService
{
    Task<List<MessageModel>> GetAllMessagesAsync();
    Task<MessageModel> GetMessageByIdAsync(Guid messageId);
    Task<MessageModel> CreateMessageAsync(MessageModel message);
    Task<bool> DeleteMessageAsync(Guid messageId);
    Task<MessageModel> UpdateMessageTextAsync(Guid messageId, MessageDTO messageDTO);
    Task<MessageModel> MarkMessageAsReadAsync(Guid messageId, Guid readerId, bool isRead);
    Task<MessageModel> SetMessageReferenceAsync(Guid messageId, Guid referencedMessageId);
    Task<MessageModel> ToggleMessagePinAsync(Guid messageId);
    Task<List<MessageModel>> GetAllMessagesByPersonalConferenceAsync(Guid personalConferenceId);
    Task<MessageModel> UpdateMessageAsync(MessageModel message);
}