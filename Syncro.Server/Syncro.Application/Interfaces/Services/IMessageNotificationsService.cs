using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Syncro.Application.Services
{
    public interface IMessageNotificationsService
    {
        Task SendMessageNotificationsAsync(MessageModel message);

        Task<List<string>> GetAllMessageNotificationsTest(Guid userId);
    }
}