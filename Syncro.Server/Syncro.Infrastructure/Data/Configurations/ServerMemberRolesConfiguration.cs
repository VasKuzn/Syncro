namespace Syncro.Infrastructure.Data.Configurations
{
    public class ServerMemberRolesConfiguration : IEntityTypeConfiguration<ServerMemberRoles>
    {
        public void Configure(EntityTypeBuilder<ServerMemberRoles> builder)
        {
            builder.ToTable("ServerMemberRoles");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.serverId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.accountId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.roleId).IsRequired().HasColumnType("uuid");

            builder.HasOne<ServerModel>()
                .WithMany()
                .HasForeignKey(x => x.serverId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<AccountModel>()
                .WithMany()
                .HasForeignKey(x => x.accountId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<RolesModel>()
                .WithMany()
                .HasForeignKey(x => x.roleId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}