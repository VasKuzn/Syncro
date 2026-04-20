using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace Syncro.Api.Hubs
{
    public class VideoChatHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();
        private static readonly ConcurrentDictionary<string, CallRoom> _activeCalls = new();
        private static readonly ConcurrentDictionary<string, HashSet<string>> _roomParticipants = new(); // Отслеживаем кто в комнате

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

                // Очищаем комнаты при отключении
                foreach (var room in _activeCalls.Values)
                {
                    if (room.Participants.Contains(userId))
                    {
                        await EndCall(room.RoomId);
                    }
                }
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

            // Добавляем вызывающего в комнату
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

            // Инициализируем список участников комнаты
            _roomParticipants[roomId] = new HashSet<string> { callerId };

            Console.WriteLine($"Room created: {roomId}, Caller: {callerId}, Target: {targetUserId}");

            return roomId;
        }

        public async Task JoinCall(string roomId)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"JoinCall: User {userId} joining room {roomId}");

            if (string.IsNullOrEmpty(userId)) return;

            if (_activeCalls.TryGetValue(roomId, out var callRoom) &&
                callRoom.Participants.Contains(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

                // Добавляем пользователя в список участников комнаты
                if (!_roomParticipants.ContainsKey(roomId))
                {
                    _roomParticipants[roomId] = new HashSet<string>();
                }
                _roomParticipants[roomId].Add(userId);

                Console.WriteLine($"User {userId} joined room {roomId}");

                // Уведомляем другого участника о присоединении
                var otherParticipant = callRoom.Participants.FirstOrDefault(p => p != userId);
                if (otherParticipant != null && _roomParticipants[roomId].Contains(otherParticipant))
                {
                    await Clients.Group(roomId).SendAsync("UserJoinedCall", userId);
                    Console.WriteLine($"Both participants now in room {roomId}");
                }
            }
        }

        public async Task SendOffer(string roomId, string offer)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"SendOffer: User {userId} sending offer to room {roomId}");

            if (_activeCalls.TryGetValue(roomId, out var callRoom))
            {
                var targetUser = callRoom.Participants.FirstOrDefault(p => p != userId);
                if (!string.IsNullOrEmpty(targetUser) &&
                    _userConnections.TryGetValue(targetUser, out var targetConnectionId))
                {
                    Console.WriteLine($"Sending offer to target user: {targetUser}");
                    await Clients.Client(targetConnectionId).SendAsync("ReceiveOffer", userId, roomId, offer);
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
                if (!string.IsNullOrEmpty(targetUser) &&
                    _userConnections.TryGetValue(targetUser, out var targetConnectionId))
                {
                    Console.WriteLine($"Sending answer to target user: {targetUser}");
                    await Clients.Client(targetConnectionId).SendAsync("ReceiveAnswer", userId, roomId, answer);
                }
            }
        }

        public async Task SendIceCandidate(string roomId, string candidate)
        {
            var userId = Context.UserIdentifier;

            // Проверяем, что оба участника в комнате
            if (_roomParticipants.TryGetValue(roomId, out var participants) &&
                participants.Count == 2) // Оба участника присоединились
            {
                Console.WriteLine($"SendIceCandidate: User {userId} sending ICE to room {roomId} (both participants ready)");

                if (_activeCalls.TryGetValue(roomId, out var callRoom))
                {
                    var targetUser = callRoom.Participants.FirstOrDefault(p => p != userId);
                    if (!string.IsNullOrEmpty(targetUser) &&
                        _userConnections.TryGetValue(targetUser, out var targetConnectionId))
                    {
                        await Clients.Client(targetConnectionId).SendAsync("ReceiveIceCandidate", userId, roomId, candidate);
                    }
                }
            }
            else
            {
                Console.WriteLine($"SendIceCandidate: User {userId} sending ICE to room {roomId} - waiting for other participant");
                // Можно буферизовать на сервере, если нужно
                // Но лучше буферизовать на клиенте, как мы уже делаем
            }
        }

        public async Task EndCall(string roomId)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"EndCall: User {userId} ending call in room {roomId}");

            if (_activeCalls.TryRemove(roomId, out var callRoom))
            {
                // Удаляем из отслеживания участников
                _roomParticipants.TryRemove(roomId, out _);

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
        public async Task StartCinemaMode(string roomId, string videoUrl)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"StartCinemaMode: Room {roomId}, URL {videoUrl}, User {userId}");

            if (_activeCalls.TryGetValue(roomId, out var callRoom) && callRoom.Participants.Contains(userId))
            {
                // Отправляем всем участникам комнаты, включая инициатора
                await Clients.Group(roomId).SendAsync("CinemaModeStarted", videoUrl, userId);
                Console.WriteLine($"StartCinemaMode: Cinema mode started in room {roomId}");
            }
            else
            {
                Console.WriteLine($"StartCinemaMode: User {userId} not authorized for room {roomId}");
            }
        }

        public async Task StopCinemaMode(string roomId)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"StopCinemaMode: Room {roomId}, User {userId}");

            if (_activeCalls.TryGetValue(roomId, out var callRoom) && callRoom.Participants.Contains(userId))
            {
                await Clients.Group(roomId).SendAsync("CinemaModeStopped", userId);
                Console.WriteLine($"StopCinemaMode: Cinema mode stopped in room {roomId}");
            }
            else
            {
                Console.WriteLine($"StopCinemaMode: User {userId} not authorized for room {roomId}");
            }
        }

        public async Task SyncPlayerAction(string roomId, string action, double data)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"SyncPlayerAction: Room {roomId}, Action {action}, Data {data}, User {userId}");

            if (_activeCalls.TryGetValue(roomId, out var callRoom) && callRoom.Participants.Contains(userId))
            {
                // Отправляем действие остальным участникам комнаты
                await Clients.OthersInGroup(roomId).SendAsync("PlayerActionReceived", action, data, userId);
                Console.WriteLine($"SyncPlayerAction: Sent to others in group");
            }
            else
            {
                Console.WriteLine($"SyncPlayerAction: User {userId} not authorized for room {roomId}");
            }
        }

        public async Task ChangeCinemaVideo(string roomId, string newVideoUrl)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"ChangeCinemaVideo: Room {roomId}, URL {newVideoUrl}, User {userId}");

            if (_activeCalls.TryGetValue(roomId, out var callRoom) && callRoom.Participants.Contains(userId))
            {
                // Отправляем новый URL всем в комнате
                await Clients.Group(roomId).SendAsync("CinemaVideoChanged", newVideoUrl, userId);
                Console.WriteLine($"ChangeCinemaVideo: Video changed in room {roomId}");
            }
            else
            {
                Console.WriteLine($"ChangeCinemaVideo: User {userId} not authorized for room {roomId}");
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