using Microsoft.AspNetCore.Http;

namespace Syncro.Application.TransferModels
{
    public class AccountNoPasswordWithIdModel
    {
        public required Guid id { get; set; }
        public required string nickname { get; set; }
        public string? email { get; set; }
        public string? firstname { get; set; }
        public string? lastname { get; set; }
        public string? phonenumber { get; set; }
        public string? avatar { get; set; }

        public IFormFile? AvatarFile { get; set; } // Поле для возможного файла

    }
}