namespace SyncroBackend.Data.Configurations
{
    public class GroupConferenceMemberConfiguration : IEntityTypeConfiguration<GroupConferenceMemberModel>
    {
        public void Configure(EntityTypeBuilder<GroupConferenceMemberModel> builder)
        {
            builder.ToTable("GroupConferenceMembers");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.accountId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.groupConferenceId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.joiningDate).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(x => x.groupConferenceNickname).HasMaxLength(100).IsRequired(false);

            builder.HasOne<AccountModel>()
                .WithMany()
                .HasForeignKey(x => x.accountId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<GroupConferenceModel>()
                .WithMany()
                .HasForeignKey(x => x.groupConferenceId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<ConferenceRolesModel>()
                .WithMany()
                .HasForeignKey(x => x.roleId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}