using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace Syncro.Api.Hubs
{
    public class VideoChatHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();
        private static readonly ConcurrentDictionary<string, CallRoom> _activeCalls = new();

        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                _userConnections[userId] = Context.ConnectionId;
                Console.WriteLine($"User connected: {userId}, ConnectionId: {Context.ConnectionId}");
                await Clients.All.SendAsync("UserConnected", userId);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                Console.WriteLine($"User disconnected: {userId}");
                _userConnections.TryRemove(userId, out _);
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task<string> CreateCall(string targetUserId)
        {
            var callerId = Context.UserIdentifier;
            Console.WriteLine($"CreateCall from {callerId} to {targetUserId}");

            if (string.IsNullOrEmpty(callerId)) return null;

            var roomId = Guid.NewGuid().ToString();

            _activeCalls[roomId] = new CallRoom
            {
                RoomId = roomId,
                InitiatorId = callerId,
                Participants = new List<string> { callerId, targetUserId },
                CreatedAt = DateTime.UtcNow
            };

            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            Console.WriteLine($"Room created: {roomId}, Caller: {callerId}, Target: {targetUserId}");

            return roomId;
        }

        public async Task JoinCall(string roomId)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"JoinCall: User {userId} joining room {roomId}");

            if (string.IsNullOrEmpty(userId)) return;

            if (_activeCalls.TryGetValue(roomId, out var callRoom))
            {
                if (callRoom.Participants.Contains(userId))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
                    Console.WriteLine($"User {userId} joined room {roomId}");

                    // Уведомляем другого участника
                    await Clients.GroupExcept(roomId, Context.ConnectionId)
                        .SendAsync("UserJoinedCall", userId);
                }
            }
        }

        public async Task SendOffer(string roomId, string offer)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"SendOffer: User {userId} sending offer to room {roomId}");

            // Получаем целевого пользователя (не отправителя)
            if (_activeCalls.TryGetValue(roomId, out var callRoom))
            {
                var targetUser = callRoom.Participants.FirstOrDefault(p => p != userId);
                if (!string.IsNullOrEmpty(targetUser) && _userConnections.TryGetValue(targetUser, out var targetConnectionId))
                {
                    Console.WriteLine($"Sending offer to target user: {targetUser}, ConnectionId: {targetConnectionId}");
                    await Clients.Client(targetConnectionId).SendAsync("ReceiveOffer", userId, roomId, offer);
                }
                else
                {
                    Console.WriteLine($"Target user {targetUser} not found or not connected");
                }
            }
        }

        public async Task SendAnswer(string roomId, string answer)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"SendAnswer: User {userId} sending answer to room {roomId}");

            if (_activeCalls.TryGetValue(roomId, out var callRoom))
            {
                var targetUser = callRoom.Participants.FirstOrDefault(p => p != userId);
                if (!string.IsNullOrEmpty(targetUser) && _userConnections.TryGetValue(targetUser, out var targetConnectionId))
                {
                    Console.WriteLine($"Sending answer to target user: {targetUser}");
                    await Clients.Client(targetConnectionId).SendAsync("ReceiveAnswer", userId, roomId, answer);
                }
            }
        }

        public async Task SendIceCandidate(string roomId, string candidate)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"SendIceCandidate: User {userId} sending ICE to room {roomId}");

            if (_activeCalls.TryGetValue(roomId, out var callRoom))
            {
                var targetUser = callRoom.Participants.FirstOrDefault(p => p != userId);
                if (!string.IsNullOrEmpty(targetUser) && _userConnections.TryGetValue(targetUser, out var targetConnectionId))
                {
                    await Clients.Client(targetConnectionId).SendAsync("ReceiveIceCandidate", userId, roomId, candidate);
                }
            }
        }

        public async Task EndCall(string roomId)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"EndCall: User {userId} ending call in room {roomId}");

            if (_activeCalls.TryRemove(roomId, out var callRoom))
            {
                foreach (var participantId in callRoom.Participants)
                {
                    if (_userConnections.TryGetValue(participantId, out var connectionId))
                    {
                        await Clients.Client(connectionId).SendAsync("CallEnded", userId);
                        await Groups.RemoveFromGroupAsync(connectionId, roomId);
                    }
                }
                Console.WriteLine($"Call ended in room {roomId}");
            }
        }
    }

    public class CallRoom
    {
        public string RoomId { get; set; }
        public string InitiatorId { get; set; }
        public List<string> Participants { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}