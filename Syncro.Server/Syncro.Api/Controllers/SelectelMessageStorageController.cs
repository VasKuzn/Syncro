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
                var accountNickname = Request.Form["accountNickname"].FirstOrDefault() ?? string.Empty;
                var createdMessage = await _mediaMessageService.UploadMessageMediaAsync(
                    personalConferenceId, accountId, messageId, accountNickname, file);

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
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while uploading media");
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
            catch (FileNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving media");
            }
        }
    }
}
