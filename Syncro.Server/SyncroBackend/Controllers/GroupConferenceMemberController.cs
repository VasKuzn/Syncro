namespace SyncroBackend.Controllers
{
    [ApiController]
    [Route("api/groupconferencemember")]
    public class GroupConferenceMemberController : ControllerBase
    {
        private readonly IGroupConferenceMemberService _groupConferenceMemberService;

        public GroupConferenceMemberController(IGroupConferenceMemberService groupConferenceMemberService)
        {
            _groupConferenceMemberService = groupConferenceMemberService;
        }
        // GET /api/groupconferencemember
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GroupConferenceMemberModel>>> GetAllGroupConferenceMembers()
        {
            try
            {
                var groupConferenceMembers = await _groupConferenceMemberService.GetAllGroupConferenceMembersAsync();
                return Ok(groupConferenceMembers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // GET /api/groupconferencemember{id}
        [HttpGet("{id}")]
        //[Authorize]
        public async Task<ActionResult<GroupConferenceMemberModel>> GetGroupConferenceMemberById(Guid id)
        {
            try
            {
                var groupConferenceMember = await _groupConferenceMemberService.GetMemberByIdAsync(id);
                return Ok(groupConferenceMember);
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
        // GET /api/groupconferencemembers{confereiceId}
        [HttpGet("{conferenceId}/groupConference")]
        //[Authorize]
        public async Task<ActionResult<GroupConferenceMemberModel>> GetGroupConferenceMembersByConference(Guid conferenceId)
        {
            try
            {
                var groupConferenceMember = await _groupConferenceMemberService.GetAllMembersByConferenceAsync(conferenceId);
                return Ok(groupConferenceMember);
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
        // GET /api/groupconferencemember{id}/{confereiceId}
        [HttpGet("{id}/{conferenceId}")]
        //[Authorize]
        public async Task<ActionResult<GroupConferenceMemberModel>> GetGroupConferenceMembersByIdByConference(Guid id, Guid conferenceId)
        {
            try
            {
                var groupConferenceMember = await _groupConferenceMemberService.GetMemberByIdByConferenceAsync(id, conferenceId);
                return Ok(groupConferenceMember);
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
        [HttpPost]
        //[Authorize]
        public async Task<ActionResult<GroupConferenceMemberModel>> CreateGroupConferenceMember([FromBody] GroupConferenceMemberModel groupConferenceMember)
        {
            try
            {
                var createdGroupConferenceMember = await _groupConferenceMemberService.CreateConferenceMemberAsync(groupConferenceMember);
                return CreatedAtAction(nameof(GetGroupConferenceMemberById), new { id = createdGroupConferenceMember.Id }, createdGroupConferenceMember);
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
        [HttpPut]
        //[Authorize]
        public async Task<IActionResult> UpdateGroupConferenceMember(Guid id, [FromBody] ConferenceMemberModelDTO conferenceMemberDto)
        {
            try
            {
                var updatedGroupConferenceMember = await _groupConferenceMemberService.UpdateConferenceMemberAsync(id, conferenceMemberDto);
                return Ok(updatedGroupConferenceMember);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
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
        [HttpDelete]
        //[Authorize]
        public async Task<IActionResult> DeleteGroupConferenceMember(Guid id)
        {
            try
            {
                var result = await _groupConferenceMemberService.DeleteGroupMemberAsync(id);
                if (!result)
                {
                    return NotFound($"Account with id {id} not found");
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