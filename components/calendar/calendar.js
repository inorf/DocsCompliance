'use client';

import React, { useState, useEffect } from 'react';
import '../styles/Calendar.scss';
import UserProfile from '../../app/session/UserProfile';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // orange
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventModal, setEventModal] = useState({ open: false, date: null, event: null });
  const [plannedEventsModal, setPlannedEventsModal] = useState(false);

  const formatDateKey = (date) => {
    if (!date) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Load events from server when component mounts
  useEffect(() => {
    let mounted = true;
    async function fetchEvents() {
      const email = UserProfile.getEmail();
      if (!email) { if (mounted) setEvents({}); return; }
      try {
        const res = await fetch('/api/calendar-events/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const payload = await res.json();
        if (!payload.success || !Array.isArray(payload.data)) {
          if (mounted) setEvents({});
          return;
        }
        const grouped = {};
        for (const ev of payload.data) {
          const d = new Date(ev.event_date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ id: ev.event_id, name: ev.event_name, description: ev.event_description, color: ev.event_color, ...ev });
        }
        if (mounted) setEvents(grouped);
      } catch (e) {
        if (mounted) setEvents({});
      }
    }
    fetchEvents();
    return () => { mounted = false; };
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Fill remaining cells to make 35 cells (5 rows × 7 columns)
    while (days.length < 35) {
      days.push(null);
    }

    return days;
  };

  const getMonthsInYear = () => {
    const year = currentDate.getFullYear();
    const months = [];
    
    for (let month = 0; month < 12; month++) {
      months.push(new Date(year, month, 1));
    }

    return months;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const navigateYear = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date) => {
    const key = formatDateKey(date);
    return events[key] || [];
  };

  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    const dateEvents = getEventsForDate(date);
    setEventModal({ open: true, date, event: null });
  };

  const handleMonthClick = (monthDate) => {
    setCurrentDate(monthDate);
    setViewMode('month');
  };

  const handleSaveEvent = async (eventData) => {
    const email = UserProfile.getEmail();
    if (!email) return;
    const key = formatDateKey(eventModal.date);
    try {
      if (eventModal.event && eventModal.event.id) {
        // Update
        await fetch('/api/calendar-events/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, event_id: eventModal.event.id, update: { event_name: eventData.name, event_description: eventData.description, event_date: key, event_color: eventData.color } })
        });
      } else {
        // Create
        await fetch('/api/calendar-events/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, event: { event_name: eventData.name, event_description: eventData.description, event_date: key, event_color: eventData.color } })
        });
      }
      // refresh list
      const res = await fetch('/api/calendar-events/list', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      });
      const payload = await res.json();
      if (payload.success && Array.isArray(payload.data)) {
        const grouped = {};
        for (const ev of payload.data) {
          const d = new Date(ev.event_date);
          const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!grouped[k]) grouped[k] = [];
          grouped[k].push({ id: ev.event_id, name: ev.event_name, description: ev.event_description, color: ev.event_color, ...ev });
        }
        setEvents(grouped);
      }
      setEventModal({ open: false, date: null, event: null });
    } catch (e) {
      console.error('save event error', e);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const email = UserProfile.getEmail();
    if (!email) return;
    try {
      await fetch('/api/calendar-events/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, event_id: eventId }) });
      // refresh
      const res = await fetch('/api/calendar-events/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const payload = await res.json();
      if (payload.success && Array.isArray(payload.data)) {
        const grouped = {};
        for (const ev of payload.data) {
          const d = new Date(ev.event_date);
          const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!grouped[k]) grouped[k] = [];
          grouped[k].push({ id: ev.event_id, name: ev.event_name, description: ev.event_description, color: ev.event_color, ...ev });
        }
        setEvents(grouped);
      }
      setEventModal({ open: false, date: null, event: null });
    } catch (e) {
      console.error('delete error', e);
    }
  };

  const handleEventClick = (date, event) => {
    setSelectedDate(date);
    setEventModal({ open: true, date, event });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date) => {
    if (!date) return false;
    return date.getMonth() === currentDate.getMonth() &&
           date.getFullYear() === currentDate.getFullYear();
  };

  // Get all planned events sorted by date
  const getAllPlannedEvents = () => {
    const allEvents = [];
    Object.keys(events).forEach(dateKey => {
      const dateEvents = events[dateKey];
      if (dateEvents && dateEvents.length > 0) {
        const [year, month, day] = dateKey.split('-').map(Number);
        const eventDate = new Date(year, month - 1, day);
        dateEvents.forEach(event => {
          allEvents.push({
            ...event,
            date: eventDate,
            dateKey
          });
        });
      }
    });
    
    // Sort by date (upcoming first)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return allEvents
      .filter(event => event.date >= today)
      .sort((a, b) => a.date - b.date);
  };

  return (
    <div className="calendar">
      <div className="calendar__header">
        <div className="calendar__controls">
          <button onClick={goToToday} className="calendar__button calendar__button--today">
            Today
          </button>
          <div className="calendar__navigation">
            <button 
              onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateYear(-1)}
              className="calendar__button calendar__button--nav"
            >
              ←
            </button>
            <h2 className="calendar__title">
              {viewMode === 'month' 
                ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : currentDate.getFullYear()}
            </h2>
            <button 
              onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateYear(1)}
              className="calendar__button calendar__button--nav"
            >
              →
            </button>
          </div>
        </div>
        <div className="calendar__header-actions">
          <button 
            onClick={() => setPlannedEventsModal(true)}
            className="calendar__button calendar__button--events"
          >
            Planned Events
          </button>
          <button 
            onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
            className="calendar__button calendar__button--toggle"
          >
            {viewMode === 'month' ? 'Year View' : 'Month View'}
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="calendar__month-view">
          <div className="calendar__weekdays">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="calendar__weekday">{day}</div>
            ))}
          </div>
          <div className="calendar__grid">
            {getDaysInMonth(currentDate).map((date, index) => (
              <div
                key={index}
                className={`calendar__day ${!date ? 'calendar__day--empty' : ''} ${!isCurrentMonth(date) ? 'calendar__day--other-month' : ''} ${isToday(date) ? 'calendar__day--today' : ''}`}
                onClick={() => handleDateClick(date)}
              >
                {date && (
                  <>
                    <span className="calendar__day-number">{date.getDate()}</span>
                    <div className="calendar__day-events">
                      {getEventsForDate(date).slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className="calendar__event-dot"
                          style={{ backgroundColor: event.color || COLOR_OPTIONS[0] }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(date, event);
                          }}
                          title={event.name}
                        />
                      ))}
                      {getEventsForDate(date).length > 3 && (
                        <span className="calendar__event-more">+{getEventsForDate(date).length - 3}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="calendar__year-view">
          {getMonthsInYear().map((monthDate, index) => {
            const monthDays = getDaysInMonth(monthDate);
            const monthEvents = monthDays.reduce((acc, day) => {
              if (day) {
                const dayEvents = getEventsForDate(day);
                return acc + dayEvents.length;
              }
              return acc;
            }, 0);

            return (
              <div
                key={index}
                className="calendar__month-card"
                onClick={() => handleMonthClick(monthDate)}
              >
                <h3 className="calendar__month-name">{MONTH_NAMES[index]}</h3>
                <div className="calendar__month-mini-grid">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="calendar__mini-weekday">{day[0]}</div>
                  ))}
                  {monthDays.slice(0, 35).map((date, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`calendar__mini-day ${!date ? 'calendar__mini-day--empty' : ''} ${isToday(date) ? 'calendar__mini-day--today' : ''}`}
                    >
                      {date && date.getDate()}
                    </div>
                  ))}
                </div>
                {monthEvents > 0 && (
                  <div className="calendar__month-events-count">{monthEvents} event{monthEvents !== 1 ? 's' : ''}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {eventModal.open && (
        <EventModal
          date={eventModal.date}
          event={eventModal.event}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={() => setEventModal({ open: false, date: null, event: null })}
          colorOptions={COLOR_OPTIONS}
        />
      )}

      {plannedEventsModal && (
        <PlannedEventsModal
          events={getAllPlannedEvents()}
          onClose={() => setPlannedEventsModal(false)}
          onEventClick={(event) => {
            setPlannedEventsModal(false);
            setEventModal({ open: true, date: event.date, event });
          }}
          onDateClick={(date) => {
            setPlannedEventsModal(false);
            setCurrentDate(date);
            setViewMode('month');
            setEventModal({ open: true, date, event: null });
          }}
        />
      )}
    </div>
  );
}

function EventModal({ date, event, onSave, onDelete, onClose, colorOptions }) {
  const [name, setName] = useState(event?.name || '');
  const [description, setDescription] = useState(event?.description || '');
  const [color, setColor] = useState(event?.color || colorOptions[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      description: description.trim(),
      color
    });
  };

  return (
    <div className="event-modal__overlay" onClick={onClose}>
      <div className="event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal__header">
          <h3>{event ? 'Edit Event' : 'New Event'}</h3>
          <button onClick={onClose} className="event-modal__close">×</button>
        </div>
        
        <div className="event-modal__date">
          {date && `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`}
        </div>

        <form onSubmit={handleSubmit} className="event-modal__form">
          <div className="event-modal__field">
            <label>Event Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter event name"
              required
              autoFocus
            />
          </div>

          <div className="event-modal__field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter event description"
              rows="4"
            />
          </div>

          <div className="event-modal__field">
            <label>Color</label>
            <div className="event-modal__colors">
              {colorOptions.map((col) => (
                <button
                  key={col}
                  type="button"
                  className={`event-modal__color-option ${color === col ? 'event-modal__color-option--selected' : ''}`}
                  style={{ backgroundColor: col }}
                  onClick={() => setColor(col)}
                  title={col}
                />
              ))}
            </div>
          </div>

          <div className="event-modal__actions">
            {event && (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="event-modal__button event-modal__button--delete"
              >
                Delete
              </button>
            )}
            <div className="event-modal__actions-right">
              <button
                type="button"
                onClick={onClose}
                className="event-modal__button event-modal__button--cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="event-modal__button event-modal__button--save"
                disabled={!name.trim()}
              >
                {event ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlannedEventsModal({ events, onClose, onEventClick, onDateClick }) {
  const formatEventDate = (date) => {
    return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getDaysUntil = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`;
    return `In ${Math.floor(diffDays / 30)} months`;
  };

  const groupedEvents = events.reduce((acc, event) => {
    const dateKey = formatEventDate(event.date);
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: event.date,
        events: []
      };
    }
    acc[dateKey].events.push(event);
    return acc;
  }, {});

  return (
    <div className="event-modal__overlay" onClick={onClose}>
      <div className="planned-events-modal" onClick={(e) => e.stopPropagation()}>
        <div className="planned-events-modal__header">
          <h3>Planned Events ({events.length})</h3>
          <button onClick={onClose} className="event-modal__close">×</button>
        </div>
        
        <div className="planned-events-modal__content">
          {events.length === 0 ? (
            <div className="planned-events-modal__empty">
              <p>No upcoming events planned.</p>
              <p className="planned-events-modal__empty-hint">Click on any date to add an event.</p>
            </div>
          ) : (
            <div className="planned-events-modal__list">
              {Object.keys(groupedEvents).map(dateKey => {
                const { date, events: dayEvents } = groupedEvents[dateKey];
                return (
                  <div key={dateKey} className="planned-events-modal__day-group">
                    <div className="planned-events-modal__day-header">
                      <h4>{dateKey}</h4>
                      <span className="planned-events-modal__days-until">{getDaysUntil(date)}</span>
                      <button
                        className="planned-events-modal__add-btn"
                        onClick={() => onDateClick(date)}
                        title="Add event to this date"
                      >
                        +
                      </button>
                    </div>
                    <div className="planned-events-modal__events">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className="planned-events-modal__event"
                          onClick={() => onEventClick(event)}
                        >
                          <div
                            className="planned-events-modal__event-color"
                            style={{ backgroundColor: event.color || COLOR_OPTIONS[0] }}
                          />
                          <div className="planned-events-modal__event-details">
                            <strong>{event.name}</strong>
                            {event.description && (
                              <p>{event.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
