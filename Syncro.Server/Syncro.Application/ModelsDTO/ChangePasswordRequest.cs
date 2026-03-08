using System.ComponentModel.DataAnnotations;

namespace Syncro.Application.ModelsDTO
{
    public class ChangePasswordRequest
    {
        [Required(ErrorMessage = "Старый пароль обязателен")]
        public required string OldPassword { get; set; }

        [Required(ErrorMessage = "Новый пароль обязателен")]
        [MinLength(8, ErrorMessage = "Пароль должен содержать минимум 8 символов")]
        public required string NewPassword { get; set; }
    }
}
