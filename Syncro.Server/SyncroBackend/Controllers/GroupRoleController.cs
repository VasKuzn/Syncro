namespace SyncroBackend.Controllers
{
    [ApiController]
    [Route("api/grouprole")]
    public class GroupRoleController : ControllerBase
    {
        private readonly IGroupRoleService _groupRoleService;

        public GroupRoleController(IGroupRoleService groupRoleService)
        {
            _groupRoleService = groupRoleService;
        }

        [HttpPost]
        [ProducesResponseType(typeof(ConferenceRolesModel), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateGroupRole([FromBody] ConferenceRolesModel conferenceRole)
        {
            try
            {
                var createdRole = await _groupRoleService.CreateGroupRoleAsync(conferenceRole);
                return CreatedAtAction(
                    nameof(GetGroupRoleById),
                    new { conferenceRoleId = createdRole.Id },
                    createdRole);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<ConferenceRolesModel>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllGroupRoles()
        {
            var roles = await _groupRoleService.GetAllGroupRolesAsync();
            return Ok(roles);
        }

        [HttpGet("{conferenceRoleId}")]
        [ProducesResponseType(typeof(ConferenceRolesModel), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetGroupRoleById(Guid conferenceRoleId)
        {
            try
            {
                var role = await _groupRoleService.GetGroupRoleByIdAsync(conferenceRoleId);
                return Ok(role);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("{conferenceRoleId}/permissions")]
        [ProducesResponseType(typeof(ConferenceRolesModel), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateGroupRolePermissions(
            [FromRoute] Guid conferenceRoleId,
            [FromBody] Permissions permissions)
        {
            try
            {
                var updatedRole = await _groupRoleService.UpdateGroupRoleAsync(conferenceRoleId, permissions);
                return Ok(updatedRole);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [HttpDelete("{conferenceRoleId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteGroupRole(Guid conferenceRoleId)
        {
            try
            {
                var result = await _groupRoleService.DeleteGroupRoleAsync(conferenceRoleId);
                return result ? NoContent() : NotFound();
            }
            catch
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }
    }
}