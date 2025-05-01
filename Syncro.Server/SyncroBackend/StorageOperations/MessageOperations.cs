namespace SyncroBackend.StorageOperations
{
    public class MessageOperations
    {
        private readonly DataBaseContext context;

        public MessageOperations(DataBaseContext dbcontext)
        {
            this.context = dbcontext;
        }
        public Task<List<MessageModel>> GetAll()
        {
            return context.messages.ToListAsync();
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
        public async Task<MessageModel> EditMessageTextChangeAsync(Guid messageId, [FromBody] MessageDTO MessageDto)
        {
            var editedMessage = await context.messages.FirstOrDefaultAsync(m => m.Id == messageId);

            if (editedMessage == null)
            {
                throw new KeyNotFoundException($"Message for editing is not found");
            }

            editedMessage.previousMessageContent = editedMessage.messageContent;
            editedMessage.messageContent = MessageDto.messageContent;
            editedMessage.isEdited = true;
            await context.SaveChangesAsync();

            return editedMessage;
        }
        public async Task<MessageModel> EditMessagePinChangeAsync(Guid messageId)
        {
            var editedMessage = await context.messages.FirstOrDefaultAsync(m => m.Id == messageId);

            if (editedMessage == null)
            {
                throw new KeyNotFoundException($"Message for editing is not found");
            }

            editedMessage.isPinned = !editedMessage.isPinned;
            await context.SaveChangesAsync();

            return editedMessage;
        }
        public async Task<MessageModel> EditMessageReadChangeAsync(Guid messageId)
        {
            var editedMessage = await context.messages.FirstOrDefaultAsync(m => m.Id == messageId);

            if (editedMessage == null)
            {
                throw new KeyNotFoundException($"Message for editing is not found");
            }

            editedMessage.isRead = !editedMessage.isRead;
            await context.SaveChangesAsync();

            return editedMessage;
        }
        public async Task<MessageModel> EditMessageRefferenceChangeAsync(Guid messageId, Guid messageIdToRef)
        {
            var editedMessage = await context.messages.FirstOrDefaultAsync(m => m.Id == messageId);

            if (editedMessage == null)
            {
                throw new KeyNotFoundException($"Message for editing is not found");
            }

            editedMessage.referenceMessageId = messageIdToRef;
            await context.SaveChangesAsync();

            return editedMessage;
        }

    }
}