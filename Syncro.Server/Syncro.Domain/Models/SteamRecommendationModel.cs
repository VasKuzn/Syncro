namespace Syncro.Domain.Models
{
    public class SteamRecommendationModel
    {
        public Guid AccountId { get; set; }
        public string SteamId { get; set; }
        public string FirstGame { get; set; }
        public string SecondGame { get; set; }
        public string ThirdGame { get; set; }
        public DateTime LastTimeUpdated { get; set; }
    }
}