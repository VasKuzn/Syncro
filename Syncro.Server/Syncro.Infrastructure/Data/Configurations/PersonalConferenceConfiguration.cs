namespace Syncro.Infrastructure.Data.Configurations
{
    public class PersonalConferenceConfiguration : IEntityTypeConfiguration<PersonalConferenceModel>
    {
        public void Configure(EntityTypeBuilder<PersonalConferenceModel> builder)
        {
            builder.ToTable("PersonalConferences");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.user1).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.user2).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.isFriend).IsRequired().HasDefaultValue(false);
            builder.Property(x => x.startingDate).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(x => x.lastActivity).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");


            builder.HasOne<AccountModel>()
                .WithMany()
                .HasForeignKey(x => x.user1)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<AccountModel>()
                .WithMany()
                .HasForeignKey(x => x.user2)
                .OnDelete(DeleteBehavior.Restrict);

        }
    }
}