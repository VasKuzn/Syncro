using System.ComponentModel.DataAnnotations;

namespace Syncro.Application.ModelsDTO
{
    public class ResetPasswordRequest
    {
        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [Compare("Password", ErrorMessage = "Password should be identical")]
        public string PasswordConfirm { get; set; }
    }
}