using System.ComponentModel.DataAnnotations;

namespace Syncro.Application.ModelsDTO
{
    public class PasswordResetRequest
    {
        [EmailAddress]
        public required string Email { get; set; }
    }

    public class ValidateResetTokenRequest
    {
        public required string Token { get; set; }
    }

    public class ResetPasswordRequest
    {
        public required string Token { get; set; }

        [MinLength(8)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")]
        public required string NewPassword { get; set; }

        [Compare("NewPassword")]
        public required string ConfirmPassword { get; set; }
    }
}