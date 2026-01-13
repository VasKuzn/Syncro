using Syncro.Infrastructure.Encryption.Models;

namespace Syncro.Infrastructure.Data.Configurations
{
    public class UserEncryptionKeyConfiguration : IEntityTypeConfiguration<UserEncryptionKey>
    {
        public void Configure(EntityTypeBuilder<UserEncryptionKey> builder)
        {
            builder.ToTable("UserEncryptionKeys");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id)
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid")
                .HasDefaultValueSql("gen_random_uuid()");

            builder.Property(x => x.UserId)
                .IsRequired()
                .HasColumnType("uuid");

            builder.Property(x => x.PublicKey)
                .IsRequired()
                .HasColumnType("text");

            builder.Property(x => x.SignedPreKey)
                .HasColumnType("text");

            builder.Property(x => x.OneTimePreKeys)
                .HasColumnType("text");

            builder.Property(x => x.IdentityKey)
                .HasColumnType("text");

            builder.Property(x => x.LastUpdated)
                .IsRequired()
                .HasColumnType("timestamp");

            builder.HasIndex(x => x.UserId)
                .IsUnique();
        }
    }
}