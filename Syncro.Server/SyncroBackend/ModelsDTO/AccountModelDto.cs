namespace SyncroBackend.Models
{
    public class AccountModelDto
    {
        public required string nickname { get; set; }
        public string? email { get; set; }
        public required string password { get; set; }
        public string? firstname { get; set; }
        public string? lastname { get; set; }
        public string? phonenumber { get; set; }
    }
}