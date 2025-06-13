namespace SyncroBackend.Services
{
    public class ServerMemberService : IServerMemberService
    {
        private readonly IServerMemberRepository _memberRepository;

        public ServerMemberService(IServerMemberRepository memberRepository)
        {
            _memberRepository = memberRepository;
        }

        public async Task<List<ServerMemberModel>> GetAllMembersAsync()
        {
            return await _memberRepository.GetAllMembersAsync();
        }

        public async Task<List<ServerMemberModel>> GetMembersByServerIdAsync(Guid serverId)
        {
            return await _memberRepository.GetMembersByServerIdAsync(serverId);
        }

        public async Task<ServerMemberModel> GetMemberByIdAsync(Guid memberId)
        {
            return await _memberRepository.GetMemberByIdAsync(memberId);
        }

        public async Task<ServerMemberModel> CreateMemberAsync(ServerMemberModel member)
        {
            if (!await _memberRepository.ServerExistsAsync(member.serverId))
                throw new ArgumentException("Server doesn't exist");

            if (!await _memberRepository.AccountExistsAsync(member.accountId))
                throw new ArgumentException("Account doesn't exist");

            if (await _memberRepository.MemberExistsInServerAsync(member.serverId, member.accountId))
                throw new ArgumentException("Member already exists in this server");

            return await _memberRepository.AddMemberAsync(member);
        }

        public async Task<bool> DeleteMemberAsync(Guid memberId)
        {
            return await _memberRepository.DeleteMemberAsync(memberId);
        }

        public async Task<ServerMemberModel> UpdateMemberAsync(Guid memberId, ServerMemberDto memberDto)
        {
            var existingMember = await _memberRepository.GetMemberByIdAsync(memberId);

            existingMember.serverNickname = memberDto.serverNickname;

            return await _memberRepository.UpdateMemberAsync(existingMember);
        }

        public async Task<ServerMemberModel> BanMemberAsync(Guid memberId, string banReason)
        {
            var member = await _memberRepository.GetMemberByIdAsync(memberId);
            member.isBanned = true;
            member.banReason = banReason;
            return await _memberRepository.UpdateMemberAsync(member);
        }

        public async Task<ServerMemberModel> UnbanMemberAsync(Guid memberId)
        {
            var member = await _memberRepository.GetMemberByIdAsync(memberId);
            member.isBanned = false;
            member.banReason = null;
            return await _memberRepository.UpdateMemberAsync(member);
        }
    }
}