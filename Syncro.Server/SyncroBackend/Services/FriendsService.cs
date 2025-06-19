namespace SyncroBackend.Services
{
    public class FriendsService : IFriendsService
    {
        private readonly IFriendsRepository _friendsRepository;

        public FriendsService(IFriendsRepository friendsRepository)
        {
            _friendsRepository = friendsRepository;
        }
        public async Task<List<FriendsModel>> GetAllFriendsAsync()
        {
            return await _friendsRepository.GetAllFriendsAsync();
        }

        public async Task<FriendsModel> GetFriendsByIdAsync(Guid friendsId)
        {
            return await _friendsRepository.GetFriendsByIdAsync(friendsId);
        }
        public async Task<List<FriendsModel>> GetFriendsByAccountAsync(Guid Id)
        {
            return await _friendsRepository.GetFriendsByAccountAsync(Id);
        }

        public async Task<FriendsModel> CreateFriendsAsync(FriendsModel friends)
        {
            // Проверяем существует ли уже связь между этими пользователями в любом направлении
            var existingFriendship = await _friendsRepository.CheckFriendshipExistsAsync(
                friends.userWhoSent,
                friends.userWhoRecieved);

            if (existingFriendship != null)
            {
                throw new ArgumentException("Friendship between these users already exists");
            }
            friends.friendsSince = DateTime.UtcNow;

            return await _friendsRepository.CreateFriendsAsync(friends);
        }

        public async Task<bool> DeleteFriendsAsync(Guid friendsId)
        {
            return await _friendsRepository.DeleteFriendsAsync(friendsId);
        }

        public async Task<FriendsModel> UpdateFriendsStatusAsync(Guid friendsId, FriendsStatusEnum statusEnum, DateTime friendsSince)
        {
            var friendsToChangeStatus = await _friendsRepository.GetFriendsByIdAsync(friendsId);
            friendsToChangeStatus.status = statusEnum;
            friendsToChangeStatus.friendsSince = friendsSince;
            return await _friendsRepository.UpdateFriendsAsync(friendsToChangeStatus);
        }
    }
}