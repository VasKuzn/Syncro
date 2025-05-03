namespace SyncroBackend.StorageOperations
{
    public class MessageRepository : IMessageRepository
    {
        private readonly DataBaseContext context;

        public MessageRepository(DataBaseContext dbcontext)
        {
            this.context = dbcontext;
        }
        public Task<List<MessageModel>> GetAllMessagesAsync()
        {
            return context.messages.ToListAsync();
        }
        public async Task<MessageModel> GetMessageByIdAsync(Guid messageId)
        {
            return await context.messages.FirstOrDefaultAsync(m => m.Id == messageId)
            ?? throw new ArgumentException("Message not found");
        }
        public async Task<MessageModel> AddMessageAsync(MessageModel message)
        {
            await context.messages.AddAsync(message);
            await context.SaveChangesAsync();

            return message;
        }
        public async Task<bool> DeleteMessageAsync(Guid messageId)
        {
            var deleted = await context.messages
            .Where(m => m.Id == messageId)
            .ExecuteDeleteAsync();

            return deleted > 0;
        }
        public async Task<MessageModel> UpdateMessageTextAsync(MessageModel message)
        {

            context.messages.Update(message);
            await context.SaveChangesAsync();

            return message;
        }
        public async Task<MessageModel> UpdateMessageAdditionalChangeAsync(Guid messageId, bool? togglePin = null, bool? toggleRead = null, Guid? setReferenceMessageId = null)
        {
            var message = await GetMessageByIdAsync(messageId);
            if (togglePin.HasValue)
            {
                message.isPinned = togglePin.Value;
            }
            else if (togglePin == null && (toggleRead.HasValue || setReferenceMessageId.HasValue))
            {
            }
            else
            {
                message.isPinned = !message.isPinned;
            }

            if (toggleRead.HasValue)
            {
                message.isRead = toggleRead.Value;
            }

            if (setReferenceMessageId.HasValue)
            {
                message.referenceMessageId = setReferenceMessageId.Value;
            }

            await context.SaveChangesAsync();
            return message;
        }
    }
}