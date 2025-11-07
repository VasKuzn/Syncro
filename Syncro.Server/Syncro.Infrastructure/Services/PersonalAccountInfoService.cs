using Syncro.Application.JWT;
using Syncro.Domain.Utils;

using Amazon.Runtime.Internal.Util;
using Syncro.Application.Interfaces.Repositories;

namespace Syncro.Infrastructure.Services
{
    public class PersonalAccountInfoService : IPersonalAccountInfoService
    {
        private readonly IPersonalAccountInfoRepository _infoRepository;

        public PersonalAccountInfoService(IPersonalAccountInfoRepository infoRepository, IJwtProvider jwtProvider)
        {
            _infoRepository = infoRepository;
        }
        public async Task<List<PersonalAccountInfoModel>> GetAllPersonalAccountInfosAsync()
        {
            return await _infoRepository.GetAllPersonalAccountInfosAsync();
        }
        public async Task<PersonalAccountInfoModel> GetPersonalAccountInfoByIdAsync(Guid accountId)
        {
            return await _infoRepository.GetPersonalAccountInfoByIdAsync(accountId);
        }
        public async Task<PersonalAccountInfoModel> CreatePersonalAccountInfoAsync(PersonalAccountInfoModel personalAccountInfo)
        {
            return await _infoRepository.AddPersonalAccountInfoAsync(personalAccountInfo);
        }
        public async Task<bool> DeletePersonalAccountInfoAsync(Guid accountId)
        {
            return await _infoRepository.DeletePersonalAccountInfoAsync(accountId);
        }
        public async Task<PersonalAccountInfoModel> UpdatePersonalAccountInfoAsync(Guid accountId, PersonalAccountInfoModelDTO personalAccountInfoDto)
        {
            var existingPersonalInfo = await _infoRepository.GetPersonalAccountInfoByIdAsync(accountId);

            existingPersonalInfo.dateOfLastOnline = personalAccountInfoDto.dateOfLastOnline;
            existingPersonalInfo.dateOfAccountCreation = personalAccountInfoDto.dateOfAccountCreation;
            existingPersonalInfo.country = personalAccountInfoDto.country;

            return await _infoRepository.UpdatePersonalAccountInfoAsync(existingPersonalInfo);
        }
    }
}