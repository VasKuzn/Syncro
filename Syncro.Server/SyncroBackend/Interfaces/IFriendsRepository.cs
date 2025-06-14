namespace SyncroBackend.Interfaces
{
    public interface IFriendsRepository
    {
        public Task<List<FriendsModel>> GetAllFriendsAsync();
        public Task<FriendsModel> GetFriendsByIdAsync(Guid friendsId);
        public Task<FriendsModel> CreateFriendsAsync(FriendsModel friends);
        public Task<FriendsModel> UpdateFriendsAsync(FriendsModel friends);
        public Task<bool> DeleteFriendsAsync(Guid friendsId);
        public Task<FriendsModel?> CheckFriendshipExistsAsync(Guid user1, Guid user2);
    }
}