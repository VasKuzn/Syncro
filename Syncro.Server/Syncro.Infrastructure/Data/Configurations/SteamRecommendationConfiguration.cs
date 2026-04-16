namespace Syncro.Infrastructure.Data.Configurations
{
    public class SteamRecommendationConfiguration : IEntityTypeConfiguration<SteamRecommendationModel>
    {
        public void Configure(EntityTypeBuilder<SteamRecommendationModel> builder)
        {
            builder.ToTable("SteamRecommendations");
            builder.HasKey(x => x.AccountId);

            builder.Property(x => x.SteamId).IsRequired(true);
            builder.Property(x => x.AccountId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.FirstGame).IsRequired(false);
            builder.Property(x => x.SecondGame).IsRequired(false);
            builder.Property(x => x.ThirdGame).IsRequired(false);
            builder.Property(x => x.LastTimeUpdated).IsRequired(true);

            builder.HasOne<AccountModel>()
                .WithOne()
                .HasForeignKey<SteamRecommendationModel>(x => x.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}