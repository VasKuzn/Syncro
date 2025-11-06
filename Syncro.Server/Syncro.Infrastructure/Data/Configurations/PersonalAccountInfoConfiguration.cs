namespace Syncro.Infrastructure.Data.Configurations
{
    public class PersonalAccountInfoConfiguration : IEntityTypeConfiguration<PersonalAccountInfoModel>
    {
        public void Configure(EntityTypeBuilder<PersonalAccountInfoModel> builder)
        {
            builder.ToTable("PersonalAccountInfo");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.isHidden).IsRequired().HasDefaultValue(false);
            builder.Property(x => x.dateOfAccountCreation).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(x => x.dateOfLastOnline).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(x => x.country).IsRequired(false);

            builder.HasOne<AccountModel>()
                .WithOne()
                .HasForeignKey<PersonalAccountInfoModel>(x => x.Id)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}