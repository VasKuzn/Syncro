namespace SyncroBackend.Infrastructure.Services.AdditionalFunctions
{
    public interface ISelectelStorageService
    {
        Task<FileUploadResult> UploadMessageFileAsync(IFormFile file, Guid messageId, Guid? accountId, Guid? personalConferenceId);
        Task<string> GetTemporaryFileUrlAsync(string keyName);
        Task DeleteMessageFilesAsync(Guid messageId, Guid personalConferenceId, Guid accountId);
        Task<FileDownloadResult> DownloadFileAsync(string keyName);
    }
}