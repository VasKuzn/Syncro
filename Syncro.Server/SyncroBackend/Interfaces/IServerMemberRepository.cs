namespace SyncroBackend.Interfaces
{
    public interface IServerMemberRepository
    {
        Task<List<ServerMemberModel>> GetAllMembersAsync();
        Task<List<ServerMemberModel>> GetMembersByServerIdAsync(Guid serverId);
        Task<ServerMemberModel> GetMemberByIdAsync(Guid memberId);
        Task<ServerMemberModel> AddMemberAsync(ServerMemberModel member);
        Task<bool> DeleteMemberAsync(Guid memberId);
        Task<ServerMemberModel> UpdateMemberAsync(ServerMemberModel member);
        Task<bool> MemberExistsInServerAsync(Guid serverId, Guid accountId);
        Task<bool> ServerExistsAsync(Guid serverId);
        Task<bool> AccountExistsAsync(Guid accountId);
    }
}