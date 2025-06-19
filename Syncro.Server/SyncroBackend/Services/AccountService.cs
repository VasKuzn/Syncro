namespace SyncroBackend.Services
{
    public class AccountService : IAccountService
    {
        private readonly IAccountRepository _accountRepository;
        private readonly IJwtProvider _jwtProvider;
        private readonly ILogger _logger;

        public AccountService(IAccountRepository accountRepository, IJwtProvider jwtProvider)
        {
            _accountRepository = accountRepository;
            _jwtProvider = jwtProvider;
        }
        public async Task<List<AccountModel>> GetAllAccountsAsync()
        {
            return await _accountRepository.GetAllAccountsAsync();
        }

        public async Task<AccountModel> GetAccountByIdAsync(Guid accountId)
        {
            return await _accountRepository.GetAccountByIdAsync(accountId);
        }
        public async Task<AccountModel> GetAccountByEmailAsync(string email)
        {
            return await _accountRepository.GetAccountByEmailAsync(email);
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
            existingAccount.password = accountDto.password;
            existingAccount.email = accountDto.email;
            existingAccount.phonenumber = accountDto.phonenumber;
            existingAccount.firstname = accountDto.firstname;
            existingAccount.lastname = accountDto.lastname;

            return await _accountRepository.UpdateAccountAsync(existingAccount);
        }
        public async Task<AccountModel> UpdateOnlineAccountAsync(Guid accountId)
        {
            var existingAccount = await _accountRepository.GetAccountByIdAsync(accountId);
            existingAccount.isOnline = !existingAccount.isOnline;
            return await _accountRepository.UpdateAccountAsync(existingAccount);
        }

        public bool VerifyPassword(string password, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.EnhancedVerify(password, hashedPassword);
        }

        public async Task<string> Login(string email, string password)
        {
            var user = await _accountRepository.GetAccountByEmailAsync(email);
            var result = VerifyPassword(password, user.password);
            if (!result)
            {
                throw new Exception("Failed to login");
            }
            var token = _jwtProvider.GenerateToken(user);
            return token;

        }
    }
}