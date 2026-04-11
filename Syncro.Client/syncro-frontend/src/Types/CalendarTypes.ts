export interface CalendarInfo {
    id: string;
    displayName: string;
    description?: string;
    color?: string;
}

export interface CalendarEvent {
    uid: string;
    summary?: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    etag?: string;
    url?: string;
}

export interface CreateEventDto {
    calendarUrl: string;
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
}

export interface UpdateEventDto extends CreateEventDto {
    eventUrl: string;
    etag: string;
}