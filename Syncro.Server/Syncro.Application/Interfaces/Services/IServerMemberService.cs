namespace Syncro.Application.Services
{
    public interface IServerMemberService
    {
        Task<List<ServerMemberModel>> GetAllMembersAsync();
        Task<List<ServerMemberModel>> GetMembersByServerIdAsync(Guid serverId);
        Task<ServerMemberModel> GetMemberByIdAsync(Guid memberId);
        Task<ServerMemberModel> CreateMemberAsync(ServerMemberModel member);
        Task<bool> DeleteMemberAsync(Guid memberId);
        Task<ServerMemberModel> UpdateMemberAsync(Guid memberId, ServerMemberDTO memberDto);
        Task<ServerMemberModel> BanMemberAsync(Guid memberId, string banReason);
        Task<ServerMemberModel> UnbanMemberAsync(Guid memberId);
    }
}