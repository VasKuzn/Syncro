namespace SyncroBackend.Repositories.Data.Configurations
{
    public class RolesConfiguration : IEntityTypeConfiguration<RolesModel>
    {
        public void Configure(EntityTypeBuilder<RolesModel> builder)
        {

            builder.ToTable("Roles");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.serverId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.roleName).IsRequired().HasMaxLength(100);
            builder.Property(x => x.rolePermissions).IsRequired().HasColumnType("bigint").HasConversion(v => (long)v, v => (Permissions)v);
            builder.Property(x => x.color).IsRequired().HasMaxLength(100);
            builder.Property(x => x.isDisplayedSeparetely).IsRequired().HasDefaultValue(false);
            builder.Property(x => x.position).IsRequired().HasDefaultValue(0);

            builder.HasOne<ServerModel>()
                .WithMany()
                .HasForeignKey(x => x.serverId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}