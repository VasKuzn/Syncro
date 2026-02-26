using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Syncro.Application.Services
{
    public interface IOnlineNotificationsService
    {
        Task SendOnlineNotificationsAsync(Guid userID, bool onlineStatus);

        Task<List<string>> GetAllOnlineNotificationsTest(Guid userId);
    }
}