namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/messages")]
    public class MessagesController : ControllerBase
    {
        private readonly ICouchBaseMessagesService _messageService;
        private readonly IHubContext<PersonalMessagesHub> _messagesHub;

        public MessagesController(ICouchBaseMessagesService messageService, IHubContext<PersonalMessagesHub> messagesHub)
        {
            _messageService = messageService;
            _messagesHub = messagesHub;
        }

        // GET: api/messages
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MessageModel>>> GetAllMessages()
        {
            try
            {
                var messages = await _messageService.GetAllMessagesAsync();
                return Ok(messages);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // GET: api/messages/{id}/bypersonalconference
        [HttpGet("bypersonalconference")]
        public async Task<ActionResult<IEnumerable<MessageModel>>> GetAllMessagesByPersonalConference(Guid personalConferenceId)
        {
            try
            {
                var messages = await _messageService.GetAllMessagesByPersonalConferenceAsync(personalConferenceId);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // GET: api/messages/{id}
        [HttpGet("{id}")]
        //[Authorize]
        public async Task<ActionResult<MessageModel>> GetMessageById(Guid id)
        {
            try
            {
                var message = await _messageService.GetMessageByIdAsync(id);
                return Ok(message);
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
        // POST: api/messages
        [HttpPost]
        //[Authorize]
        public async Task<ActionResult<AccountModel>> CreateMessage([FromBody] MessageModel account)
        {
            try
            {
                var createdMessage = await _messageService.CreateMessageAsync(account);
                //персональные конференции
                if (createdMessage.personalConferenceId != null)
                {
                    await _messagesHub.Clients.Group($"personalconference-{createdMessage.personalConferenceId}").SendAsync("ReceivePersonalMessage", createdMessage);
                }
                //
                return CreatedAtAction(nameof(GetMessageById), new { id = createdMessage.Id }, createdMessage);
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
        // PUT api/messages/{id}
        [HttpPut("text/{id}")]
        //[Authorize]
        public async Task<ActionResult<MessageModel>> UpdateMessageText(Guid id, [FromBody] MessageDTO messageDto)
        {
            try
            {
                var updatedMessage = await _messageService.UpdateMessageTextAsync(id, messageDto);
                return Ok(updatedMessage);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        // PUT api/messages/{id}/read
        [HttpPut("{id}/read")]
        [ProducesResponseType(typeof(MessageModel), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        //[Authorize]
        public async Task<ActionResult<MessageModel>> MarkAsRead(Guid id, Guid reader, [FromQuery] bool isRead)
        {
            try
            {
                var result = await _messageService.MarkMessageAsReadAsync(id, reader, isRead);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // PUT api/messages/{id}/pin
        [HttpPut("{id}/pin")]
        [ProducesResponseType(typeof(MessageModel), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        //[Authorize]
        public async Task<ActionResult<MessageModel>> TogglePin(Guid id)
        {
            try
            {
                var result = await _messageService.ToggleMessagePinAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // PUT api/messages/{id}/reference
        [HttpPut("{id}/reference")]
        [ProducesResponseType(typeof(MessageModel), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        //[Authorize]
        public async Task<ActionResult<MessageModel>> SetReference(Guid id, [FromQuery] Guid referenceMessageId)
        {
            try
            {
                var result = await _messageService.SetMessageReferenceAsync(id, referenceMessageId);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }


        // DELETE: api/messages/{id}
        [HttpDelete("{id}")]
        //[Authorize]
        public async Task<IActionResult> DeleteMessage(Guid id)
        {
            try
            {
                var result = await _messageService.DeleteMessageAsync(id);
                if (!result)
                {
                    return NotFound($"Message with id {id} not found");
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}