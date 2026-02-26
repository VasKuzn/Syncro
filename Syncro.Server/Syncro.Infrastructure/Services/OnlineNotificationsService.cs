
using Syncro.Domain.Utils;
using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;

namespace Syncro.Infrastructure.Services
{
    public class OnlineNotificationsService : IOnlineNotificationsService
    {
        private string? _hostName;
        private int _port;
        private readonly IFriendsRepository _friendsRepository;
        private readonly IAccountRepository _accountRepository;

        public OnlineNotificationsService(IConfiguration configuration, IFriendsRepository friendsRepository, IAccountRepository accountRepository)
        {
            _hostName = configuration["Queue:Hostname"];
            _port = Int32.Parse(configuration["Queue:RabbitMqPort"]);
            _friendsRepository = friendsRepository;
            _accountRepository = accountRepository;
        }

        private async Task<IChannel> CreateOnlineNotificationsQueueAsync(Guid userID)
        {
            var factoryOnline = new ConnectionFactory { HostName = _hostName, Port = _port };
            var connectionOnline = await factoryOnline.CreateConnectionAsync();
            var channelOnline = await connectionOnline.CreateChannelAsync();

            await channelOnline.QueueDeclareAsync(queue: $"OnlineNotificationQueue-{userID}", durable: true, exclusive: false, autoDelete: false, arguments: null);
            await channelOnline.ExchangeDeclareAsync(exchange: "OnlineNotificationsExchanger", type: ExchangeType.Direct);
            await channelOnline.QueueBindAsync(queue: $"OnlineNotificationQueue-{userID}", exchange: "OnlineNotificationsExchanger", routingKey:$"OnlineNotificationQueue-{userID}");

            return channelOnline;
        }

        private async Task SendOnlineNotificationToUser(Guid recipientUserID, Guid userID, bool onlineStatus)
        {
            var channel = await CreateOnlineNotificationsQueueAsync(recipientUserID);

                string notificationContent = userID.ToString() + "_" + onlineStatus.ToString();
                var body = Encoding.UTF8.GetBytes(notificationContent);
                
                await channel.BasicPublishAsync(exchange: "OnlineNotificationsExchanger", routingKey: $"OnlineNotificationQueue-{recipientUserID}", body: body);
        }

        public async Task SendOnlineNotificationsAsync(Guid userID, bool onlineStatus)
        {
            var userFriends = await _friendsRepository.GetFriendsByAccountAsync(userID);

            foreach (var friend in userFriends)
            {
                Guid recipientUserID;
                if (friend.userWhoRecieved == userID)
                {
                    recipientUserID = friend.userWhoSent;
                }
                else recipientUserID = friend.userWhoRecieved;

                await SendOnlineNotificationToUser(recipientUserID, userID, onlineStatus);
            }
        }

        public async Task<List<string>> GetAllOnlineNotificationsTest(Guid userId)
        {
            List<string> notifications = new List<string>();

            var channel = await CreateOnlineNotificationsQueueAsync(userId);

            while (true)
            {
                BasicGetResult? result = await channel.BasicGetAsync(queue: $"OnlineNotificationQueue-{userId}", true);
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