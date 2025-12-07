namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/personalconference")]
    public class PersonalConferencesController : ControllerBase
    {
        private readonly IConferenceService<PersonalConferenceModel> _personalConferenceService;
        private readonly IHubContext<PersonalMessagesHub> _messagesHub;

        public PersonalConferencesController(IConferenceService<PersonalConferenceModel> personalConference, IHubContext<PersonalMessagesHub> messagesHub)
        {
            _personalConferenceService = personalConference;
            _messagesHub = messagesHub;
        }
        // GET /api/personalconference
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PersonalConferenceModel>>> GetAllPersonalConferences()
        {
            try
            {
                var personalConferences = await _personalConferenceService.GetAllConferencesAsync();
                return Ok(personalConferences);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // GET /api/personalconference
        [HttpGet("{id}/getbyaccount")]
        public async Task<ActionResult<IEnumerable<PersonalConferenceModel>>> GetAllPersonalConferencesByAccount(Guid id)
        {
            try
            {
                var personalConferences = await _personalConferenceService.GetAllConferencesByAccountAsync(id);
                return Ok(personalConferences);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // GET /api/personalconference/{id}
        [HttpGet("{id}")]
        //[Authorize]
        public async Task<ActionResult<PersonalConferenceModel>> GetPersonalConferenceById(Guid id)
        {
            try
            {
                var personalConference = await _personalConferenceService.GetConferenceByIdAsync(id);
                return Ok(personalConference);
            }
            catch (ArgumentException ex)
            {
                return StatusCode(404, $"Personal Conference not found error: {ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // POST: api/personalconference
        [HttpPost]
        //[Authorize]
        public async Task<ActionResult<PersonalConferenceModel>> CreatePersonalConference(
        [FromBody] PersonalConferenceModel conference)
        {
            try
            {
                var result = await _personalConferenceService.CreateConferenceAsync(conference);
                await _messagesHub.Clients.Users(conference.user1.ToString(), conference.user2.ToString()).SendAsync("PersonalConferenceCreated", result);
                return CreatedAtAction(nameof(GetPersonalConferenceById), new { id = result.Id }, result);
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
        // DELETE: api/personalconferences/{id}
        [HttpDelete("{id}")]
        //[Authorize]
        public async Task<IActionResult> DeletePersonalConference(Guid id)
        {
            try
            {
                var result = await _personalConferenceService.DeleteConferenceAsync(id);
                if (!result)
                {
                    return StatusCode(404, $"Personal Conference not found error: ID {id}");
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}