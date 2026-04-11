using Microsoft.AspNetCore.Http;

namespace Syncro.Application.ModelsDTO
{
    public class AccountPartialUpdateDTO
    {
        public string? nickname { get; set; }
        public string? email { get; set; }
        public string? firstname { get; set; }
        public string? lastname { get; set; }
        public string? phonenumber { get; set; }
        public string? avatar { get; set; }
        public int? country { get; set; }

        public string? yandexCalendarLogin { get; set; }
        public string? yandexCalendarPassword { get; set; }

        public IFormFile? AvatarFile { get; set; }

        public bool HasAnyUpdates()
        {
            return !string.IsNullOrEmpty(nickname) ||
                   !string.IsNullOrEmpty(email) ||
                   !string.IsNullOrEmpty(firstname) ||
                   !string.IsNullOrEmpty(lastname) ||
                   !string.IsNullOrEmpty(phonenumber) ||
                   !string.IsNullOrEmpty(avatar) ||
                   country.HasValue ||
                   AvatarFile != null ||
                   !string.IsNullOrEmpty(yandexCalendarLogin) ||
                   !string.IsNullOrEmpty(yandexCalendarPassword);
        }
    }
}
