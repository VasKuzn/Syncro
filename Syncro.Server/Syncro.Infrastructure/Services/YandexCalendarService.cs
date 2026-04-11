using CalDAV;
using CalDAV.Utils;

namespace Syncro.Infrastructure.Services
{
    public class YandexCalendarService : IYandexCalendarService
    {
        private const string BaseServerUrl = "https://caldav.yandex.ru";
        private readonly CalDAVClient _client;

        public YandexCalendarService(string email, string password)
        {
            _client = new CalDAVClient(BaseServerUrl + "/", email, password);
        }

        private string EnsureAbsoluteUrl(string url)
        {
            if (string.IsNullOrEmpty(url))
                throw new ArgumentNullException(nameof(url));
            if (Uri.IsWellFormedUriString(url, UriKind.Absolute))
                return url;
            return BaseServerUrl.TrimEnd('/') + "/" + url.TrimStart('/');
        }

        public async Task<bool> TestConnectionAsync() => await _client.TestConnectionAsync();
        public async Task InitializeAsync() => await _client.InitializeAsync();

        public async Task<List<CalendarInfo>> GetCalendarsAsync()
        {
            var calendars = await _client.GetCalendarsAsync();
            return calendars.Select(c => new CalendarInfo
            {
                Id = c.Url,
                DisplayName = c.DisplayName,
                Description = c.Description,
                Color = c.Color
            }).ToList();
        }

        public async Task<List<CalendarEventDto>> GetEventsAsync(string calendarUrl, DateTime start, DateTime end)
        {
            calendarUrl = EnsureAbsoluteUrl(calendarUrl);
            var events = await _client.GetEventsAsync(calendarUrl, start, end);
            return events.Select(e => new CalendarEventDto
            {
                Uid = e.Uid,
                Summary = e.Summary,
                Description = e.Description,
                Start = e.StartTime,
                End = e.EndTime,
                Location = e.Location,
                Etag = e.ETag,
                Url = e.Href
            }).ToList();
        }

        public async Task<string> CreateEventAsync(string calendarUrl, string summary,
            DateTime start, DateTime end, string? description = null, string? location = null)
        {
            calendarUrl = EnsureAbsoluteUrl(calendarUrl);
            var eventData = ICalendarGenerator.CreateSimpleEvent(summary, start, end, description, location);
            return await _client.CreateEventAsync(calendarUrl, eventData);
        }

        public async Task UpdateEventAsync(string eventUrl, string summary, DateTime start, DateTime end, string etag, string calendarUrl, string? description = null, string? location = null)
        {
            eventUrl = EnsureAbsoluteUrl(eventUrl);
            calendarUrl = EnsureAbsoluteUrl(calendarUrl);

            var updatedData = ICalendarGenerator.CreateSimpleEvent(summary, start, end, description, location);
            string newEventUrl = await _client.CreateEventAsync(calendarUrl, updatedData);

            try
            {
                await _client.DeleteEventAsync(eventUrl, etag);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Warning: Failed to delete old event {eventUrl}: {ex.Message}");
            }
        }

        public async Task DeleteEventAsync(string eventUrl, string etag)
        {
            eventUrl = EnsureAbsoluteUrl(eventUrl);
            await _client.DeleteEventAsync(eventUrl, etag);
        }
    }
}