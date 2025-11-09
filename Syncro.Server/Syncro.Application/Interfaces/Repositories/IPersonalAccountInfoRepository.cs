namespace Syncro.Application.Interfaces.Repositories
{
    public interface IPersonalAccountInfoRepository
    {
        public Task<List<PersonalAccountInfoModel>> GetAllPersonalAccountInfosAsync();
        public Task<PersonalAccountInfoModel> GetPersonalAccountInfoByIdAsync(Guid accountId);
        public Task<PersonalAccountInfoModel> AddPersonalAccountInfoAsync(PersonalAccountInfoModel personalAccountInfo);
        public Task<bool> DeletePersonalAccountInfoAsync(Guid accountId);
        public Task<PersonalAccountInfoModel> UpdatePersonalAccountInfoAsync(PersonalAccountInfoModel personalAccountInfo);
    }
}