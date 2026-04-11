namespace Syncro.Application.Services
{
    public interface IYandexCalendarService
    {
        Task<bool> TestConnectionAsync();
        Task InitializeAsync();
        Task<List<CalendarInfo>> GetCalendarsAsync();
        Task<List<CalendarEventDto>> GetEventsAsync(string calendarUrl, DateTime start, DateTime end);
        Task<string> CreateEventAsync(string calendarUrl, string summary, DateTime start, DateTime end, string? description = null, string? location = null);
        Task UpdateEventAsync(string eventUrl, string summary, DateTime start, DateTime end, string etag, string calendarUrl, string? description = null, string? location = null);
        Task DeleteEventAsync(string eventUrl, string etag);
    }
}