using Microsoft.AspNetCore.Http;

namespace Syncro.Application.Services
{
    public interface IMediaMessageService
    {
        Task<MessageModel> UploadMessageMediaAsync(Guid personalConferenceId, Guid accountId, Guid messageId, IFormFile file);
        Task<string> GetMessageMediaUrlAsync(Guid messageId);
    }
}
