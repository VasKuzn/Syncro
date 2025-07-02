namespace SyncroBackend.Entities.ModelsDTO
{
    public class AccountModelDTO
    {
        public required string nickname { get; set; }
        public string? email { get; set; }
        public required string password { get; set; }
        public string? firstname { get; set; }
        public string? lastname { get; set; }
        public string? phonenumber { get; set; }
        public required bool isOnline { get; set; } = false;
    }
    public class LoginRequest
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; }
    }
}