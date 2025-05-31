namespace SyncroBackend.Controllers
{
    [ApiController]
    [Route("api/servers/{serverId}/members")]
    public class ServerMembersController : ControllerBase
    {
        private readonly IServerMemberService _memberService;

        public ServerMembersController(IServerMemberService memberService)
        {
            _memberService = memberService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServerMemberModel>>> GetMembersByServer(Guid serverId)
        {
            try
            {
                var members = await _memberService.GetMembersByServerIdAsync(serverId);
                return Ok(members);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{memberId}")]
        public async Task<ActionResult<ServerMemberModel>> GetMemberById(Guid serverId, Guid memberId)
        {
            try
            {
                var member = await _memberService.GetMemberByIdAsync(memberId);
                return Ok(member);
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
        public async Task<ActionResult<ServerMemberModel>> CreateMember(
            Guid serverId,
            [FromBody] ServerMemberModel member)
        {
            try
            {
                member.serverId = serverId;
                var createdMember = await _memberService.CreateMemberAsync(member);
                return CreatedAtAction(
                    nameof(GetMemberById),
                    new { serverId, memberId = createdMember.Id },
                    createdMember);
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

        [HttpDelete("{memberId}")]
        public async Task<IActionResult> DeleteMember(Guid serverId, Guid memberId)
        {
            try
            {
                var result = await _memberService.DeleteMemberAsync(memberId);
                if (!result)
                {
                    return NotFound($"Member with id {memberId} not found");
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("{memberId}")]
        public async Task<ActionResult<ServerMemberModel>> UpdateMember(
            Guid serverId,
            Guid memberId,
            [FromBody] ServerMemberDto memberDto)
        {
            try
            {
                var updatedMember = await _memberService.UpdateMemberAsync(memberId, memberDto);
                return Ok(updatedMember);
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

        [HttpPost("{memberId}/ban")]
        public async Task<ActionResult<ServerMemberModel>> BanMember(
            Guid serverId,
            Guid memberId,
            [FromBody] BanMemberDto banDto)
        {
            try
            {
                var bannedMember = await _memberService.BanMemberAsync(memberId, banDto.banReason);
                return Ok(bannedMember);
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

        [HttpPost("{memberId}/unban")]
        public async Task<ActionResult<ServerMemberModel>> UnbanMember(Guid serverId, Guid memberId)
        {
            try
            {
                var unbannedMember = await _memberService.UnbanMemberAsync(memberId);
                return Ok(unbannedMember);
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