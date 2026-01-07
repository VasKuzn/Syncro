using Couchbase;
using Couchbase.Core.Exceptions.KeyValue;
using Couchbase.Query;
using Newtonsoft.Json.Linq;
using Couchbase.KeyValue;
using Microsoft.Extensions.Configuration;

namespace Syncro.Infrastructure.CouchBaseStorage
{
    public class CouchBaseMessagesService : ICouchBaseMessagesService
    {
        private readonly ICluster _cluster;
        private readonly IBucket _bucket;
        private readonly IScope _scope;
        private readonly ICouchbaseCollection _collection;

        private readonly string _bucketName;
        private readonly string _scopeName;
        private readonly string _collectionName;

        public CouchBaseMessagesService(IConfiguration configuration)
        {
            var endpoint = configuration["Couchbase:Endpoint"];
            var username = configuration["Couchbase:Username"];
            var password = configuration["Couchbase:Password"];
            _bucketName = configuration["Couchbase:BucketName"];
            _scopeName = configuration["Couchbase:ScopeName"];
            _collectionName = configuration["Couchbase:CollectionName"];

            if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                throw new ArgumentException("Couchbase configuration is missing");
            }

            var clusterOptions = new ClusterOptions
            {
                UserName = username,
                Password = password
            };

            clusterOptions.ApplyProfile("wan-development");

            try
            {
                _cluster = Cluster.ConnectAsync(endpoint, clusterOptions).GetAwaiter().GetResult();
                _bucket = _cluster.BucketAsync(_bucketName).GetAwaiter().GetResult();

                _bucket.WaitUntilReadyAsync(TimeSpan.FromSeconds(10)).GetAwaiter().GetResult();

                _scope = _bucket.ScopeAsync(_scopeName).GetAwaiter().GetResult();
                _collection = _scope.CollectionAsync(_collectionName).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to connect to Couchbase: {ex.Message}", ex);
            }
        }

        private string GetMessageKey(Guid messageId) => $"message_{messageId}";

        public async Task<List<MessageModel>> GetAllMessagesAsync()
        {
            try
            {
                var query = $"SELECT m.* FROM `{_bucketName}`.`{_scopeName}`.`{_collectionName}` m WHERE m.type = 'message'";
                var result = await _cluster.QueryAsync<MessageModel>(query);

                var messages = new List<MessageModel>();
                await foreach (var row in result)
                {
                    messages.Add(row);
                }

                return messages;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting all messages: {ex}");
                throw;
            }
        }

        public async Task<List<MessageModel>> GetAllMessagesByPersonalConferenceAsync(Guid personalConferenceId)
        {
            if (personalConferenceId == Guid.Empty)
            {
                throw new ArgumentException("Personal conference ID cannot be empty", nameof(personalConferenceId));
            }

            try
            {
                var query = $@"
                    SELECT m.* 
                    FROM `{_bucketName}`.`{_scopeName}`.`{_collectionName}` m 
                    WHERE m.type = 'message' 
                    AND m.personalConferenceId = $personalConferenceId 
                    ORDER BY m.messageDateSent ASC";

                var parameters = new QueryOptions()
                    .Parameter("personalConferenceId", personalConferenceId);

                var result = await _cluster.QueryAsync<MessageModel>(query, parameters);

                var messages = new List<MessageModel>();
                await foreach (var row in result)
                {
                    messages.Add(row);
                }

                return messages;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting messages by personal conference: {ex}");
                throw;
            }
        }

        public async Task<MessageModel> GetMessageByIdAsync(Guid messageId)
        {
            try
            {
                var result = await _collection.GetAsync(GetMessageKey(messageId));
                var message = result.ContentAs<MessageModel>();
                return message ?? throw new KeyNotFoundException("Message not found");
            }
            catch (DocumentNotFoundException)
            {
                throw new KeyNotFoundException("Message not found");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting message by ID: {ex}");
                throw;
            }
        }

        public async Task<MessageModel> CreateMessageAsync(MessageModel message)
        {
            try
            {
                if (message.messageContent == null)
                {
                    throw new ArgumentException("Message content is empty");
                }

                if (message.accountId == null)
                {
                    throw new ArgumentException("AccountId cannot be null");
                }

                if (message.Id == Guid.Empty)
                {
                    message.Id = Guid.NewGuid();
                }

                if (message.messageDateSent == default)
                {
                    message.messageDateSent = DateTime.UtcNow;
                }

                var document = new JObject
                {
                    ["type"] = "message",
                    ["id"] = message.Id,
                    ["messageContent"] = message.messageContent,
                    ["messageDateSent"] = message.messageDateSent,
                    ["accountId"] = message.accountId,
                    ["accountNickname"] = message.accountNickname,
                    ["personalConferenceId"] = message.personalConferenceId,
                    ["groupConferenceId"] = message.groupConferenceId,
                    ["sectorId"] = message.sectorId,
                    ["isEdited"] = message.isEdited,
                    ["previousMessageContent"] = message.previousMessageContent,
                    ["isPinned"] = message.isPinned,
                    ["isRead"] = message.isRead,
                    ["referenceMessageId"] = message.referenceMessageId,
                    ["MediaUrl"] = message.MediaUrl,
                    ["MediaType"] = message.MediaType?.ToString(),
                    ["FileName"] = message.FileName
                };

                await _collection.InsertAsync(GetMessageKey(message.Id), document);
                return message;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating message: {ex}");
                throw;
            }
        }

        public async Task<bool> DeleteMessageAsync(Guid messageId)
        {
            try
            {
                await _collection.RemoveAsync(GetMessageKey(messageId));
                return true;
            }
            catch (DocumentNotFoundException)
            {
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting message: {ex}");
                throw;
            }
        }

        public async Task<MessageModel> UpdateMessageTextAsync(Guid messageId, MessageDTO messageDTO)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(messageDTO.messageContent))
                    throw new ArgumentException("Message content cannot be empty");

                var existingMessage = await GetMessageByIdAsync(messageId);

                existingMessage.previousMessageContent = existingMessage.messageContent;
                existingMessage.messageContent = messageDTO.messageContent;
                existingMessage.isEdited = true;

                return await UpdateMessageAsync(existingMessage);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating message text: {ex}");
                throw;
            }
        }

        public async Task<MessageModel> MarkMessageAsReadAsync(Guid messageId, Guid readerId, bool isRead)
        {
            try
            {
                var message = await GetMessageByIdAsync(messageId);

                if (message.accountId != readerId)
                {
                    message.isRead = isRead;
                    return await UpdateMessageAsync(message);
                }

                return message;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error marking message as read: {ex}");
                throw;
            }
        }

        public async Task<MessageModel> SetMessageReferenceAsync(Guid messageId, Guid referencedMessageId)
        {
            try
            {
                var message = await GetMessageByIdAsync(messageId);
                message.referenceMessageId = referencedMessageId;
                return await UpdateMessageAsync(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error setting message reference: {ex}");
                throw;
            }
        }

        public async Task<MessageModel> ToggleMessagePinAsync(Guid messageId)
        {
            try
            {
                var message = await GetMessageByIdAsync(messageId);
                message.isPinned = !message.isPinned;
                return await UpdateMessageAsync(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error toggling message pin: {ex}");
                throw;
            }
        }

        public async Task<MessageModel> UpdateMessageAsync(MessageModel message)
        {
            try
            {
                var document = new JObject
                {
                    ["type"] = "message",
                    ["id"] = message.Id,
                    ["messageContent"] = message.messageContent,
                    ["messageDateSent"] = message.messageDateSent,
                    ["accountId"] = message.accountId,
                    ["accountNickname"] = message.accountNickname,
                    ["personalConferenceId"] = message.personalConferenceId,
                    ["groupConferenceId"] = message.groupConferenceId,
                    ["sectorId"] = message.sectorId,
                    ["isEdited"] = message.isEdited,
                    ["previousMessageContent"] = message.previousMessageContent,
                    ["isPinned"] = message.isPinned,
                    ["isRead"] = message.isRead,
                    ["referenceMessageId"] = message.referenceMessageId,
                    ["MediaUrl"] = message.MediaUrl,
                    ["MediaType"] = message.MediaType?.ToString(),
                    ["FileName"] = message.FileName
                };

                await _collection.ReplaceAsync(GetMessageKey(message.Id), document);
                return message;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating message: {ex}");
                throw;
            }
        }
    }
}