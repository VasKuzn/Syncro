namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/storage")]
    public class SelectelMessageStorageController : ControllerBase
    {
        private readonly IMediaMessageService _mediaMessageService;
        private readonly IHubContext<PersonalMessagesHub> _messagesHub;

        public SelectelMessageStorageController(IMediaMessageService mediaMessageService, IHubContext<PersonalMessagesHub> messagesHub)
        {
            _mediaMessageService = mediaMessageService;
            _messagesHub = messagesHub;
        }

        [HttpPost("{personalConferenceId}/{accountId}/{messageId}/media")]
        public async Task<IActionResult> UploadMessageMedia(
            Guid personalConferenceId,
            Guid accountId,
            Guid messageId,
            IFormFile file)
        {
            try
            {
                var createdMessage = await _mediaMessageService.UploadMessageMediaAsync(
                    personalConferenceId, accountId, messageId, file);

                if (createdMessage.personalConferenceId != null)
                {
                    await _messagesHub.Clients
                        .Group($"personalconference-{createdMessage.personalConferenceId}")
                        .SendAsync("ReceivePersonalMessage", createdMessage);
                }

                return Ok(createdMessage);
            }
            catch (ArgumentException ex)
            {
                return StatusCode(400, $"Bad request error: {ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{personalConferenceId}/{accountId}/{messageId}/media")]
        public async Task<IActionResult> GetMessageMedia(
            Guid personalConferenceId,
            Guid accountId,
            Guid messageId)
        {
            try
            {
                var url = await _mediaMessageService.GetMessageMediaUrlAsync(messageId);
                return Redirect(url);
            }
            catch (FileNotFoundException ex)
            {
                return StatusCode(404, $"Media not found error: {ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
