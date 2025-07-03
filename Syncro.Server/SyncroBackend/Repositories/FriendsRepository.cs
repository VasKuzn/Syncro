namespace SyncroBackend.Repositories
{
    public class FriendsRepository : IFriendsRepository
    {
        private readonly DataBaseContext _context;

        public FriendsRepository(DataBaseContext context)
        {
            _context = context;
        }
        public async Task<List<FriendsModel>> GetAllFriendsAsync()
        {
            return await _context.friends.ToListAsync();
        }

        public async Task<FriendsModel> GetFriendsByIdAsync(Guid friendsId)
        {
            return await _context.friends.FirstOrDefaultAsync(f => f.Id == friendsId)
                   ?? throw new ArgumentException("Friends are not found");
        }
        public async Task<List<FriendsModel>> GetFriendsByAccountAsync(Guid Id)
        {
            var friends = await _context.friends
                .Where(f => f.userWhoSent == Id)
                .ToListAsync();

            if (friends == null || !friends.Any())
            {
                throw new ArgumentException("Friends are not found");
            }

            return friends;
        }
        public async Task<FriendsModel> CreateFriendsAsync(FriendsModel friends)
        {
            await _context.friends.AddAsync(friends);
            await _context.SaveChangesAsync();
            return friends;
        }

        public async Task<FriendsModel> UpdateFriendsAsync(FriendsModel friends)
        {
            _context.friends.Update(friends);
            await _context.SaveChangesAsync();
            return friends;
        }

        public async Task<bool> DeleteFriendsAsync(Guid friendsId)
        {
            var deleted = await _context.friends
                .Where(a => a.Id == friendsId)
                .ExecuteDeleteAsync();
            return deleted > 0;
        }
        public async Task<FriendsModel?> CheckFriendshipExistsAsync(Guid user1, Guid user2)
        {
            return await _context.friends
                .FirstOrDefaultAsync(f =>
                    (f.userWhoSent == user1 && f.userWhoRecieved == user2) ||
                    (f.userWhoSent == user2 && f.userWhoRecieved == user1));
        }
    }
}