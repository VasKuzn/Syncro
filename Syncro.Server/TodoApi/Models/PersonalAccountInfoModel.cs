namespace TodoApi.Models
{
    public class PersonalAccountInfoModel
    {
        public Guid Id { get; set; }
        public bool isHidden {get;set;}
        public DateTime dateOfAccountCreation { get; set; }
        public DateTime dateOfLastOnline {get;set;}
        public DateTime dateOfLastChange {get;set;}
    }
}