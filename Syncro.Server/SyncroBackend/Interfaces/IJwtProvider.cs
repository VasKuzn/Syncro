namespace SyncroBackend.Interfaces
{
    public interface IJwtProvider
    {
        public string GenerateToken(AccountModel account);
    }
}