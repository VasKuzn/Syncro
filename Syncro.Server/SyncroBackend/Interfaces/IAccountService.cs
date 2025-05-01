namespace SyncroBackend.Interfaces
{
    public interface IAccountService
    {
        public Task<List<AccountModel>> GetAllAccountsAsync();
        public Task<AccountModel> GetAccountByIdAsync(Guid accountId);
        public Task<AccountModel> CreateAccountAsync(AccountModel account);
        public Task<bool> DeleteAccountAsync(Guid accountId);
        public Task<AccountModel> UpdateAccountAsync(Guid accountId, AccountModelDto accountDto);
    }
}