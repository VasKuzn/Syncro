namespace SyncroBackend.Controllers
{
    [ApiController]
    [Route("api/servers/{serverId}/sectors")]
    public class SectorsController : ControllerBase
    {
        private readonly ISectorService _sectorService;

        public SectorsController(ISectorService sectorService)
        {
            _sectorService = sectorService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SectorModel>>> GetSectorsByServer(Guid serverId)
        {
            try
            {
                var sectors = await _sectorService.GetSectorsByServerIdAsync(serverId);
                return Ok(sectors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{sectorId}")]
        public async Task<ActionResult<SectorModel>> GetSectorById(Guid serverId, Guid sectorId)
        {
            try
            {
                var sector = await _sectorService.GetSectorByIdAsync(sectorId);
                return Ok(sector);
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
        public async Task<ActionResult<SectorModel>> CreateSector(
            Guid serverId,
            [FromBody] SectorModel sector)
        {
            try
            {
                sector.serverId = serverId;
                var createdSector = await _sectorService.CreateSectorAsync(sector);
                return CreatedAtAction(
                    nameof(GetSectorById),
                    new { serverId, sectorId = createdSector.Id },
                    createdSector);
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

        [HttpDelete("{sectorId}")]
        public async Task<IActionResult> DeleteSector(Guid serverId, Guid sectorId)
        {
            try
            {
                var result = await _sectorService.DeleteSectorAsync(sectorId);
                if (!result)
                {
                    return NotFound($"Sector with id {sectorId} not found");
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("{sectorId}")]
        public async Task<ActionResult<SectorModel>> UpdateSector(
            Guid serverId,
            Guid sectorId,
            [FromBody] SectorModelDto sectorDto)
        {
            try
            {
                var updatedSector = await _sectorService.UpdateSectorAsync(sectorId, sectorDto);
                return Ok(updatedSector);
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