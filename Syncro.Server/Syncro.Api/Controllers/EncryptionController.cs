using System.Text.Json;
using Syncro.Infrastructure.Encryption.Interfaces;

namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/encryption")]
    public class EncryptionController : ControllerBase
    {
        private readonly IEncryptionService _encryptionService;
        private readonly ILogger<EncryptionController> _logger;

        public EncryptionController(IEncryptionService encryptionService, ILogger<EncryptionController> logger)
        {
            _encryptionService = encryptionService;
            _logger = logger;
        }

        [HttpGet("keys/{userId}")]
        public async Task<ActionResult<string>> GetPublicKey(Guid userId)
        {
            try
            {
                var publicKey = await _encryptionService.GetPublicKeyAsync(userId);
                return Ok(new { PublicKey = publicKey });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public key for user {UserId}", userId);
                return StatusCode(500, "Error getting public key");
            }
        }

        [HttpPost("keys/{userId}/generate")]
        public async Task<ActionResult> GenerateKeys(Guid userId)
        {
            try
            {
                await _encryptionService.GenerateKeyPairAsync(userId);
                return Ok(new { Message = "Keys generated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating keys for user {UserId}", userId);
                return StatusCode(500, "Error generating keys");
            }
        }

        [HttpPost("sessions/initialize")]
        public async Task<ActionResult> InitializeSession([FromBody] InitializeSessionRequest request)
        {
            try
            {
                var result = await _encryptionService.InitializeSessionAsync(
                    request.UserId,
                    request.ContactId,
                    request.ContactPublicKey
                );

                return result ? Ok() : BadRequest("Failed to initialize session");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing session");
                return StatusCode(500, "Error initializing session");
            }
        }
        [HttpGet("sessions/check/{userId}/{contactId}")]
        public async Task<ActionResult> CheckSession(string userId, string contactId)
        {
            try
            {
                var result = await _encryptionService.HasSessionAsync(
                    Guid.Parse(userId),
                    Guid.Parse(contactId)
                );

                return Ok("Session exists");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking session");
                return StatusCode(500, "Error checking session");
            }
        }
        [HttpPost("groups/{groupId}/keys")]
        public async Task<ActionResult> CreateGroupSession(
            Guid groupId,
            [FromBody] CreateGroupSessionRequest request)
        {
            try
            {
                var bundle = await _encryptionService.CreateGroupSessionAsync(
                    groupId,
                    request.CreatorId,
                    request.MemberIds
                );

                return Ok(bundle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating group session for group {GroupId}", groupId);
                return StatusCode(500, "Error creating group session");
            }
        }
        [HttpPost("encrypt")]
        public async Task<ActionResult> EncryptMessage([FromBody] EncryptRequest request)
        {
            try
            {
                var result = await _encryptionService.EncryptMessageAsync(
                    request.Plaintext,
                    request.SenderId,
                    request.RecipientId,
                    request.GroupId
                );

                return Ok(new
                {
                    Success = true,
                    EncryptedBase64 = result.EncryptedBase64,
                    Metadata = result.Metadata,
                    MetadataJson = JsonSerializer.Serialize(result.Metadata),
                    Note = "Use encryptedBase64 as messageContent and metadataJson as encryptionMetadata"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error encrypting message");
                return BadRequest(new { Error = ex.Message, Details = ex.StackTrace });
            }
        }

        [HttpPost("decrypt")]
        public async Task<ActionResult> DecryptMessage([FromBody] DecryptRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.EncryptedBase64))
                    return BadRequest(new { Error = "EncryptedBase64 is required" });

                if (string.IsNullOrEmpty(request.MetadataJson))
                    return BadRequest(new { Error = "MetadataJson is required" });

                try
                {
                    var cleanBase64 = request.EncryptedBase64
                        .Replace(" ", "+")
                        .Replace("\\u002B", "+")
                        .Trim();

                    Convert.FromBase64String(cleanBase64);
                }
                catch (FormatException)
                {
                    return BadRequest(new
                    {
                        Error = "Invalid Base64 string in encryptedBase64",
                        Hint = "Make sure the string doesn't contain invalid characters"
                    });
                }
                var result = await _encryptionService.DecryptMessageAsync(
                    request.EncryptedBase64,
                    request.MetadataJson,
                    request.SenderId
                );
                return Ok(new
                {
                    Success = result.Success,
                    Plaintext = result.Plaintext,
                    Error = result.Error,
                    Note = result.Success ? "Decryption successful" : "Decryption failed"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error decrypting message");
                return BadRequest(new { Error = ex.Message });
            }
        }
    }

    public class InitializeSessionRequest
    {
        public Guid UserId { get; set; }
        public Guid ContactId { get; set; }
        public string ContactPublicKey { get; set; } = null!;
    }

    public class CreateGroupSessionRequest
    {
        public Guid CreatorId { get; set; }
        public List<Guid> MemberIds { get; set; } = new();
    }
    public class EncryptRequest
    {
        public string Plaintext { get; set; } = null!;
        public Guid SenderId { get; set; }
        public Guid RecipientId { get; set; }
        public Guid? GroupId { get; set; }
    }

    public class DecryptRequest
    {
        public string EncryptedBase64 { get; set; } = null!;
        public string MetadataJson { get; set; } = null!;
        public Guid SenderId { get; set; }
    }
}