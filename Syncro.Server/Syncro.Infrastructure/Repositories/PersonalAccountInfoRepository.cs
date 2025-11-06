using Syncro.Application.Interfaces.Repositories;

namespace Syncro.Infrastructure.Repositories
{
    public class PersonalAccountInfoRepository : IPersonalAccountInfoRepository
    {
        private readonly DataBaseContext _context;

        public PersonalAccountInfoRepository(DataBaseContext dbContext)
        {
            _context = dbContext;
        }

        public Task<List<PersonalAccountInfoModel>> GetAllPersonalAccountInfosAsync()
        {
            return _context.personalAccountInfo.ToListAsync();
        }
        public async Task<PersonalAccountInfoModel> GetPersonalAccountInfoByIdAsync(Guid accountId)
        {
            return await _context.personalAccountInfo.FirstOrDefaultAsync(a => a.Id == accountId)
                   ?? throw new ArgumentException("Account is not found");
        }
        public async Task<PersonalAccountInfoModel> AddPersonalAccountInfoAsync(PersonalAccountInfoModel personalAccountInfo)
        {
            await _context.personalAccountInfo.AddAsync(personalAccountInfo);
            await _context.SaveChangesAsync();
            return personalAccountInfo;
        }
        public async Task<bool> DeletePersonalAccountInfoAsync(Guid accountId)
        {
            var deleted = await _context.personalAccountInfo
                .Where(a => a.Id == accountId)
                .ExecuteDeleteAsync();
            return deleted > 0;
        }
        public async Task<PersonalAccountInfoModel> UpdatePersonalAccountInfoAsync(PersonalAccountInfoModel personalAccountInfo)
        {
            _context.personalAccountInfo.Update(personalAccountInfo);
            await _context.SaveChangesAsync();
            return personalAccountInfo;
        }
    }
}