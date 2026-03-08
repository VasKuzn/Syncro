namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/storage")]
    public class SelectelMessageStorageController : ControllerBase
    {
        private readonly IMediaMessageService _mediaMessageService;
        private readonly IHubContext<PersonalMessagesHub> _personalMessagesHub;
        private readonly IHubContext<GroupMessagesHub> _groupMessagesHub;

        public SelectelMessageStorageController(IMediaMessageService mediaMessageService, IHubContext<PersonalMessagesHub> personalMessagesHub, IHubContext<GroupMessagesHub> groupMessagesHub)
        {
            _mediaMessageService = mediaMessageService;
            _personalMessagesHub = personalMessagesHub;
            _groupMessagesHub = groupMessagesHub;
        }

        [ValidateAntiForgeryToken]
        [HttpPost("{conferenceId}/{accountId}/{messageId}/media")]
        public async Task<IActionResult> UploadMessageMedia(
            Guid conferenceId,
            Guid accountId,
            Guid messageId,
            IFormFile file)
        {
            try
            {
                var accountNickname = Request.Form["accountNickname"].FirstOrDefault() ?? string.Empty;
                var messageContent = Request.Form["messageContent"].FirstOrDefault() ?? string.Empty;
                var groupConferenceIdStr = Request.Form["groupConferenceId"].FirstOrDefault();

                Guid? groupConferenceId = null;
                if (!string.IsNullOrEmpty(groupConferenceIdStr) && Guid.TryParse(groupConferenceIdStr, out var parsedGroupId))
                {
                    groupConferenceId = parsedGroupId;
                }

                // Если groupConferenceId передан, то conferenceId игнорируется для personalConferenceId
                var personalConferenceId = groupConferenceId.HasValue ? Guid.Empty : conferenceId;

                var createdMessage = await _mediaMessageService.UploadMessageMediaAsync(
                    personalConferenceId, accountId, messageId, accountNickname, messageContent, file, groupConferenceId);

                // Отправляем через правильный Hub в зависимости от типа конференции
                if (createdMessage.personalConferenceId != null)
                {
                    await _personalMessagesHub.Clients
                        .Group($"personalconference-{createdMessage.personalConferenceId}")
                        .SendAsync("ReceivePersonalMessage", createdMessage);
                }
                else if (createdMessage.groupConferenceId != null)
                {
                    await _groupMessagesHub.Clients
                        .Group($"groupConference-{createdMessage.groupConferenceId}")
                        .SendAsync("ReceiveGroupMessage", createdMessage);
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

        [HttpGet("{conferenceId}/{accountId}/{messageId}/media")]
        public async Task<IActionResult> GetMessageMedia(
            Guid conferenceId,
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
