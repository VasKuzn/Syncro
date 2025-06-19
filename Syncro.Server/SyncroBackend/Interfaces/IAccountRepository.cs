namespace SyncroBackend.Interfaces
{
    public interface IAccountRepository
    {
        public Task<List<AccountModel>> GetAllAccountsAsync();
        public Task<AccountModel> GetAccountByIdAsync(Guid accountId);
        public Task<AccountModel> AddAccountAsync(AccountModel account);
        public Task<bool> DeleteAccountAsync(Guid accountId);
        public Task<AccountModel> UpdateAccountAsync(AccountModel account);
        public Task<bool> AccountExistsByNicknameAsync(string nickname);
        public Task<bool> AccountExistsByEmailAsync(string email);
        public Task<AccountModel> GetAccountByEmailAsync(string email);
        public Task<AccountModel> GetAccountByNicknameAsync(string nickname);
    }
}