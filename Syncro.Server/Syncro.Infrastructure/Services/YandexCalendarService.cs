using CalDAV;
using CalDAV.Utils;

namespace Syncro.Infrastructure.Services
{
    public class YandexCalendarService : IYandexCalendarService
    {
        private readonly CalDAVClient _client;

        public YandexCalendarService(string email, string password)
        {
            _client = new CalDAVClient("https://caldav.yandex.ru/", email, password);
        }

        public async Task<bool> TestConnectionAsync()
        {
            return await _client.TestConnectionAsync();
        }

        public async Task InitializeAsync()
        {
            await _client.InitializeAsync();
        }

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
            var events = await _client.GetEventsAsync(calendarUrl, start, end);

            return events.Select(e => new CalendarEventDto
            {
                Uid = e.Uid,
                Summary = e.Summary,
                Description = e.Description,
                Start = e.StartTime,
                End = e.EndTime,
                Location = e.Location,
            }).ToList();
        }

        public async Task<string> CreateEventAsync(string calendarUrl, string summary,
            DateTime start, DateTime end, string? description = null, string? location = null)
        {
            var eventData = ICalendarGenerator.CreateSimpleEvent(summary, start, end, description, location);
            return await _client.CreateEventAsync(calendarUrl, eventData);
        }

        public async Task UpdateEventAsync(string eventUrl, string summary,
            DateTime start, DateTime end, string etag, string? description = null, string? location = null)
        {
            var updatedData = ICalendarGenerator.CreateSimpleEvent(summary, start, end, description, location);
            await _client.UpdateEventAsync(eventUrl, updatedData, etag);
        }

        public async Task DeleteEventAsync(string eventUrl, string etag)
        {
            await _client.DeleteEventAsync(eventUrl, etag);
        }
    }
}