import React, { useMemo, useState } from 'react';
import './Calendar.css';

const CATEGORY_OPTIONS = ['All', 'Academic', 'Exam', 'Meeting', 'Sports', 'Holiday', 'Administration'];

const initialEvents = [
  {
    id: 1,
    title: 'Term 2 Sequence 2 Examination Starts',
    category: 'Exam',
    date: '2026-03-16',
    startTime: '08:30',
    endTime: '12:00',
    location: 'Main Hall',
    audience: 'All Classes',
    organizer: 'Examination Board',
    description: 'Opening session for sequence 2 examinations.'
  },
  {
    id: 2,
    title: 'Parent-Teacher Consultation',
    category: 'Meeting',
    date: '2026-03-12',
    startTime: '14:00',
    endTime: '17:00',
    location: 'Conference Room A',
    audience: 'Parents & Teachers',
    organizer: 'School Administration',
    description: 'Mid-term progress consultation and guidance.'
  },
  {
    id: 3,
    title: 'Inter-House Football Competition',
    category: 'Sports',
    date: '2026-03-21',
    startTime: '09:00',
    endTime: '13:00',
    location: 'School Field',
    audience: 'Students',
    organizer: 'Sports Department',
    description: 'Semi-final and final matches across houses.'
  },
  {
    id: 4,
    title: 'Staff Training: Digital Assessment',
    category: 'Administration',
    date: '2026-03-08',
    startTime: '10:00',
    endTime: '12:30',
    location: 'ICT Lab',
    audience: 'Teaching Staff',
    organizer: 'Academic Directorate',
    description: 'Hands-on training for online grading workflows.'
  },
  {
    id: 5,
    title: 'Public Holiday - Youth Day',
    category: 'Holiday',
    date: '2026-03-11',
    startTime: '00:00',
    endTime: '23:59',
    location: 'National',
    audience: 'School Wide',
    organizer: 'Government',
    description: 'Official public holiday. No classes.'
  },
  {
    id: 6,
    title: 'Grade 5 Mathematics Remedial Class',
    category: 'Academic',
    date: '2026-03-19',
    startTime: '15:00',
    endTime: '16:30',
    location: 'Room M-05',
    audience: 'Grade 5',
    organizer: 'Math Department',
    description: 'Support session for weak-performing learners.'
  }
];

const formatDateLabel = (isoDate) => new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
});

const getMonthLabel = (date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

const toISODate = (date) => {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const isSameDay = (a, b) => a === b;

const getWeekRange = (baseDate) => {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: toISODate(start), end: toISODate(end) };
};

const Calendar = () => {
  const todayIso = toISODate(new Date());
  const [events] = useState(initialEvents);
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayIso);

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((event) => {
        const categoryOk = categoryFilter === 'All' || event.category === categoryFilter;
        const queryOk = !q
          || event.title.toLowerCase().includes(q)
          || event.location.toLowerCase().includes(q)
          || event.organizer.toLowerCase().includes(q)
          || event.audience.toLowerCase().includes(q);
        return categoryOk && queryOk;
      })
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [events, categoryFilter, search]);

  const monthDays = useMemo(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startDay; i += 1) days.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      days.push(toISODate(date));
    }
    return days;
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    filteredEvents.forEach((event) => {
      if (!map.has(event.date)) map.set(event.date, []);
      map.get(event.date).push(event);
    });
    return map;
  }, [filteredEvents]);

  const selectedDateEvents = eventsByDate.get(selectedDate) || [];
  const upcomingEvents = filteredEvents.filter((event) => event.date >= todayIso).slice(0, 6);
  const thisWeek = getWeekRange(new Date());
  const thisWeekCount = events.filter((event) => event.date >= thisWeek.start && event.date <= thisWeek.end).length;
  const thisMonthCount = events.filter((event) => {
    const d = new Date(`${event.date}T00:00:00`);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  }).length;

  const moveMonth = (delta) => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
    setCurrentMonth(next);
  };

  const categoryClass = (category) => category.toLowerCase();

  return (
    <div className="calendar-root">
      <div className="calendar-header">
        <div>
          <h2>School Calendar</h2>
          <p>Track all school activities, assessments, meetings, events and holidays from one place.</p>
        </div>
        <div className="calendar-kpis">
          <span><strong>{events.length}</strong> Total Activities</span>
          <span><strong>{thisWeekCount}</strong> This Week</span>
          <span><strong>{thisMonthCount}</strong> This Month</span>
        </div>
      </div>

      <div className="calendar-tools">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, organizer, location or audience..."
        />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          {CATEGORY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
        </select>
      </div>

      <div className="admin-only-note">
        Activities are managed by the school administrator. Teachers and other users can only view the calendar.
      </div>

      <div className="calendar-layout">
        <section className="calendar-card main-calendar">
          <div className="month-head">
            <button type="button" onClick={() => moveMonth(-1)}>Previous</button>
            <h3>{getMonthLabel(currentMonth)}</h3>
            <button type="button" onClick={() => moveMonth(1)}>Next</button>
          </div>

          <div className="weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="days-grid">
            {monthDays.map((iso, index) => {
              if (!iso) return <div key={`blank-${index}`} className="day-cell blank" />;
              const dayEvents = eventsByDate.get(iso) || [];
              return (
                <button
                  type="button"
                  key={iso}
                  className={`day-cell ${isSameDay(iso, selectedDate) ? 'selected' : ''} ${isSameDay(iso, todayIso) ? 'today' : ''}`}
                  onClick={() => setSelectedDate(iso)}
                >
                  <strong>{new Date(`${iso}T00:00:00`).getDate()}</strong>
                  {dayEvents.length > 0 && <span className="event-count">{dayEvents.length} activity</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="calendar-card event-panel">
          <h3>Activities • {formatDateLabel(selectedDate)}</h3>
          <div className="event-list">
            {selectedDateEvents.map((event) => (
              <article key={event.id} className="event-item">
                <div className="event-top">
                  <span className={`event-tag ${categoryClass(event.category)}`}>{event.category}</span>
                  <span className="managed-by">Admin Managed</span>
                </div>
                <h4>{event.title}</h4>
                <p>{event.description}</p>
                <div className="event-meta">
                  <span>{event.startTime} - {event.endTime}</span>
                  <span>{event.location}</span>
                  <span>{event.audience}</span>
                  <span>{event.organizer}</span>
                </div>
              </article>
            ))}
            {selectedDateEvents.length === 0 && <p className="empty">No activities scheduled for this date.</p>}
          </div>
        </section>
      </div>

      <section className="calendar-card upcoming-card">
        <h3>Upcoming Activities</h3>
        <ul>
          {upcomingEvents.map((event) => (
            <li key={event.id}>
              <div>
                <strong>{event.title}</strong>
                <p>{event.location} • {event.startTime} - {event.endTime}</p>
              </div>
              <div className="upcoming-meta">
                <span>{formatDateLabel(event.date)}</span>
                <small className={`event-tag ${categoryClass(event.category)}`}>{event.category}</small>
              </div>
            </li>
          ))}
          {upcomingEvents.length === 0 && <li className="empty">No upcoming activities.</li>}
        </ul>
      </section>
    </div>
  );
};

export default Calendar;
