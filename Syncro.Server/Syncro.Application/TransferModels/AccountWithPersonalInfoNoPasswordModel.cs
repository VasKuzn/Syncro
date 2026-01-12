using Microsoft.AspNetCore.Http;

namespace Syncro.Application.TransferModels
{
    public class AccountWithPersonalInfoNoPasswordModel
    {
        public required string nickname { get; set; }
        public string? email { get; set; }
        public string? firstname { get; set; }
        public string? lastname { get; set; }
        public string? phonenumber { get; set; }
        public string? avatar { get; set; }
        public int? country { get; set; }

        public IFormFile? AvatarFile { get; set; } // Для нового файла
    }
}