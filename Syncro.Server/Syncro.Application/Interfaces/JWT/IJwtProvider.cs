namespace Syncro.Application.JWT
{
    public interface IJwtProvider
    {
        public string GenerateToken(AccountModel account);
    }
}