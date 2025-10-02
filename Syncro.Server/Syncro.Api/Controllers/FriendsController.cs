namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FriendsController : ControllerBase
    {
        private readonly IFriendsService _friendsService;
        private readonly IHubContext<FriendsHub> _hubContext;
        private readonly ILogger<FriendsController> _logger;

        public FriendsController(
            IFriendsService friendsService,
            IHubContext<FriendsHub> hubContext,
            ILogger<FriendsController> logger)
        {
            _friendsService = friendsService;
            _hubContext = hubContext;
            _logger = logger;
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
                await NotifyFriendsUpdate(friends.userWhoSent.ToString());
                await NotifyFriendsUpdate(friends.userWhoRecieved.ToString());

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
                var friends = await _friendsService.GetFriendsByIdAsync(id);
                if (friends == null)
                {
                    return NotFound();
                }
                var result = await _friendsService.DeleteFriendsAsync(id);

                if (!result)
                {
                    return NotFound($"Friend with id {id} not found");
                }
                await NotifyFriendsUpdate(friends.userWhoSent.ToString());
                await NotifyFriendsUpdate(friends.userWhoRecieved.ToString());
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
                await NotifyFriendsUpdate(updatedFriend.userWhoSent.ToString());
                await NotifyFriendsUpdate(updatedFriend.userWhoRecieved.ToString());
                return Ok(updatedFriend);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        private async Task NotifyFriendsUpdate(string userId)
        {
            try
            {
                await _hubContext.Clients.Group($"friends-{userId}")
                    .SendAsync("FriendsUpdated", new
                    {
                        Type = "FriendsUpdated",
                        Timestamp = DateTime.UtcNow
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send friends update notification to user {UserId}", userId);
            }
        }
    }

    public class FriendsStatusUpdateRequest
    {
        public FriendsStatusEnum Status { get; set; }
    }
}