namespace SyncroBackend.Repositories.Data.Configurations
{
    public class GroupConferenceConfiguration : IEntityTypeConfiguration<GroupConferenceModel>
    {
        public void Configure(EntityTypeBuilder<GroupConferenceModel> builder)
        {
            builder.ToTable("GroupConferences");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");
            builder.Property(x => x.conferenceName).IsRequired().HasMaxLength(100);
            builder.Property(x => x.groupConferenceType).IsRequired().HasMaxLength(100).HasConversion<string>(); ;

        }
    }
}
