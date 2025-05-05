namespace SyncroBackend.Interfaces
{
    public interface IAccountRepository
    {
        public Task<List<AccountModel>> GetAllAccountsAsync();
        public Task<AccountModel> AddAccountAsync(AccountModel account);
        public Task<bool> DeleteAccountAsync(Guid accountId);
        public Task<AccountModel> UpdateAccountAsync(AccountModel account);
        public Task<AccountModel> GetAccountByIdAsync(Guid accountId);
        public Task<bool> AccountExistsByNicknameAsync(string nickname);
        public Task<bool> AccountExistsByEmailAsync(string email);
    }
}