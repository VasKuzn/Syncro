namespace Syncro.Application.ModelsDTO
{
    // DTO для календаря
    public class CalendarInfo
    {
        public string Id { get; set; }
        public string DisplayName { get; set; }
        public string Description { get; set; }
        public string Color { get; set; }
    }

    // DTO для события
    public class CalendarEventDto
    {
        public string Uid { get; set; }
        public string Summary { get; set; }
        public string Description { get; set; }
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public string Location { get; set; }

        public string? Etag { get; set; } // Добавьте это поле
        public string? Url { get; set; }  // Полезно для обновления/удаления
    }
}
