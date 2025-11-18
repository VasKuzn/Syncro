using Microsoft.AspNetCore.Http;
using Syncro.Domain.Records;

namespace Syncro.Application.SelectelStorage
{
    public interface ISelectelStorageService
    {
        Task<FileUploadResult> UploadMessageFileAsync(IFormFile file, Guid messageId, Guid? accountId, Guid? personalConferenceId);
        Task<FileUploadResult> UploadAvatarFileAsync(IFormFile file, Guid? accountId);
        Task<string> GetTemporaryFileUrlAsync(string keyName);
        Task DeleteMessageFileAsync(Guid messageId, Guid personalConferenceId, Guid accountId);
        Task<FileDownloadResult> DownloadFileAsync(string keyName);
        Task DeleteAvatarFileAsync(string key, Guid accountId);
    }
}