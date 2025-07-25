namespace SyncroBackend.Repositories
{
    public class AccountRepository : IAccountRepository
    {
        private readonly DataBaseContext _context;

        public AccountRepository(DataBaseContext dbcontext)
        {
            _context = dbcontext;
        }

        public Task<List<AccountModel>> GetAllAccountsAsync()
        {
            return _context.accounts.ToListAsync();
        }

        public async Task<AccountModel> GetAccountByIdAsync(Guid accountId)
        {
            return await _context.accounts.FirstOrDefaultAsync(a => a.Id == accountId)
                   ?? throw new ArgumentException("Account is not found");
        }

        public async Task<AccountModel> AddAccountAsync(AccountModel account)
        {
            await _context.accounts.AddAsync(account);
            await _context.SaveChangesAsync();
            return account;
        }

        public async Task<bool> DeleteAccountAsync(Guid accountId)
        {
            var deleted = await _context.accounts
                .Where(a => a.Id == accountId)
                .ExecuteDeleteAsync();
            return deleted > 0;
        }

        public async Task<AccountModel> UpdateAccountAsync(AccountModel account)
        {
            _context.accounts.Update(account);
            await _context.SaveChangesAsync();
            return account;
        }

        public async Task<bool> AccountExistsByNicknameAsync(string nickname)
        {
            return await _context.accounts.AnyAsync(a => a.nickname == nickname);
        }

        public async Task<bool> AccountExistsByEmailAsync(string email)
        {
            try
            {
                return await _context.accounts.AnyAsync(a => a.email == email);
            }
            catch
            {
                throw new KeyNotFoundException($"Account with email {email} not found");
            }
        }
        public async Task<bool> AccountExistsByPhoneAsync(string phonenumber)
        {
            return await _context.accounts.AnyAsync(a => a.phonenumber == phonenumber);
        }

        public async Task<AccountModel> GetAccountByEmailAsync(string email)
        {
            var user = await _context.accounts.FirstOrDefaultAsync(a => a.email == email) ?? throw new ArgumentException("Account is not found");
            return user;
        }
        public async Task<AccountModel> GetAccountByNicknameAsync(string nickname)
        {
            var user = await _context.accounts.FirstOrDefaultAsync(a => a.nickname == nickname) ?? throw new ArgumentException("Account is not found");
            return user;
        }
    }
}