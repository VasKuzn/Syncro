
namespace SyncroBackend.StorageOperations
{
    public class FriendsRepository : IFriendsRepository
    {
        public Task<FriendsModel> CreateFriendsAsync(FriendsModel friends)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteFriendsAsync(Guid friendsId)
        {
            throw new NotImplementedException();
        }

        public Task<List<FriendsModel>> GetAllFriendsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<FriendsModel> GetFriendsByIdAsync(Guid friendsId)
        {
            throw new NotImplementedException();
        }

        public Task<FriendsModel> UpdateFriendsAsync(FriendsModel friends)
        {
            throw new NotImplementedException();
        }
    }
}