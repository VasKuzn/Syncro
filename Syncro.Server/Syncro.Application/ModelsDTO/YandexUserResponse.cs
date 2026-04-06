using System.Text.Json.Serialization;

namespace Syncro.Application.ModelsDTO
{
    public class YandexUserResponse
    {
        [JsonPropertyName("login")]
        public string? Login { get; set; }

        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("client_id")]
        public string? ClientId { get; set; }

        [JsonPropertyName("default_email")]
        public string? DefaultEmail { get; set; }

        [JsonPropertyName("emails")]
        public List<string>? Emails { get; set; }

        [JsonPropertyName("first_name")]
        public string? FirstName { get; set; }

        [JsonPropertyName("last_name")]
        public string? LastName { get; set; }

        [JsonPropertyName("display_name")]
        public string? DisplayName { get; set; }

        [JsonPropertyName("real_name")]
        public string? RealName { get; set; }

        [JsonPropertyName("default_phone")]
        public YandexPhoneInfo? DefaultPhone { get; set; }

        [JsonPropertyName("psuid")]
        public string? Psuid { get; set; }
    }

    public class YandexPhoneInfo
    {
        [JsonPropertyName("number")]
        public string? Number { get; set; }
    }
}
