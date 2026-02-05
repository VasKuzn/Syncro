namespace Syncro.Domain.Models
{
    public class PasswordResetTokenModel
    {
        public required Guid Id { get; set; }
        public required string Email { get; set; }
        public required string Token { get; set; }
        public required DateTime CreatedAt { get; set; }
        public required DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; }
    }
}
