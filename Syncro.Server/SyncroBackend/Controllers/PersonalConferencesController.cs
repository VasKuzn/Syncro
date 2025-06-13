namespace SyncroBackend.Controllers
{
    [ApiController]
    [Route("api/personalconference")]
    public class PersonalConferencesController : ControllerBase
    {
        private readonly IConferenceService<PersonalConferenceModel> _personalConferenceService;

        public PersonalConferencesController(IConferenceService<PersonalConferenceModel> personalConference)
        {
            _personalConferenceService = personalConference;
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
        // GET /api/personalconference/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PersonalConferenceModel>> GetPersonalConferenceById(Guid id)
        {
            try
            {
                var personalConference = await _personalConferenceService.GetConferenceByIdAsync(id);
                return Ok(personalConference);
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
        // POST: api/personalconference
        [HttpPost]
        public async Task<ActionResult<PersonalConferenceModel>> CreatePersonalConference(
        [FromBody] PersonalConferenceModel conference)
        {
            try
            {
                var result = await _personalConferenceService.CreateConferenceAsync(conference);
                return CreatedAtAction(nameof(GetPersonalConferenceById), new { id = result.Id }, result);
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
        // DELETE: api/personalconferences/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePersonalConference(Guid id)
        {
            try
            {
                var result = await _personalConferenceService.DeleteConferenceAsync(id);
                if (!result)
                {
                    return NotFound($"Personal conference with id {id} not found");
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