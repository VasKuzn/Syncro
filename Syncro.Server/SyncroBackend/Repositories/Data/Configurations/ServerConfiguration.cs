namespace SyncroBackend.Repositories.Data.Configurations
{
    public class ServerConfiguration : IEntityTypeConfiguration<ServerModel>
    {
        public void Configure(EntityTypeBuilder<ServerModel> builder)
        {
            builder.ToTable("Servers");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.ownerId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.serverName).IsRequired().HasMaxLength(100);
            builder.Property(x => x.serverDescription).IsRequired(false).HasMaxLength(1000);
            builder.Property(x => x.creationDate).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.HasOne<AccountModel>()
                .WithMany()
                .HasForeignKey(x => x.ownerId)
                .OnDelete(DeleteBehavior.Restrict);

        }
    }
}