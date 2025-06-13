namespace SyncroBackend.Interfaces
{
    public interface IServerRepository
    {
        Task<List<ServerModel>> GetAllServersAsync();
        Task<ServerModel> GetServerByIdAsync(Guid serverId);
        Task<ServerModel> AddServerAsync(ServerModel server);
        Task<bool> DeleteServerAsync(Guid serverId);
        Task<ServerModel> UpdateServerAsync(ServerModel server);
        Task<bool> UserExistsAsync(Guid userId);
        Task<bool> ServerNameExistsAsync(string serverName);
    }
}