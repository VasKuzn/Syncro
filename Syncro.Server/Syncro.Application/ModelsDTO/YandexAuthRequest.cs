using System.ComponentModel.DataAnnotations;

namespace Syncro.Application.ModelsDTO
{
    public class YandexAuthRequest
    {
        [Required(ErrorMessage = "Token is required")]
        public required string Token { get; set; }
    }
}
