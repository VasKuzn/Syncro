namespace Syncro.Domain.Models
{
    public class PersonalAccountInfoModel
    {
        public Guid Id { get; set; }
        public DateTime dateOfAccountCreation { get; set; }
        public DateTime dateOfLastOnline { get; set; }
        public int? country { get; set; }
    }
}