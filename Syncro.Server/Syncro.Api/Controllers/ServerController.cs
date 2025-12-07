namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/servers")]
    public class ServersController : ControllerBase
    {
        private readonly IServerService _serverService;

        public ServersController(IServerService serverService)
        {
            _serverService = serverService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServerModel>>> GetAllServers()
        {
            try
            {
                var servers = await _serverService.GetAllServersAsync();
                return Ok(servers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServerModel>> GetServerById(Guid id)
        {
            try
            {
                var server = await _serverService.GetServerByIdAsync(id);
                return Ok(server);
            }
            catch (ArgumentException ex)
            {
                return StatusCode(404, $"Server not found error: {ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<ServerModel>> CreateServer([FromBody] ServerModel server)
        {
            try
            {
                var createdServer = await _serverService.CreateServerAsync(server);
                return CreatedAtAction(
                    nameof(GetServerById),
                    new { id = createdServer.Id },
                    createdServer);
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServer(Guid id)
        {
            try
            {
                var result = await _serverService.DeleteServerAsync(id);
                if (!result)
                {
                    return StatusCode(404, $"Friend not found error: ID {id}");
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ServerModel>> UpdateServer(
            Guid id,
            [FromBody] ServerModelDTO serverDto)
        {
            try
            {
                var updatedServer = await _serverService.UpdateServerAsync(id, serverDto);
                return Ok(updatedServer);
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(404, $"Friend not found error: {ex.Message}");
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
    }
}