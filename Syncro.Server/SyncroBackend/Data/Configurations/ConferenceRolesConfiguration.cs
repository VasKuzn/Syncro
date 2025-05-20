
namespace SyncroBackend.Data.Configurations
{
    public class ConferenceRolesConfiguration : IEntityTypeConfiguration<ConferenceRolesModel>
    {
        public void Configure(EntityTypeBuilder<ConferenceRolesModel> builder)
        {
            builder.ToTable("ConferenceRoles");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");

            builder.Property(x => x.conferenceId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.rolePermissions).IsRequired().HasColumnType("bigint").HasConversion(v => (long)v, v => (Permissions)v);

            builder.HasOne<GroupConferenceModel>()
                .WithMany()
                .HasForeignKey(x => x.conferenceId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}