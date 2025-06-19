namespace SyncroBackend.Interfaces
{
    public interface IAccountService
    {
        public Task<List<AccountModel>> GetAllAccountsAsync();
        public Task<AccountModel> GetAccountByIdAsync(Guid accountId);
        public Task<AccountModel> CreateAccountAsync(AccountModel account);
        public Task<bool> DeleteAccountAsync(Guid accountId);
        public Task<AccountModel> UpdateAccountAsync(Guid accountId, AccountModelDto accountDto);
        public Task<AccountModel> UpdateOnlineAccountAsync(Guid accountId);
        public bool VerifyPassword(string password, string hashedPassword);
        public Task<string> Login(string email, string password);
        public Task<AccountModel> GetAccountByEmailAsync(string email);
        public Task<AccountModel> GetAccountByNicknameAsync(string nickname);
    }
}