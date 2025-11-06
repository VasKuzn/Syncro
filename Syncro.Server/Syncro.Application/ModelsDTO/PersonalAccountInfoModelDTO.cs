
namespace Syncro.Application.ModelsDTO
{
    public class PersonalAccountInfoModelDTO
    {
        public bool isHidden { get; set; }
        public DateTime dateOfAccountCreation { get; set; }
        public DateTime dateOfLastOnline { get; set; }
        public int? country { get; set; }
    }
}