namespace SyncroBackend.Services.AdditionalFunctions
{
    public class JWToptions
    {
        public string secretKey { get; set; } = string.Empty;
        public int ExpiresHours { get; set; }
    }
}