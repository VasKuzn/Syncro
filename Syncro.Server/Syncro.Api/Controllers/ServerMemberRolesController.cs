namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/servers/{serverId}/members/{accountId}/roles")]
    public class ServerMemberRolesController : ControllerBase
    {
        private readonly IServerMemberRolesService _service;

        public ServerMemberRolesController(IServerMemberRolesService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<List<ServerMemberRoles>>> GetMemberRoles(
            Guid serverId, Guid accountId)
        {
            try
            {
                var roles = await _service.GetMemberRolesAsync(serverId, accountId);
                return Ok(roles);
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

        [HttpPost]
        public async Task<ActionResult<ServerMemberRoles>> AssignRoleToMember(
            Guid serverId, Guid accountId, [FromBody] ServerMemberRoles memberRole)
        {
            try
            {
                memberRole.serverId = serverId;
                memberRole.accountId = accountId;

                var assignedRole = await _service.AssignRoleToMemberAsync(memberRole);
                return CreatedAtAction(
                    nameof(GetMemberRoles),
                    new { serverId, accountId },
                    assignedRole);
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

        [HttpDelete("{roleId}")]
        public async Task<IActionResult> RemoveRoleFromMember(
            Guid serverId, Guid accountId, Guid roleId)
        {
            try
            {
                var assignments = await _service.GetMemberRolesAsync(serverId, accountId);
                var assignment = assignments.FirstOrDefault(x => x.roleId == roleId);

                if (assignment == null)
                    return NotFound("Role assignment not found");

                var result = await _service.RemoveRoleFromMemberAsync(assignment.Id);
                if (!result)
                    return NotFound("Role assignment not found");

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete]
        public async Task<IActionResult> RemoveAllRolesFromMember(
            Guid serverId, Guid accountId)
        {
            try
            {
                var result = await _service.RemoveAllRolesFromMemberAsync(serverId, accountId);
                if (!result)
                    return NotFound("No roles found for this member");

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}