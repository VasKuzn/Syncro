using System.Reflection;

namespace Syncro.Infrastructure.Data.DataBaseContext
{
    public class DataBaseContext : DbContext
    {
        public DbSet<AccountModel> accounts { get; set; }
        public DbSet<FriendsModel> friends { get; set; }
        public DbSet<GroupConferenceModel> groupConferences { get; set; }
        public DbSet<GroupConferenceMemberModel> groupConferenceMembers { get; set; }
        public DbSet<MessageModel> messages { get; set; }
        public DbSet<PersonalAccountInfoModel> personalAccountInfo { get; set; }
        public DbSet<PersonalConferenceModel> personalConferences { get; set; }
        public DbSet<RolesModel> roles { get; set; }
        public DbSet<SectorModel> sectors { get; set; }
        public DbSet<SectorPermissionsModel> sectorPermissions { get; set; }
        public DbSet<ServerModel> servers { get; set; }
        public DbSet<ServerMemberRoles> serverMemberRoles { get; set; }
        public DbSet<ServerMemberModel> serverMembers { get; set; }
        public DbSet<ConferenceRolesModel> conferenceRoles { get; set; }

        public DataBaseContext(DbContextOptions options) : base(options)
        {

        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        }
    }
}