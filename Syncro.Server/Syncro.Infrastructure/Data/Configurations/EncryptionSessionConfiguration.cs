using Syncro.Infrastructure.Encryption.Models;

namespace Syncro.Infrastructure.Data.Configurations
{
    public class EncryptionSessionConfiguration : IEntityTypeConfiguration<EncryptionSession>
    {
        public void Configure(EntityTypeBuilder<EncryptionSession> builder)
        {
            builder.ToTable("EncryptionSessions");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id)
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid")
                .HasDefaultValueSql("gen_random_uuid()");

            builder.Property(x => x.UserId)
                .IsRequired()
                .HasColumnType("uuid");

            builder.Property(x => x.ContactId)
                .IsRequired()
                .HasColumnType("uuid");

            builder.Property(x => x.SessionData)
                .IsRequired()
                .HasColumnType("text");

            builder.Property(x => x.CreatedAt)
                .IsRequired()
                .HasColumnType("timestamp");

            builder.Property(x => x.LastUsed)
                .HasColumnType("timestamp");

            builder.HasIndex(x => new { x.UserId, x.ContactId })
                .IsUnique();
        }
    }
}