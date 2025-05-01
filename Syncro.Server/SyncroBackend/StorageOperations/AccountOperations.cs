using SyncroBackend.Data.DataBaseContext;

namespace SyncroBackend.StorageOperations
{
    public class AccountOperations
    {
        private readonly DataBaseContext context;
        public AccountOperations(DataBaseContext dbcontext)
        {
            this.context = dbcontext;
        }

        public Task<List<AccountModel>> GetAll()
        {
            return context.accounts.ToListAsync();
        }

        public async Task<AccountModel> AddAccountAsync(AccountModel account)
        {
            if (await context.accounts.AnyAsync(a => a.nickname == account.nickname))
                throw new ArgumentException("Nickname already exists.");
            if (await context.accounts.AnyAsync(a => a.email == account.email))
                throw new ArgumentException("Email already exists.");

            await context.accounts.AddAsync(account);
            await context.SaveChangesAsync();
            return account;
        }
        public async Task<bool> DeleteAccountAsync(Guid accountId)
        {
            var deleted = await context.accounts
            .Where(a => a.Id == accountId)
            .ExecuteDeleteAsync();
            return deleted > 0;
        }
        public async Task<AccountModel> EditAccountAsync(Guid accountId, [FromBody] AccountModelDto AccountDto)
        {
            var editedAccount = await context.accounts.FirstOrDefaultAsync(a => a.Id == accountId);
            if (editedAccount == null)
            {
                throw new KeyNotFoundException($"Account for editing is not found");
            }
            editedAccount.nickname = AccountDto.nickname;
            editedAccount.password = BCrypt.Net.BCrypt.HashPassword(AccountDto.password);
            editedAccount.email = AccountDto.email;
            editedAccount.phonenumber = AccountDto.phonenumber;
            editedAccount.firstname = AccountDto.firstname;
            editedAccount.lastname = AccountDto.lastname;

            await context.SaveChangesAsync();

            return editedAccount;
        }

    }
}