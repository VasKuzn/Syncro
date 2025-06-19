namespace SyncroBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FriendsController : ControllerBase
    {
        private readonly IFriendsService _friendsService;

        public FriendsController(IFriendsService friendsService)
        {
            _friendsService = friendsService;
        }

        // GET: api/friends
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FriendsModel>>> GetAllFriends()
        {
            try
            {
                var friends = await _friendsService.GetAllFriendsAsync();
                return Ok(friends);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/friends/{id}
        [HttpGet("{id}")]
        //[Authorize]
        public async Task<ActionResult<FriendsModel>> GetFriendsById(Guid id)
        {
            try
            {
                var friend = await _friendsService.GetFriendsByIdAsync(id);

                if (friend == null)
                {
                    return NotFound($"Friend with id {id} not found");
                }

                return Ok(friend);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        [HttpGet("{id}/getfriends")]
        //[Authorize]
        public async Task<ActionResult<IEnumerable<FriendsModel>>> GetFriendsAccountId(Guid id)
        {
            try
            {
                var friend = await _friendsService.GetFriendsByAccountAsync(id);

                if (friend == null)
                {
                    return NotFound($"Friend with id {id} not found");
                }

                return Ok(friend);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // POST: api/friends
        [HttpPost]
        //[Authorize]
        public async Task<ActionResult<FriendsModel>> CreateFriends([FromBody] FriendsModel friends)
        {
            try
            {
                if (friends.userWhoSent == friends.userWhoRecieved)
                {
                    return BadRequest("Cannot create friendship with yourself");
                }

                var createdFriend = await _friendsService.CreateFriendsAsync(friends);

                if (createdFriend.Id != friends.Id)
                {
                    return Ok(createdFriend);
                }

                return CreatedAtAction(
                    nameof(GetFriendsById),
                    new { id = createdFriend.Id },
                    createdFriend);
            }
            catch (ArgumentException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // DELETE: api/friends/{id}
        [HttpDelete("{id}")]
        //[Authorize]
        public async Task<IActionResult> DeleteFriends(Guid id)
        {
            try
            {
                var result = await _friendsService.DeleteFriendsAsync(id);

                if (!result)
                {
                    return NotFound($"Friend with id {id} not found");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // PATCH: api/friends/{id}/status
        [HttpPatch("{id}/status")]
        //[Authorize]
        public async Task<ActionResult<FriendsModel>> UpdateFriendsStatus(Guid id, [FromBody] FriendsStatusUpdateRequest statusUpdate)
        {
            try
            {
                var updatedFriend = await _friendsService.UpdateFriendsStatusAsync(
                    id,
                    statusUpdate.Status,
                    DateTime.UtcNow);

                if (updatedFriend == null)
                {
                    return NotFound($"Friend with id {id} not found");
                }

                return Ok(updatedFriend);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

    public class FriendsStatusUpdateRequest
    {
        public FriendsStatusEnum Status { get; set; }
    }
}