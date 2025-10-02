namespace Syncro.Infrastructure.Repositories
{
    public class GroupRolesRepository : IGroupRolesRepository
    {
        private readonly DataBaseContext _context;

        public GroupRolesRepository(DataBaseContext dbcontext)
        {
            this._context = dbcontext;
        }

        public Task<List<ConferenceRolesModel>> GetAllGroupRolesAsync()
        {
            return _context.conferenceRoles.ToListAsync();
        }

        public async Task<ConferenceRolesModel> GetGroupRoleByIdAsync(Guid conferenceRoleId)
        {
            return await _context.conferenceRoles.FirstOrDefaultAsync(x => x.Id == conferenceRoleId) ?? throw new ArgumentException("Group Role is not found");
        }

        public async Task<ConferenceRolesModel> CreateGroupRoleAsync(ConferenceRolesModel conferenceRoles)
        {
            await _context.conferenceRoles.AddAsync(conferenceRoles);
            await _context.SaveChangesAsync();
            return conferenceRoles;
        }

        public async Task<bool> DeleteGroupRoleAsync(Guid conferenceRoleId)
        {
            var deleted = await _context.conferenceRoles
                        .Where(m => m.Id == conferenceRoleId)
                        .ExecuteDeleteAsync();

            return deleted > 0;
        }

        public async Task<ConferenceRolesModel> UpdateGroupRoleAsync(ConferenceRolesModel conferenceRole)
        {
            _context.conferenceRoles.Update(conferenceRole);
            await _context.SaveChangesAsync();

            return conferenceRole;
        }
    }
}