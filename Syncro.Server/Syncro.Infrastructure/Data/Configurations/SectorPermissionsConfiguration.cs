namespace Syncro.Infrastructure.Data.Configurations
{
    public class SectorPermissionsConfiguration : IEntityTypeConfiguration<SectorPermissionsModel>
    {
        public void Configure(EntityTypeBuilder<SectorPermissionsModel> builder)
        {
            builder.ToTable("SectorPermissions");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.roleId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.sectorId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.accountId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.serverId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.sectorPermissions).IsRequired().HasColumnType("bigint").HasConversion(v => (long)v, v => (Permissions)v);

            builder.HasOne<SectorModel>()
                .WithMany()
                .HasForeignKey(x => x.sectorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<RolesModel>()
                .WithMany()
                .HasForeignKey(x => x.roleId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.HasOne<AccountModel>()
                .WithMany()
                .HasForeignKey(x => x.accountId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.HasOne<ServerModel>()
                .WithMany()
                .HasForeignKey(x => x.serverId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}