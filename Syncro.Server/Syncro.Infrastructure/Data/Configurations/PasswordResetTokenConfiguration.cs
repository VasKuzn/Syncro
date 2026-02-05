namespace Syncro.Infrastructure.Data.Configurations
{
    public class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetTokenModel>
    {
        public void Configure(EntityTypeBuilder<PasswordResetTokenModel> builder)
        {
            builder.ToTable("PasswordResetToken");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.Email).HasMaxLength(250).IsRequired();
            builder.Property(x => x.Token).IsRequired();
            builder.Property(x => x.CreatedAt).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(x => x.CreatedAt).IsRequired();
            builder.Property(x => x.IsUsed).IsRequired().HasDefaultValue(false);
        }
    }
}