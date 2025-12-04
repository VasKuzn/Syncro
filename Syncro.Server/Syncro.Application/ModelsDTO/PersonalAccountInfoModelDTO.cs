namespace Syncro.Application.ModelsDTO
{
    public class PersonalAccountInfoModelDTO
    {
        public DateTime dateOfAccountCreation { get; set; }
        public DateTime dateOfLastOnline { get; set; }
        public int? country { get; set; }
    }
}