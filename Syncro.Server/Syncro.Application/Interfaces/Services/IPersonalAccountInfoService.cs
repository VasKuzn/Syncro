using Syncro.Domain.Utils;

namespace Syncro.Application.Services
{
    public interface IPersonalAccountInfoService
    {
        public Task<List<PersonalAccountInfoModel>> GetAllPersonalAccountInfosAsync();
        public Task<PersonalAccountInfoModel> GetPersonalAccountInfoByIdAsync(Guid accountId);
        public Task<PersonalAccountInfoModel> CreatePersonalAccountInfoAsync(Guid id);
        public Task<bool> DeletePersonalAccountInfoAsync(Guid accountId);
        public Task<PersonalAccountInfoModel> UpdatePersonalAccountInfoAsync(Guid accountId, PersonalAccountInfoModelDTO personalAccountInfoDto);
        public Task<PersonalAccountInfoModel> UpdatePersonalAccountCountryAsync(Guid accountId, int? country);
    }
}