using Syncro.Application.JWT;
using Syncro.Domain.Utils;
using Syncro.Application.SelectelStorage;
using Microsoft.Extensions.Configuration;
using Syncro.Infrastructure.Exceptions;

namespace Syncro.Infrastructure.Services
{
    public class AccountService : IAccountService
    {
        private readonly IAccountRepository _accountRepository;
        private readonly IJwtProvider _jwtProvider;
        private readonly ISelectelStorageService _selectelStorageService;
        private readonly string? _cdnUrl;

        public AccountService(IAccountRepository accountRepository, IJwtProvider jwtProvider, ISelectelStorageService selectelStorageService, IConfiguration configuration)
        {
            _accountRepository = accountRepository;
            _jwtProvider = jwtProvider;
            _selectelStorageService = selectelStorageService;
            _cdnUrl = configuration["S3Storage:CdnUrl"];
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
        public async Task<AccountModel> GetAccountByNicknameAsync(string nickname)
        {
            return await _accountRepository.GetAccountByNicknameAsync(nickname);
        }
        public async Task<AccountModel> CreateAccountAsync(AccountModel account)
        {
            if (account == null)
                throw new ArgumentNullException(nameof(account), "Account cannot be null");

            if (string.IsNullOrWhiteSpace(account.nickname))
                throw new ArgumentException("Nickname is required", nameof(account.nickname));

            if (string.IsNullOrWhiteSpace(account.email))
                throw new ArgumentException("Email is required", nameof(account.email));

            if (string.IsNullOrWhiteSpace(account.phonenumber))
                throw new ArgumentException("Phone number is required", nameof(account.phonenumber));

            if (await _accountRepository.AccountExistsByNicknameAsync(account.nickname))
                throw new ConflictException($"Nickname '{account.nickname}' already exists.");

            if (await _accountRepository.AccountExistsByEmailAsync(account.email))
                throw new ConflictException($"Email '{account.email}' already exists.");

            if (await _accountRepository.AccountExistsByPhoneAsync(account.phonenumber))
                throw new ConflictException($"Phone number '{account.phonenumber}' already exists.");

            return await _accountRepository.AddAccountAsync(account);
        }

        public async Task<bool> DeleteAccountAsync(Guid accountId)
        {
            return await _accountRepository.DeleteAccountAsync(accountId);
        }

        public async Task<AccountModel> UpdateAccountAsync(Guid accountId, AccountModelDTO accountDto)
        {
            var existingAccount = await _accountRepository.GetAccountByIdAsync(accountId);

            existingAccount.nickname = accountDto.nickname;
            existingAccount.password = accountDto.password;
            existingAccount.email = accountDto.email;
            existingAccount.phonenumber = accountDto.phonenumber;
            existingAccount.firstname = accountDto.firstname;
            existingAccount.lastname = accountDto.lastname;

            if (accountDto.AvatarFile != null && accountDto.AvatarFile.Length > 0)
            {
                var result = await _selectelStorageService.UploadAvatarFileAsync(accountDto.AvatarFile, accountId);
                existingAccount.avatar = result.FileUrl;
            }
            else if (!string.IsNullOrEmpty(accountDto.avatar))
            {
                existingAccount.avatar = accountDto.avatar;
            }

            return await _accountRepository.UpdateAccountAsync(existingAccount);
        }

        public async Task<string> GetAccountAvatarUrlAsync(Guid accountId)
        {
            var account = await _accountRepository.GetAccountByIdAsync(accountId);
            if (string.IsNullOrEmpty(account.avatar))
            {
                throw new FileNotFoundException("Avatar not found for account");
            }

            var key = account.avatar.Replace($"{_cdnUrl}/", "");
            return await _selectelStorageService.GetTemporaryFileUrlAsync(key);
        }

        public async Task<AccountModel> DeleteAccountAvatarAsync(Guid accountId)
        {
            var existingAccount = await _accountRepository.GetAccountByIdAsync(accountId);
            if (existingAccount == null)
            {
                throw new KeyNotFoundException($"Account with id {accountId} not found");
            }

            if (!string.IsNullOrEmpty(existingAccount.avatar))
            {
                var key = existingAccount.avatar.Replace($"{_cdnUrl}/", "");
                await _selectelStorageService.DeleteAvatarFileAsync(key, accountId);
            }

            existingAccount.avatar = null;

            return await _accountRepository.UpdateAccountAsync(existingAccount);
        }
        public async Task<AccountModel> UpdateOnlineAccountAsync(Guid accountId)
        {
            var existingAccount = await _accountRepository.GetAccountByIdAsync(accountId);
            //existingAccount.isOnline = !existingAccount.isOnline; 
            // todo: нормальное отслеживание статуса в сети
            return await _accountRepository.UpdateAccountAsync(existingAccount);
        }

        public bool VerifyPassword(string password, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.EnhancedVerify(password, hashedPassword);
        }

        public async Task<Result<string>> Login(string email, string password)
        {
            var user = await _accountRepository.GetAccountByEmailAsync(email);
            if (user == null)
            {
                return Result<string>.Failure("User not found");
            }
            if (!VerifyPassword(password, user.password))
            {
                return Result<string>.Failure("Invalid password");
            }
            var token = _jwtProvider.GenerateToken(user);
            return Result<string>.Success(token);
        }

        public async Task<AccountModel> ResetPassword(Guid accountId, string password)
        {
            var existingAccount = await _accountRepository.GetAccountByIdAsync(accountId);
            
            existingAccount.password = password;

            return await _accountRepository.UpdateAccountAsync(existingAccount);
        }

        
         public async Task<Result<bool>> Logout(Guid accountId)
        {
            try
            {
                await Task.CompletedTask;
                return Result<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return Result<bool>.Failure($"Logout failed: {ex.Message}");
            }
        }
    }
}