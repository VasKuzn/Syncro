using Syncro.Domain.Utils;

namespace Syncro.Application.Services
{
    public interface IAccountService
    {
        public Task<List<AccountModel>> GetAllAccountsAsync();
        public Task<AccountModel> GetAccountByIdAsync(Guid accountId);
        public Task<AccountModel> CreateAccountAsync(AccountModel account);
        public Task<bool> DeleteAccountAsync(Guid accountId);
        public Task<AccountModel> UpdateAccountAsync(Guid accountId, AccountModelDTO accountDto);
        public bool VerifyPassword(string password, string hashedPassword);
        public Task<Result<string>> Login(string email, string password);
        public Task<AccountModel> GetAccountByEmailAsync(string email);
        public Task<AccountModel> GetAccountByNicknameAsync(string nickname);
        public Task<string> GetAccountAvatarUrlAsync(Guid accountId);
        public Task<AccountModel> DeleteAccountAvatarAsync(Guid accountId);
        public Task<AccountModel> ResetPassword(Guid accountId, string password);
        public Task<Result<bool>> Logout(Guid accountId);
    }
}