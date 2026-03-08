using Microsoft.AspNetCore.Http;

namespace Syncro.Application.Services
{
    public interface IMediaMessageService
    {
        Task<MessageModel> UploadMessageMediaAsync(Guid personalConferenceId, Guid accountId, Guid messageId, string accountNickname, string messageContent, IFormFile file, Guid? groupConferenceId = null);
        Task<string> GetMessageMediaUrlAsync(Guid messageId);
    }
}
