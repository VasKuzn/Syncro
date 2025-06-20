namespace SyncroBackend.Controllers
{
    [ApiController]
    [Route("api/groupconference")]
    public class GroupConferenceController : ControllerBase
    {
        private readonly IGroupConferenceService<GroupConferenceModel> _groupConferenceService;

        public GroupConferenceController(IGroupConferenceService<GroupConferenceModel> groupConferenceService)
        {
            _groupConferenceService = groupConferenceService;
        }

        // GET /api/groupconference
        [HttpGet]
        //[Authorize]
        public async Task<ActionResult<IEnumerable<GroupConferenceModel>>> GetAllGroupConferences()
        {
            try
            {
                var groupConferences = await _groupConferenceService.GetAllConferencesAsync();
                return Ok(groupConferences);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        [HttpGet("{id}/getbyaccount")]
        //[Authorize]
        public async Task<ActionResult<IEnumerable<GroupConferenceModel>>> GetAllGroupConferencesByAccount(Guid id)
        {
            try
            {
                var groupConferences = await _groupConferenceService.GetAllConferencesByAccountAsync(id);
                return Ok(groupConferences);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET /api/groupconference/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<GroupConferenceModel>> GetGroupConferenceById(Guid id)
        {
            try
            {
                var groupConference = await _groupConferenceService.GetConferenceByIdAsync(id);
                return Ok(groupConference);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // POST: api/groupconference
        [HttpPost]
        //[Authorize]
        public async Task<ActionResult<GroupConferenceModel>> CreateGroupConference(
            [FromBody] GroupConferenceModel conference)
        {
            try
            {
                var result = await _groupConferenceService.CreateConferenceAsync(conference);
                return CreatedAtAction(nameof(GetGroupConferenceById), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // PUT: api/groupconference/{id}
        [HttpPut("{id}")]
        //[Authorize]
        public async Task<ActionResult<GroupConferenceModel>> UpdateGroupConference(
            Guid id, [FromBody] string conferenceNickname)
        {
            try
            {
                var result = await _groupConferenceService.UpdateConferenceAsync(id, conferenceNickname);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // DELETE: api/groupconference/{id}
        [HttpDelete("{id}")]
        //[Authorize]
        public async Task<IActionResult> DeleteGroupConference(Guid id)
        {
            try
            {
                var result = await _groupConferenceService.DeleteConferenceAsync(id);
                if (!result)
                {
                    return NotFound($"Group conference with id {id} not found");
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