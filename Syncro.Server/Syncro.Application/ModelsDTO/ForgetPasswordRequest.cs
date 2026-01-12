using System.ComponentModel.DataAnnotations;

namespace Syncro.Application.ModelsDTO
{
    public class ForgetPasswordRequest
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; }
    }
}