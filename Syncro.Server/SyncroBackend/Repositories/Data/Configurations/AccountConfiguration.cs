namespace SyncroBackend.Repositories.Data.Configurations
{
    public class AccountConfiguration : IEntityTypeConfiguration<AccountModel>
    {
        public void Configure(EntityTypeBuilder<AccountModel> builder)
        {
            builder.ToTable("Accounts");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.nickname).IsRequired().HasMaxLength(100);
            builder.Property(x => x.email).HasMaxLength(250).IsRequired(false);
            builder.Property(x => x.password).IsRequired().HasMaxLength(200).HasConversion(p => BCrypt.Net.BCrypt.EnhancedHashPassword(p), p => p);
            builder.Property(x => x.firstname).IsRequired(false);
            builder.Property(x => x.lastname).IsRequired(false);
            builder.Property(x => x.phonenumber).HasMaxLength(20);
            builder.Property(x => x.isOnline).IsRequired(true);
        }
    }
}