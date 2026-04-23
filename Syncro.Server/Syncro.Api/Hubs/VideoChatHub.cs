using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace Syncro.Api.Hubs
{
    public class VideoChatHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();
        private static readonly ConcurrentDictionary<string, CallRoom> _activeCalls = new();
        private static readonly ConcurrentDictionary<string, HashSet<string>> _roomParticipants = new();

        // Групповые звонки
        private static readonly ConcurrentDictionary<string, GroupCallRoom> _groupCalls = new();
        private static readonly ConcurrentDictionary<string, string> _activeGroupCallByGroup = new();

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

                // Очищаем персональные комнаты
                foreach (var room in _activeCalls.Values)
                {
                    if (room.Participants.Contains(userId))
                    {
                        await EndCall(room.RoomId);
                    }
                }

                // Удаляем пользователя из групповых комнат
                foreach (var room in _groupCalls.Values)
                {
                    if (room.Participants.Contains(userId))
                    {
                        await LeaveGroupCallInternal(room.RoomId, userId);
                    }
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        // ==================== ПЕРСОНАЛЬНЫЕ ЗВОНКИ ====================
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

                if (!_roomParticipants.ContainsKey(roomId))
                    _roomParticipants[roomId] = new HashSet<string>();
                _roomParticipants[roomId].Add(userId);

                Console.WriteLine($"User {userId} joined room {roomId}");

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

            if (_roomParticipants.TryGetValue(roomId, out var participants) &&
                participants.Count == 2)
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
            }
        }

        public async Task EndCall(string roomId)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"EndCall: User {userId} ending call in room {roomId}");

            if (_activeCalls.TryRemove(roomId, out var callRoom))
            {
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

        // ==================== ГРУППОВЫЕ ЗВОНКИ ====================
        /// <summary>
        /// Создает новый групповой звонок или возвращает существующий, если он уже активен.
        /// participantIds – список всех участников группы, необходим для отправки уведомлений.
        /// </summary>
        public async Task<string> CreateGroupCall(string groupId, List<string> participantIds)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId)) return null;

            // Проверяем, нет ли уже активного звонка в этой группе
            if (_activeGroupCallByGroup.TryGetValue(groupId, out var existingRoomId))
            {
                Console.WriteLine($"Group {groupId} already has an active call: {existingRoomId}");
                return existingRoomId;
            }

            var roomId = Guid.NewGuid().ToString();
            var room = new GroupCallRoom
            {
                RoomId = roomId,
                GroupId = groupId,
                Participants = new HashSet<string> { userId },
                CreatedAt = DateTime.UtcNow
            };
            _groupCalls[roomId] = room;
            _activeGroupCallByGroup[groupId] = roomId;

            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            Console.WriteLine($"Group call room created: {roomId} for group {groupId} by user {userId}");

            // Оповещаем всех участников группы (кроме инициатора)
            foreach (var participantId in participantIds.Where(id => id != userId))
            {
                if (_userConnections.TryGetValue(participantId, out var connectionId))
                {
                    await Clients.Client(connectionId).SendAsync("GroupCallStarted", groupId, roomId, userId);
                }
            }

            return roomId;
        }

        /// <summary>
        /// Возвращает ID активного группового звонка для указанной группы или null.
        /// </summary>
        public string? GetActiveGroupCall(string groupId)
        {
            return _activeGroupCallByGroup.TryGetValue(groupId, out var roomId) ? roomId : null;
        }

        public async Task JoinGroupCall(string roomId)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId)) return;

            if (_groupCalls.TryGetValue(roomId, out var room))
            {
                if (room.Participants.Add(userId))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
                    // Уведомляем всех о новом участнике
                    await Clients.Group(roomId).SendAsync("UserJoinedGroupCall", userId);
                    Console.WriteLine($"User {userId} joined group call {roomId}");
                }
            }
        }

        public async Task LeaveGroupCall(string roomId)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId)) return;
            await LeaveGroupCallInternal(roomId, userId);
        }

        private async Task LeaveGroupCallInternal(string roomId, string userId)
        {
            if (_groupCalls.TryGetValue(roomId, out var room))
            {
                if (room.Participants.Remove(userId))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
                    await Clients.Group(roomId).SendAsync("UserLeftGroupCall", userId);
                    Console.WriteLine($"User {userId} left group call {roomId}");

                    if (room.Participants.Count == 0)
                    {
                        _groupCalls.TryRemove(roomId, out _);
                        _activeGroupCallByGroup.TryRemove(room.GroupId, out _);
                        Console.WriteLine($"Group call room {roomId} removed (empty)");
                    }
                }
            }
        }

        public async Task SendOfferToUser(string roomId, string targetUserId, string offer)
        {
            var userId = Context.UserIdentifier;
            if (_groupCalls.TryGetValue(roomId, out var room) && room.Participants.Contains(userId))
            {
                if (_userConnections.TryGetValue(targetUserId, out var connectionId))
                {
                    await Clients.Client(connectionId).SendAsync("ReceiveGroupOffer", userId, roomId, offer);
                }
            }
        }

        public async Task SendAnswerToUser(string roomId, string targetUserId, string answer)
        {
            var userId = Context.UserIdentifier;
            if (_groupCalls.TryGetValue(roomId, out var room) && room.Participants.Contains(userId))
            {
                if (_userConnections.TryGetValue(targetUserId, out var connectionId))
                {
                    await Clients.Client(connectionId).SendAsync("ReceiveGroupAnswer", userId, roomId, answer);
                }
            }
        }

        public async Task SendIceCandidateToUser(string roomId, string targetUserId, string candidate)
        {
            var userId = Context.UserIdentifier;
            if (_groupCalls.TryGetValue(roomId, out var room) && room.Participants.Contains(userId))
            {
                if (_userConnections.TryGetValue(targetUserId, out var connectionId))
                {
                    await Clients.Client(connectionId).SendAsync("ReceiveGroupIceCandidate", userId, roomId, candidate);
                }
            }
        }

        // ==================== CINEMA MODE (существующий) ====================
        public async Task StartCinemaMode(string roomId, string videoUrl)
        {
            var userId = Context.UserIdentifier;
            Console.WriteLine($"StartCinemaMode: Room {roomId}, URL {videoUrl}, User {userId}");

            if (_activeCalls.TryGetValue(roomId, out var callRoom) && callRoom.Participants.Contains(userId))
            {
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
                await Clients.Group(roomId).SendAsync("CinemaVideoChanged", newVideoUrl, userId);
                Console.WriteLine($"ChangeCinemaVideo: Video changed in room {roomId}");
            }
            else
            {
                Console.WriteLine($"ChangeCinemaVideo: User {userId} not authorized for room {roomId}");
            }
        }
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ КЛАССЫ ====================
    public class CallRoom
    {
        public string RoomId { get; set; }
        public string InitiatorId { get; set; }
        public List<string> Participants { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class GroupCallRoom
    {
        public string RoomId { get; set; }
        public string GroupId { get; set; }
        public HashSet<string> Participants { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }
}