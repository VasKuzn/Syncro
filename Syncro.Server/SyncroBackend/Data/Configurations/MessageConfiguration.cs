namespace SyncroBackend.Data.Configurations
{
    public class MessageConfiguration : IEntityTypeConfiguration<MessageModel>
    {
        public void Configure(EntityTypeBuilder<MessageModel> builder)
        {
            builder.ToTable("Messages");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).ValueGeneratedOnAdd().HasColumnType("uuid").HasDefaultValueSql("gen_random_uuid()");

            builder.Property(x => x.messageContent).IsRequired().HasMaxLength(1000);
            builder.Property(x => x.messageDateSent).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(x => x.accountId).IsRequired().HasColumnType("uuid");
            builder.Property(x => x.personalConferenceId).IsRequired(false).HasColumnType("uuid");
            builder.Property(x => x.groupConferenceId).IsRequired(false).HasColumnType("uuid");
            builder.Property(x => x.sectorId).IsRequired(false).HasColumnType("uuid");



            builder.Property(x => x.isEdited).IsRequired().HasDefaultValue(false);
            builder.Property(x => x.previousMessageContent).IsRequired(false).HasMaxLength(1000);
            builder.Property(x => x.isPinned).IsRequired().HasDefaultValue(false);
            builder.Property(x => x.isRead).IsRequired().HasDefaultValue(false);

            builder.Property(x => x.referenceMessageId).IsRequired(false).HasColumnType("uuid");

            builder.HasOne<AccountModel>()
                .WithMany()
                .HasForeignKey(x => x.accountId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<PersonalConferenceModel>()
                .WithMany()
                .HasForeignKey(x => x.personalConferenceId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<GroupConferenceModel>()
                .WithMany()
                .HasForeignKey(x => x.groupConferenceId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<SectorModel>()
                .WithMany()
                .HasForeignKey(x => x.sectorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}