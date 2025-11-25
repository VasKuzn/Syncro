namespace Syncro.Api.Controllers
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
                return StatusCode(404, $"Member not found error: {ex.Message}");
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
                return StatusCode(400, $"Bad request error: {ex.Message}");
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
                    return StatusCode(404, $"Member not found error: ID {memberId}");
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
            [FromBody] ServerMemberDTO memberDto)
        {
            try
            {
                var updatedMember = await _memberService.UpdateMemberAsync(memberId, memberDto);
                return Ok(updatedMember);
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(404, $"Member not found error: {ex.Message}");
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

        [HttpPost("{memberId}/ban")]
        public async Task<ActionResult<ServerMemberModel>> BanMember(
            Guid serverId,
            Guid memberId,
            [FromBody] BanMemberDTO banDto)
        {
            try
            {
                var bannedMember = await _memberService.BanMemberAsync(memberId, banDto.banReason);
                return Ok(bannedMember);
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(404, $"Member not found error: {ex.Message}");
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
                return StatusCode(404, $"Member not found error: {ex.Message}");
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