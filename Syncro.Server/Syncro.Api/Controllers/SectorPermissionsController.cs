using Syncro.Domain.Enums;

namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/servers/{serverId}/sectors/{sectorId}/permissions")]
    public class SectorPermissionsController : ControllerBase
    {
        private readonly ISectorPermissionsService _permissionsService;

        public SectorPermissionsController(ISectorPermissionsService permissionsService)
        {
            _permissionsService = permissionsService;
        }

        [HttpPost]
        public async Task<ActionResult<SectorPermissionsModel>> GrantPermission(
            Guid serverId, Guid sectorId, [FromBody] SectorPermissionsModel permission)
        {
            try
            {
                permission.serverId = serverId;
                permission.sectorId = sectorId;
                var result = await _permissionsService.GrantPermissionAsync(permission);
                return CreatedAtAction(nameof(GetAccountPermissions), new { id = result.Id }, result);
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

        [HttpGet("account/{accountId}")]
        public async Task<ActionResult<List<Permissions>>> GetAccountPermissions(
            Guid serverId, Guid sectorId, Guid accountId)
        {
            try
            {
                var permissions = await _permissionsService.GetPermissionsAsync(accountId, sectorId);
                return Ok(permissions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("check")]
        public async Task<ActionResult<bool>> CheckPermission(
            Guid serverId, Guid sectorId,
            [FromQuery] Guid accountId,
            [FromQuery] Permissions permission)
        {
            try
            {
                var hasPermission = await _permissionsService.HasPermissionAsync(accountId, sectorId, permission);
                return Ok(hasPermission);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{permissionId}")]
        public async Task<IActionResult> RevokePermission(
            Guid serverId, Guid sectorId, Guid permissionId)
        {
            try
            {
                var result = await _permissionsService.RevokePermissionAsync(permissionId);
                if (!result) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}