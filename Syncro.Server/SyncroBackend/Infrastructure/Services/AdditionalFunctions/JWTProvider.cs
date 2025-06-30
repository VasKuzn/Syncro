namespace SyncroBackend.Infrastructure.Services.AdditionalFunctions
{
    public class JWTProvider : IJwtProvider
    {
        private readonly JWToptions _options;
        public JWTProvider(IOptions<JWToptions> options)
        {
            _options = options.Value;
        }
        public string GenerateToken(AccountModel account)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.NameId, account.Id.ToString())
            };

            var signingCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.secretKey)),
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                claims: claims,
                signingCredentials: signingCredentials,
                expires: DateTime.UtcNow.AddHours(_options.ExpiresHours));

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}