namespace Syncro.Infrastructure.Data.Configurations
{
    public class FriendConfiguration : IEntityTypeConfiguration<FriendsModel>
    {
        public void Configure(EntityTypeBuilder<FriendsModel> builder)
        {
            builder.ToTable("Friends");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.userWhoSent).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.userWhoRecieved).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.status).HasConversion(v => v.ToString(), v => (FriendsStatusEnum)Enum.Parse(typeof(FriendsStatusEnum), v));
            builder.Property(x => x.friendsSince).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");


            builder.HasIndex(x => new { x.userWhoSent, x.userWhoRecieved }).IsUnique();

            builder.HasOne<AccountModel>()
                .WithMany()
                .HasForeignKey(x => x.userWhoSent)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<AccountModel>()
                .WithMany()
                .HasForeignKey(x => x.userWhoRecieved)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
