namespace SyncroBackend.Infrastructure.Services
{
    public class SectorPermissionsService : ISectorPermissionsService
    {
        private readonly ISectorPermissionsRepository _permissionsRepo;
        private readonly IServerMemberRepository _memberRepo;
        private readonly ISectorRepository _sectorRepo;
        private readonly IRolesRepository _rolesRepo;

        public SectorPermissionsService(
            ISectorPermissionsRepository permissionsRepo,
            IServerMemberRepository memberRepo,
            ISectorRepository sectorRepo,
            IRolesRepository rolesRepo)
        {
            _permissionsRepo = permissionsRepo;
            _memberRepo = memberRepo;
            _sectorRepo = sectorRepo;
            _rolesRepo = rolesRepo;
        }

        public async Task<SectorPermissionsModel> GrantPermissionAsync(SectorPermissionsModel permission)
        {
            if (!await _memberRepo.MemberExistsInServerAsync(permission.serverId, permission.accountId))
                throw new ArgumentException("Account is not a member of this server");

            if (!await _sectorRepo.ServerExistsAsync(permission.serverId))
                throw new ArgumentException("Server doesn't exist");

            if (!await _rolesRepo.RoleExistsInServerAsync(permission.serverId, permission.roleId))
                throw new ArgumentException("Role doesn't exist in this server");

            if (await _permissionsRepo.ExistsAsync(permission.sectorId, permission.roleId, permission.accountId))
                throw new ArgumentException("Permission already granted");

            return await _permissionsRepo.AddAsync(permission);
        }

        public async Task<List<Permissions>> GetPermissionsAsync(Guid accountId, Guid sectorId)
        {
            return await _permissionsRepo.GetAccountPermissionsAsync(accountId, sectorId);
        }

        public async Task<bool> HasPermissionAsync(Guid accountId, Guid sectorId, Permissions permission)
        {
            return await _permissionsRepo.AccountHasPermissionAsync(accountId, sectorId, permission);
        }

        public async Task<bool> RevokePermissionAsync(Guid permissionId)
        {
            return await _permissionsRepo.DeleteAsync(permissionId);
        }

        public async Task<List<SectorPermissionsModel>> GetAccountPermissionsAsync(Guid accountId)
        {
            return await _permissionsRepo.GetByAccountIdAsync(accountId);
        }

        public async Task<List<SectorPermissionsModel>> GetSectorPermissionsAsync(Guid sectorId)
        {
            return await _permissionsRepo.GetBySectorIdAsync(sectorId);
        }
    }
}