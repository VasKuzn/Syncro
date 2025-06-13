namespace SyncroBackend.Services
{
    public class ServerService : IServerService
    {
        private readonly IServerRepository _serverRepository;

        public ServerService(IServerRepository serverRepository)
        {
            _serverRepository = serverRepository;
        }

        public async Task<List<ServerModel>> GetAllServersAsync()
        {
            return await _serverRepository.GetAllServersAsync();
        }

        public async Task<ServerModel> GetServerByIdAsync(Guid serverId)
        {
            return await _serverRepository.GetServerByIdAsync(serverId);
        }

        public async Task<ServerModel> CreateServerAsync(ServerModel server)
        {
            if (!await _serverRepository.UserExistsAsync(server.ownerId))
                throw new ArgumentException("Owner user doesn't exist");

            if (await _serverRepository.ServerNameExistsAsync(server.serverName))
                throw new ArgumentException("Server name already exists");

            return await _serverRepository.AddServerAsync(server);
        }

        public async Task<bool> DeleteServerAsync(Guid serverId)
        {
            return await _serverRepository.DeleteServerAsync(serverId);
        }

        public async Task<ServerModel> UpdateServerAsync(Guid serverId, ServerModelDTO serverDto)
        {
            var existingServer = await _serverRepository.GetServerByIdAsync(serverId);

            existingServer.serverName = serverDto.serverName;
            existingServer.serverDescription = serverDto.serverDescription;

            return await _serverRepository.UpdateServerAsync(existingServer);
        }
    }
}