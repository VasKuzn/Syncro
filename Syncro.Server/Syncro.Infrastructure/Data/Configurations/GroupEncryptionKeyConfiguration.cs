using Syncro.Infrastructure.Encryption.Models;

namespace Syncro.Infrastructure.Data.Configurations
{
    public class GroupEncryptionKeyConfiguration : IEntityTypeConfiguration<GroupEncryptionKey>
    {
        public void Configure(EntityTypeBuilder<GroupEncryptionKey> builder)
        {
            builder.ToTable("GroupEncryptionKeys");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id)
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid")
                .HasDefaultValueSql("gen_random_uuid()");

            builder.Property(x => x.GroupConferenceId)
                .IsRequired()
                .HasColumnType("uuid");

            builder.Property(x => x.SenderKey)
                .IsRequired()
                .HasColumnType("text");

            builder.Property(x => x.DistributionMessage)
                .IsRequired()
                .HasColumnType("text");

            builder.Property(x => x.CreatorId)
                .IsRequired()
                .HasColumnType("uuid");

            builder.Property(x => x.ChainId)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(x => x.CreatedAt)
                .IsRequired()
                .HasColumnType("timestamp");

            builder.Property(x => x.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            builder.HasIndex(x => x.GroupConferenceId);
            builder.HasIndex(x => new { x.GroupConferenceId, x.IsActive });
        }
    }
}