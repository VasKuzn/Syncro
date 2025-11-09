namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/servers/{serverId}/serverroles")]
    public class ServerRolesController : ControllerBase
    {
        private readonly IRolesService _rolesService;

        public ServerRolesController(IRolesService rolesService)
        {
            _rolesService = rolesService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RolesModel>>> GetRolesByServer(Guid serverId)
        {
            try
            {
                var roles = await _rolesService.GetRolesByServerIdAsync(serverId);
                return Ok(roles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{roleId}")]
        public async Task<ActionResult<RolesModel>> GetRoleById(Guid serverId, Guid roleId)
        {
            try
            {
                var role = await _rolesService.GetRoleByIdAsync(roleId);
                return Ok(role);
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
        public async Task<ActionResult<RolesModel>> CreateRole(
            Guid serverId,
            [FromBody] RolesModel role)
        {
            try
            {
                role.serverId = serverId;
                var createdRole = await _rolesService.CreateRoleAsync(role);
                return CreatedAtAction(
                    nameof(GetRoleById),
                    new { serverId, roleId = createdRole.Id },
                    createdRole);
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
        public async Task<IActionResult> DeleteRole(Guid serverId, Guid roleId)
        {
            try
            {
                var result = await _rolesService.DeleteRoleAsync(roleId);
                if (!result)
                {
                    return NotFound($"Role with id {roleId} not found");
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("{roleId}")]
        public async Task<ActionResult<RolesModel>> UpdateRole(
            Guid serverId,
            Guid roleId,
            [FromBody] RolesModelDTO roleDto)
        {
            try
            {
                var updatedRole = await _rolesService.UpdateRoleAsync(roleId, roleDto);
                return Ok(updatedRole);
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

        [HttpPatch("{roleId}/position")]
        public async Task<ActionResult<RolesModel>> UpdateRolePosition(
            Guid serverId,
            Guid roleId,
            [FromBody] UpdatePositionDTO positionDto)
        {
            try
            {
                var updatedRole = await _rolesService.UpdateRolePositionAsync(roleId, positionDto.newPosition);
                return Ok(updatedRole);
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
    }
}