namespace Syncro.Infrastructure.Data.Configurations
{
    public class ServerMemberConfiguration : IEntityTypeConfiguration<ServerMemberModel>
    {
        public void Configure(EntityTypeBuilder<ServerMemberModel> builder)
        {
            builder.ToTable("ServerMembers");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.serverId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.accountId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.joiningDate).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(x => x.serverNickname).HasMaxLength(100);
            builder.Property(x => x.isBanned).IsRequired().HasDefaultValue(false);
            builder.Property(x => x.banReason).IsRequired(false).HasMaxLength(1000);

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