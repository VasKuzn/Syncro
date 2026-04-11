// Syncro.Api/Controllers/YandexCalendarController.cs
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Syncro.Application.Services;
using Syncro.Application.TransferModels;
using Syncro.Infrastructure.Data.DataBaseContext;
using Syncro.Infrastructure.Services;

namespace Syncro.Api.Controllers
{
    [ApiController]
    [Route("api/calendar")]
    [Authorize]
    public class YandexCalendarController : ControllerBase
    {
        private readonly IProtectionService _protectionService;
        private readonly IAccountService _accountService;
        private readonly DataBaseContext _dbContext;
        private readonly ILogger<YandexCalendarController> _logger;

        public YandexCalendarController(
            IAccountService accountService,
            IProtectionService protectionService,
            DataBaseContext dbContext,
            ILogger<YandexCalendarController> logger)
        {
            _accountService = accountService;
            _protectionService = protectionService;
            _dbContext = dbContext;
            _logger = logger;
        }

        private Guid GetCurrentUserId()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                throw new UnauthorizedAccessException("User is not authenticated.");
            return userId;
        }

        private async Task<IYandexCalendarService> CreateCalendarServiceForCurrentUserAsync()
        {
            var userId = GetCurrentUserId();
            var account = await _dbContext.accounts
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == userId);

            if (account == null)
                throw new InvalidOperationException("Account not found.");

            if (string.IsNullOrEmpty(account.yandexCalendarLogin) || string.IsNullOrEmpty(account.yandexCalendarPassword))
                throw new InvalidOperationException("CalDAV credentials are not configured for this account.");

            var email = account.yandexCalendarLogin;
            var password = _protectionService.Decrypt(account.yandexCalendarPassword);

            return new YandexCalendarService(email, password);
        }
        [HttpGet("settings")]
        public async Task<ActionResult<CalDAVSettingsDto>> GetYandexSettings()
        {
            var userId = GetCurrentUserId();
            var account = await _dbContext.accounts
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == userId);

            if (account == null)
                throw new InvalidOperationException("Account not found.");

            if (string.IsNullOrEmpty(account.yandexCalendarLogin) || string.IsNullOrEmpty(account.yandexCalendarPassword))
                throw new InvalidOperationException("CalDAV credentials are not configured for this account.");

            CalDAVSettingsDto calDAVSettingsDto = new CalDAVSettingsDto
            {
                Email = account.yandexCalendarLogin,
                Password = account.yandexCalendarPassword,
            };
            return Ok(calDAVSettingsDto);
        }
        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] CalDAVSettingsDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Email and password are required.");

            var userId = GetCurrentUserId();

            var updateDto = new AccountPartialUpdateDTO
            {
                yandexCalendarLogin = dto.Email,
                yandexCalendarPassword = _protectionService.Encrypt(dto.Password)
            };

            await _accountService.UpdateAccountPartialAsync(userId, updateDto);
            return Ok(new { message = "CalDAV settings saved successfully." });
        }

        [HttpPost("check")]
        public async Task<IActionResult> CheckConnection()
        {
            try
            {
                var service = await CreateCalendarServiceForCurrentUserAsync();
                var isConnected = await service.TestConnectionAsync();
                if (!isConnected)
                    return BadRequest(new { success = false, error = "Connection failed. Check credentials." });

                await service.InitializeAsync();
                var calendars = await service.GetCalendarsAsync();

                return Ok(new { success = true, calendars });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("not configured"))
            {
                return BadRequest(new { success = false, error = "CalDAV settings not configured." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CalDAV check connection error");
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet("calendars")]
        public async Task<IActionResult> GetCalendars()
        {
            try
            {
                var service = await CreateCalendarServiceForCurrentUserAsync();
                await service.InitializeAsync();
                var calendars = await service.GetCalendarsAsync();
                return Ok(calendars);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Get calendars error");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("events")]
        public async Task<IActionResult> GetEvents([FromQuery] string calendarUrl, [FromQuery] DateTime start, [FromQuery] DateTime end)
        {
            try
            {
                var service = await CreateCalendarServiceForCurrentUserAsync();
                await service.InitializeAsync();
                var events = await service.GetEventsAsync(calendarUrl, start, end);
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Get events error");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("events")]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto dto)
        {
            try
            {
                var service = await CreateCalendarServiceForCurrentUserAsync();
                await service.InitializeAsync();
                var eventUrl = await service.CreateEventAsync(
                    dto.CalendarUrl,
                    dto.Summary,
                    dto.Start,
                    dto.End,
                    dto.Description,
                    dto.Location
                );
                return Ok(new { eventUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Create event error");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("events")]
        public async Task<IActionResult> UpdateEvent([FromBody] UpdateEventDto dto)
        {
            try
            {
                var service = await CreateCalendarServiceForCurrentUserAsync();
                await service.InitializeAsync();
                await service.UpdateEventAsync(
                    dto.EventUrl,
                    dto.Summary,
                    dto.Start,
                    dto.End,
                    dto.Etag,
                    dto.Description,
                    dto.Location
                );
                return Ok(new { message = "Event updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Update event error");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("events")]
        public async Task<IActionResult> DeleteEvent([FromQuery] string eventUrl, [FromQuery] string etag)
        {
            try
            {
                var service = await CreateCalendarServiceForCurrentUserAsync();
                await service.InitializeAsync();
                await service.DeleteEventAsync(eventUrl, etag);
                return Ok(new { message = "Event deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Delete event error");
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    public class CalDAVSettingsDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class CreateEventDto
    {
        public string CalendarUrl { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public string? Description { get; set; }
        public string? Location { get; set; }
    }

    public class UpdateEventDto : CreateEventDto
    {
        public string EventUrl { get; set; } = string.Empty;
        public string Etag { get; set; } = string.Empty;
    }
}