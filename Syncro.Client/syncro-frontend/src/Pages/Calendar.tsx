import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Friend } from '../Types/FriendType';
import { CalendarInfo, CalendarEvent, CreateEventDto, UpdateEventDto } from '../Types/CalendarTypes';
import '../Styles/Calendar.css';

interface CalendarProps {
}

const Calendar: React.FC<CalendarProps> = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Извлекаем данные из state, переданного при navigate
    const state = location.state as { friends?: Friend[]; baseUrl?: string } | null;
    const friends: Friend[] = state?.friends || [];
    const baseUrl: string = state?.baseUrl || import.meta.env.VITE_API_BASE_URL || '';

    const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
    const [selectedCalendar, setSelectedCalendar] = useState<CalendarInfo | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; isError: boolean } | null>(null);

    // Фильтр по дате
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    // Модальные окна
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // Форма создания/редактирования
    const [formData, setFormData] = useState({
        summary: '',
        description: '',
        start: '',
        end: '',
        location: '',
        friendId: ''
    });

    // Если нет baseUrl – редиректим или показываем ошибку
    useEffect(() => {
        if (!baseUrl) {
            console.error('Calendar: baseUrl is missing');
            // Можно вернуться назад
            // navigate(-1);
        }
    }, [baseUrl, navigate]);

    // Загрузка списка календарей
    useEffect(() => {
        if (baseUrl) {
            loadCalendars();
        }
    }, [baseUrl]);

    // Загрузка событий при смене календаря или дат
    useEffect(() => {
        if (selectedCalendar && baseUrl) {
            loadEvents();
        }
    }, [selectedCalendar, dateRange, baseUrl]);

    const showNotification = (message: string, isError = false) => {
        setNotification({ message, isError });
        setTimeout(() => setNotification(null), 3500);
    };

    const loadCalendars = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${baseUrl}/api/calendar/calendars`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Ошибка загрузки календарей');
            const data = await response.json();
            setCalendars(data);
            if (data.length > 0) {
                setSelectedCalendar(data[0]);
            }
        } catch (err: any) {
            showNotification(err.message, true);
        } finally {
            setLoading(false);
        }
    };

    const loadEvents = async () => {
        if (!selectedCalendar) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                calendarUrl: selectedCalendar.id,
                start: new Date(dateRange.start).toISOString(),
                end: new Date(dateRange.end).toISOString()
            });
            const response = await fetch(`${baseUrl}/api/calendar/events?${params}`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Ошибка загрузки событий');
            const data = await response.json();
            setEvents(data);
        } catch (err: any) {
            showNotification(err.message, true);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCalendar) return;
        setLoading(true);
        try {
            const dto: CreateEventDto = {
                calendarUrl: selectedCalendar.id,
                summary: formData.summary,
                description: formData.description,
                start: new Date(formData.start).toISOString(),
                end: new Date(formData.end).toISOString(),
                location: formData.location || (formData.friendId ? `Созвон с ${friends.find(f => f.id === formData.friendId)?.nickname}` : undefined)
            };
            const response = await fetch(`${baseUrl}/api/calendar/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dto)
            });
            if (!response.ok) throw new Error('Ошибка создания события');
            showNotification('Событие создано');
            setShowCreateModal(false);
            resetForm();
            loadEvents();
        } catch (err: any) {
            showNotification(err.message, true);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEvent) return;
        setLoading(true);
        try {
            const dto: UpdateEventDto = {
                eventUrl: selectedEvent.url!,
                etag: selectedEvent.etag!,
                calendarUrl: selectedCalendar!.id,
                summary: formData.summary,
                description: formData.description,
                start: new Date(formData.start).toISOString(),
                end: new Date(formData.end).toISOString(),
                location: formData.location
            };
            const response = await fetch(`${baseUrl}/api/calendar/events`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dto)
            });
            if (!response.ok) throw new Error('Ошибка обновления события');
            showNotification('Событие обновлено');
            setShowEditModal(false);
            resetForm();
            loadEvents();
        } catch (err: any) {
            showNotification(err.message, true);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (event: CalendarEvent) => {
        if (!window.confirm('Удалить событие?')) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                eventUrl: event.url!,
                etag: event.etag!
            });
            const response = await fetch(`${baseUrl}/api/calendar/events?${params}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Ошибка удаления');
            showNotification('Событие удалено');
            loadEvents();
        } catch (err: any) {
            showNotification(err.message, true);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setFormData({
            summary: event.summary || '',
            description: event.description || '',
            start: event.start.slice(0, 16),
            end: event.end.slice(0, 16),
            location: event.location || '',
            friendId: ''
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            summary: '',
            description: '',
            start: '',
            end: '',
            location: '',
            friendId: ''
        });
        setSelectedEvent(null);
    };

    const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (!baseUrl) {
        return <div className="error-message">Ошибка: не указан baseUrl</div>;
    }

    return (
        <div className="calendar-page">
            {notification && (
                <div className={`notification ${notification.isError ? 'error' : ''}`}>
                    <div className="notification-content">
                        <span className="notification-icon">{notification.isError ? '⚠️' : '✓'}</span>
                        {notification.message}
                    </div>
                    <div className="notification-progress" />
                </div>
            )}

            <div className="calendar-header">
                <h2>Яндекс Календарь</h2>
                <div className="calendar-controls">
                    <button className="button primary" onClick={() => navigate('/main')}>
                        ← Назад
                    </button>
                    <select
                        value={selectedCalendar?.id || ''}
                        onChange={(e) => {
                            const cal = calendars.find(c => c.id === e.target.value);
                            setSelectedCalendar(cal || null);
                        }}
                        disabled={loading || calendars.length === 0}
                    >
                        {calendars.map(cal => (
                            <option key={cal.id} value={cal.id}>{cal.displayName}</option>
                        ))}
                    </select>

                    <div className="date-range">
                        <input
                            type="date"
                            name="start"
                            value={dateRange.start}
                            onChange={handleDateRangeChange}
                        />
                        <span>—</span>
                        <input
                            type="date"
                            name="end"
                            value={dateRange.end}
                            onChange={handleDateRangeChange}
                        />
                    </div>

                    <button
                        className="button primary"
                        onClick={() => setShowCreateModal(true)}
                        disabled={!selectedCalendar}
                    >
                        + Новое событие
                    </button>
                </div>
            </div>

            <div className="events-list">
                {loading && <div className="loader">Загрузка...</div>}
                {!loading && events.length === 0 && (
                    <div className="empty-state">
                        <p>Нет событий в выбранном периоде</p>
                    </div>
                )}
                {events.map(event => (
                    <div key={event.uid} className="event-card">
                        <div className="event-info">
                            <h3>{event.summary || 'Без названия'}</h3>
                            <p className="event-time">
                                {new Date(event.start).toLocaleString()} – {new Date(event.end).toLocaleString()}
                            </p>
                            {event.description && <p>{event.description}</p>}
                            {event.location && <p className="event-location">📍 {event.location}</p>}
                        </div>
                        <div className="event-actions">
                            <button onClick={() => openEditModal(event)}>✏️</button>
                            <button onClick={() => handleDeleteEvent(event)}>🗑️</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Модальное окно создания */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Новое событие</h3>
                        <form onSubmit={handleCreateEvent}>
                            <label>Название</label>
                            <input
                                type="text"
                                value={formData.summary}
                                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                required
                            />
                            <label>Описание</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                            <label>Начало</label>
                            <input
                                type="datetime-local"
                                value={formData.start}
                                onChange={e => setFormData({ ...formData, start: e.target.value })}
                                required
                            />
                            <label>Конец</label>
                            <input
                                type="datetime-local"
                                value={formData.end}
                                onChange={e => setFormData({ ...formData, end: e.target.value })}
                                required
                            />
                            <label>Место / ссылка</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                            <label>Созвон с другом (опционально)</label>
                            <select
                                value={formData.friendId}
                                onChange={e => setFormData({ ...formData, friendId: e.target.value })}
                            >
                                <option value="">Не выбран</option>
                                {friends.filter(f => f.status === 1).map(f => (
                                    <option key={f.id} value={f.id}>{f.nickname}</option>
                                ))}
                            </select>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)}>Отмена</button>
                                <button type="submit" disabled={loading}>Создать</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования */}
            {showEditModal && selectedEvent && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Редактировать событие</h3>
                        <form onSubmit={handleUpdateEvent}>
                            <label>Название</label>
                            <input
                                type="text"
                                value={formData.summary}
                                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                required
                            />
                            <label>Описание</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                            <label>Начало</label>
                            <input
                                type="datetime-local"
                                value={formData.start}
                                onChange={e => setFormData({ ...formData, start: e.target.value })}
                                required
                            />
                            <label>Конец</label>
                            <input
                                type="datetime-local"
                                value={formData.end}
                                onChange={e => setFormData({ ...formData, end: e.target.value })}
                                required
                            />
                            <label>Место / ссылка</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowEditModal(false)}>Отмена</button>
                                <button type="submit" disabled={loading}>Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;