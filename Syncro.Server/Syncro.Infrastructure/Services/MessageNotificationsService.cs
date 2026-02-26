
using Syncro.Domain.Utils;
using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;

namespace Syncro.Infrastructure.Services
{
    public class MessageNotificationsService : IMessageNotificationsService
    {
        private string? _hostName;
        private int _port;
        private readonly IConferenceRepository<PersonalConferenceModel> _personalConferenceRepository;
        private readonly IGroupConferenceMemberRepository _groupConferenceMemberRepository;

        public MessageNotificationsService(IConfiguration configuration, IConferenceRepository<PersonalConferenceModel> personalConferenceRepository, IGroupConferenceMemberRepository groupConferenceMemberRepository)
        {
            _personalConferenceRepository = personalConferenceRepository;
            _groupConferenceMemberRepository = groupConferenceMemberRepository;

            _hostName = configuration["Queue:Hostname"];
            _port = Int32.Parse(configuration["Queue:RabbitMqPort"]);
        }

        private async Task<IChannel> CreateMessagesNotificationsQueueAsync(Guid userId)
        {
            var factoryMessages = new ConnectionFactory { HostName = _hostName, Port = _port };
            var connectionMessages = await factoryMessages.CreateConnectionAsync();
            var channelMessages = await connectionMessages.CreateChannelAsync();

            await channelMessages.QueueDeclareAsync(queue: $"MessagesNotificationQueue-{userId}", durable: true, exclusive: false, autoDelete: false, arguments: null);
            await channelMessages.ExchangeDeclareAsync(exchange: "MessagesNotificationsExchanger", type: ExchangeType.Direct);
            await channelMessages.QueueBindAsync(queue: $"MessagesNotificationQueue-{userId}", exchange: "MessagesNotificationsExchanger", routingKey:$"MessagesNotificationQueue-{userId}");

            return channelMessages;
        }

        private async Task SendMessageNotificationToUser(MessageModel message, Guid recipientUserId)
        {
            var channel = await CreateMessagesNotificationsQueueAsync(recipientUserId);

                string notificationContent = message.Id.ToString();
                var body = Encoding.UTF8.GetBytes(notificationContent);
                
                await channel.BasicPublishAsync(exchange: "MessagesNotificationsExchanger", routingKey: $"MessagesNotificationQueue-{recipientUserId}", body: body);
        }

        public async Task SendMessageNotificationsAsync(MessageModel message)
        {
            if (message.personalConferenceId != null)
            {
                var personalConference = await _personalConferenceRepository.GetConferenceByIdAsync((Guid)message.personalConferenceId);

                Guid recipientUserId;
                if (personalConference.user1 == message.accountId)
                {
                    recipientUserId = personalConference.user2;
                }
                else recipientUserId = personalConference.user1;

                await SendMessageNotificationToUser(message, recipientUserId);
            }
            else if (message.groupConferenceId != null)
            {
                var groupConferenceUsers = await _groupConferenceMemberRepository.GetAllMembersByConferenceAsync((Guid)message.groupConferenceId);

                foreach (var groupConferenceUser in groupConferenceUsers)
                {
                    if (groupConferenceUser.Id == message.accountId) continue;

                    await SendMessageNotificationToUser(message, groupConferenceUser.Id);
                }
            }
        }

        public async Task<List<string>> GetAllMessageNotificationsTest(Guid userId)
        {
            List<string> notifications = new List<string>();

            var channel = await CreateMessagesNotificationsQueueAsync(userId);

            while (true)
            {
                BasicGetResult? result = await channel.BasicGetAsync(queue: $"MessagesNotificationQueue-{userId}", true);
                if (result != null)
                {
                    string message = Encoding.UTF8.GetString(result.Body.ToArray());
                    notifications.Add(message);
                }
                else break;
            }

            return notifications;
        }
    }
}