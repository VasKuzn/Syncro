namespace SyncroBackend.Interfaces
{
    public interface IServerService
    {
        Task<List<ServerModel>> GetAllServersAsync();
        Task<ServerModel> GetServerByIdAsync(Guid serverId);
        Task<ServerModel> CreateServerAsync(ServerModel server);
        Task<bool> DeleteServerAsync(Guid serverId);
        Task<ServerModel> UpdateServerAsync(Guid serverId, ServerModelDTO serverDto);
    }
}