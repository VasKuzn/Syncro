namespace Syncro.Application.Services
{
    public interface IFriendsService
    {
        public Task<List<FriendsModel>> GetAllFriendsAsync();
        public Task<FriendsModel> GetFriendsByIdAsync(Guid friendsId);
        public Task<FriendsModel> CreateFriendsAsync(FriendsModel friends);
        public Task<bool> DeleteFriendsAsync(Guid friendsId);
        public Task<FriendsModel> UpdateFriendsStatusAsync(Guid friendsId, FriendsStatusEnum statusEnum, DateTime friendsSince);
        public Task<List<FriendsModel>> GetFriendsByAccountAsync(Guid Id);
    }
}