namespace Syncro.Infrastructure.Data.Configurations
{
    public class SectorConfiguration : IEntityTypeConfiguration<SectorModel>
    {
        public void Configure(EntityTypeBuilder<SectorModel> builder)
        {
            builder.ToTable("Sectors");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.serverId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.sectorName).IsRequired().HasMaxLength(100);
            builder.Property(x => x.sectorDescription).IsRequired(false).HasMaxLength(1000);
            builder.Property(x => x.sectorType).IsRequired().HasMaxLength(100).HasConversion<string>(); ;
            builder.Property(x => x.isPrivate).IsRequired().HasDefaultValue(false);

            builder.HasOne<ServerModel>()
                .WithMany()
                .HasForeignKey(x => x.serverId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}