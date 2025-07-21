[ApiController]
[Route("api/storage")]
public class StorageController : ControllerBase
{
    private readonly ISelectelStorageService _storageService;
    private readonly IMessageService _messageService;
    private readonly IHubContext<PersonalMessagesHub> _messagesHub;
    private readonly string? _cdnUrl;

    public StorageController(ISelectelStorageService storageService, IMessageService messageService, IHubContext<PersonalMessagesHub> messagesHub, IConfiguration configuration)
    {
        _storageService = storageService;
        _messageService = messageService;
        _messagesHub = messagesHub;
        _cdnUrl = configuration["S3Storage:CdnUrl"];
    }

    [HttpPost("{personalConferenceId}/{accountId}/{messageId}/media")]
    public async Task<IActionResult> UploadMessageMedia(
        Guid personalConferenceId,
        Guid accountId,
        Guid messageId,
        [FromForm] IFormFile file)
    {
        try
        {
            var result = await _storageService.UploadMessageFileAsync(file, messageId, accountId, personalConferenceId);

            var mediaType = result.ContentType.ToLower();
            MessageType typeEnum = mediaType switch
            {
                var t when t.StartsWith("image/") => MessageType.Image,
                var t when t.StartsWith("video/") => MessageType.Video,
                var t when t.StartsWith("audio/") => MessageType.Audio,
                var t when t.Contains("pdf") || t.Contains("word") || t.Contains("excel") => MessageType.Document,
                _ => MessageType.Other
            };

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

            var created = await _messageService.CreateMessageAsync(message);
            if (created.personalConferenceId != null)
            {
                await _messagesHub.Clients.Group($"personalconference-{created.personalConferenceId}").SendAsync("ReceivePersonalMessage", created);
            }
            return Ok(created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("{personalconferenceId}/{accountId}/{messageId}/media")]
    public async Task<IActionResult> GetMessageMedia(Guid messageId)
    {
        try
        {
            var message = await _messageService.GetMessageByIdAsync(messageId);
            if (string.IsNullOrEmpty(message.MediaUrl))
            {
                return NotFound();
            }

            var key = message.MediaUrl.Replace($"{_cdnUrl}/", "");
            var url = await _storageService.GetTemporaryFileUrlAsync(key);

            return Redirect(url);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}