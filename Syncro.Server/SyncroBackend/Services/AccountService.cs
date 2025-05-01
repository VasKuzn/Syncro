namespace SyncroBackend.Services
{
    public class AccountService : IAccountService
    {
        private readonly IAccountRepository _accountRepository;

        public AccountService(IAccountRepository accountRepository)
        {
            _accountRepository = accountRepository;
        }
        public async Task<List<AccountModel>> GetAllAccountsAsync()
        {
            return await _accountRepository.GetAllAccountsAsync();
        }

        public async Task<AccountModel> GetAccountByIdAsync(Guid accountId)
        {
            return await _accountRepository.GetAccountByIdAsync(accountId);
        }
        public async Task<AccountModel> CreateAccountAsync(AccountModel account)
        {
            if (await _accountRepository.AccountExistsByNicknameAsync(account.nickname))
                throw new ArgumentException("Nickname already exists.");

            if (await _accountRepository.AccountExistsByEmailAsync(account.email))
                throw new ArgumentException("Email already exists.");

            return await _accountRepository.AddAccountAsync(account);
        }

        public async Task<bool> DeleteAccountAsync(Guid accountId)
        {
            return await _accountRepository.DeleteAccountAsync(accountId);
        }

        public async Task<AccountModel> UpdateAccountAsync(Guid accountId, AccountModelDto accountDto)
        {
            var existingAccount = await _accountRepository.GetAccountByIdAsync(accountId);

            existingAccount.nickname = accountDto.nickname;
            existingAccount.password = BCrypt.Net.BCrypt.HashPassword(accountDto.password);
            existingAccount.email = accountDto.email;
            existingAccount.phonenumber = accountDto.phonenumber;
            existingAccount.firstname = accountDto.firstname;
            existingAccount.lastname = accountDto.lastname;

            return await _accountRepository.UpdateAccountAsync(existingAccount);
        }

    }
}