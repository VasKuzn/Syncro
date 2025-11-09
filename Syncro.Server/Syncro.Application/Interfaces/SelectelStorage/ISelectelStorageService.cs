using Microsoft.AspNetCore.Http;
using Syncro.Domain.Records;

namespace Syncro.Application.SelectelStorage
{
    public interface ISelectelStorageService
    {
        Task<FileUploadResult> UploadMessageFileAsync(IFormFile file, Guid messageId, Guid? accountId, Guid? personalConferenceId);
        Task<string> GetTemporaryFileUrlAsync(string keyName);
        Task DeleteMessageFilesAsync(Guid messageId, Guid personalConferenceId, Guid accountId);
        Task<FileDownloadResult> DownloadFileAsync(string keyName);
    }
}