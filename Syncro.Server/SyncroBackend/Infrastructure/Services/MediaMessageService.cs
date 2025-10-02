public class MediaMessageService : IMediaMessageService
{
    private readonly ISelectelStorageService _storageService;
    private readonly IMessageService _messageService;
    private readonly string? _cdnUrl;

    public MediaMessageService(ISelectelStorageService storageService, IMessageService messageService, IConfiguration configuration)
    {
        _storageService = storageService;
        _messageService = messageService;
        _cdnUrl = configuration["S3Storage:CdnUrl"];
    }

    public async Task<MessageModel> UploadMessageMediaAsync(Guid personalConferenceId, Guid accountId, Guid messageId, IFormFile file)
    {
        var result = await _storageService.UploadMessageFileAsync(file, messageId, accountId, personalConferenceId);

        var typeEnum = DetermineMediaType(result.ContentType);

        var message = new MessageModel
        {
            Id = messageId,
            messageContent = string.Empty,
            messageDateSent = DateTime.UtcNow,
            accountId = accountId,
            personalConferenceId = personalConferenceId,
            groupConferenceId = null,
            sectorId = null,
            isEdited = false,
            previousMessageContent = null,
            isPinned = false,
            isRead = false,
            referenceMessageId = null,
            MediaUrl = result.FileUrl,
            MediaType = typeEnum,
            FileName = result.FileName
        };

        return await _messageService.CreateMessageAsync(message);
    }

    public async Task<string> GetMessageMediaUrlAsync(Guid messageId)
    {
        var message = await _messageService.GetMessageByIdAsync(messageId);
        if (string.IsNullOrEmpty(message.MediaUrl))
        {
            throw new FileNotFoundException("Media not found for message");
        }

        var key = message.MediaUrl.Replace($"{_cdnUrl}/", "");
        return await _storageService.GetTemporaryFileUrlAsync(key);
    }

    private MessageType DetermineMediaType(string contentType)
    {
        var mediaType = contentType.ToLower();
        return mediaType switch
        {
            var t when t.StartsWith("image/") => MessageType.Image,
            var t when t.StartsWith("video/") => MessageType.Video,
            var t when t.StartsWith("audio/") => MessageType.Audio,
            var t when t.Contains("pdf") || t.Contains("word") || t.Contains("excel") => MessageType.Document,
            _ => MessageType.Other
        };
    }
}