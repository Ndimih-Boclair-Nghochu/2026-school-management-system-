import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MyClasses from './MyClasses';
import ClassAttendance from './ClassAttendance';
import Attendance from './Attendance';
import Exams from './Exams';
import OnlineExam from './OnlineExam';
import Assignments from './Assignments';
import OnlineClasses from './OnlineClasses';
import Materials from './Materials';
import Library from './Library';
import Messages from './Messages';
import Calendar from './Calendar';
import Announcements from './Announcements';
import EditProfile from './EditProfile';
import { FaThList, FaPen, FaCalendarAlt, FaEnvelope } from 'react-icons/fa';
import './TeacherDashboard.css';
import { getAcademicTermStructure, useSchoolConfig } from './schoolConfig';
import { getPersonalTimetable, TIMETABLE_UPDATED_EVENT } from './timetableData';

const TeacherDashboard = ({ profile, onSaveProfile = () => {}, onLogout = () => {} }) => {
  const schoolConfig = useSchoolConfig();
  const academicStructure = useMemo(() => getAcademicTermStructure(schoolConfig), [schoolConfig]);
  const initialAnnouncements = [
    {
      id: 1,
      title: 'Parent-Teacher Meeting',
      message: 'Reminder: Grade 5 parent-teacher meeting is scheduled for April 25, 5:00 PM.',
      date: '2026-04-25',
      type: 'Important',
      postedBy: 'Mr. Johnson',
      pinned: true
    },
    {
      id: 2,
      title: 'Upcoming Science Fair',
      message: 'The annual Science Fair will be held on May 5th. Prepare your projects!',
      date: '2026-05-05',
      type: 'Event',
      postedBy: 'Ms. Smith',
      pinned: false
    }
  ];

  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementType, setAnnouncementType] = useState('Important');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [activeAnnouncementId, setActiveAnnouncementId] = useState(null);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [personalTimetable, setPersonalTimetable] = useState(() => getPersonalTimetable({
    name: profile?.name,
    role: 'Teacher'
  }));

  const subjectPerformanceData = [
    { subject: 'Mathematics', average: 13.6 },
    { subject: 'Science', average: 14.2 },
    { subject: 'English', average: 12.4 },
    { subject: 'History', average: 11.8 }
  ];

  const sequenceTrendData = useMemo(() => {
    const defaults = [11.9, 12.6, 13.1, 13.8, 14.2, 13.5, 14.0, 14.4];
    const rows = [];

    academicStructure.forEach((term) => {
      term.sequences.forEach((sequence) => {
        rows.push({
          label: `${term.name} / ${sequence.replace('Sequence ', 'Seq ')}`,
          value: defaults[rows.length % defaults.length]
        });
      });
    });

    return rows.slice(0, 8);
  }, [academicStructure]);

  const supportStudents = [
    { id: 1, name: 'Student 6', className: 'Grade 5', subject: 'English', score: 8.2 },
    { id: 2, name: 'Student 13', className: 'Grade 4', subject: 'Mathematics', score: 7.5 },
    { id: 3, name: 'Student 18', className: 'Grade 6', subject: 'History', score: 8.8 }
  ];

  const handleManageClass = (classData) => {
    setSelectedClass(classData);
    setActiveView('class-attendance');
  };

  const visibleAnnouncements = showAllAnnouncements ? announcements : announcements.slice(0, 2);
  const activeAnnouncement = announcements.find((item) => item.id === activeAnnouncementId);

  const postAnnouncement = () => {
    const title = announcementTitle.trim();
    const message = announcementMessage.trim();

    if (!title || !message) {
      alert('Please enter both announcement title and message.');
      return;
    }

    const newAnnouncement = {
      id: Date.now(),
      title,
      message,
      date: new Date().toISOString().slice(0, 10),
      type: announcementType,
      postedBy: 'John Smith',
      pinned: false
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);
    setAnnouncementTitle('');
    setAnnouncementType('Important');
    setAnnouncementMessage('');
    setActiveAnnouncementId(newAnnouncement.id);
  };

  const togglePinnedAnnouncement = (id) => {
    setAnnouncements((prev) => prev.map((item) => (
      item.id === id ? { ...item, pinned: !item.pinned } : item
    )));
  };

  const deleteAnnouncement = (id) => {
    setAnnouncements((prev) => prev.filter((item) => item.id !== id));
    setActiveAnnouncementId((prev) => (prev === id ? null : prev));
    setReadNotificationIds((prev) => prev.filter((notificationId) => notificationId !== id));
  };

  const notificationItems = announcements.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    unread: !readNotificationIds.includes(item.id)
  }));

  const unreadNotificationCount = notificationItems.filter((item) => item.unread).length;

  useEffect(() => {
    setPersonalTimetable(getPersonalTimetable({
      name: profile?.name,
      role: 'Teacher'
    }));
  }, [profile?.name]);

  useEffect(() => {
    const syncTimetable = () => {
      setPersonalTimetable(getPersonalTimetable({
        name: profile?.name,
        role: 'Teacher'
      }));
    };

    window.addEventListener(TIMETABLE_UPDATED_EVENT, syncTimetable);
    window.addEventListener('storage', syncTimetable);

    return () => {
      window.removeEventListener(TIMETABLE_UPDATED_EVENT, syncTimetable);
      window.removeEventListener('storage', syncTimetable);
    };
  }, [profile?.name]);

  const handleNotificationSelect = (notificationId) => {
    setReadNotificationIds((prev) => (
      prev.includes(notificationId) ? prev : [...prev, notificationId]
    ));
    setActiveAnnouncementId(notificationId);
    setActiveView('announcements');
  };

  const markAllNotificationsAsRead = () => {
    setReadNotificationIds(announcements.map((item) => item.id));
  };

  const handleSidebarSelect = (viewKey) => {
    setActiveView(viewKey);
    setSidebarOpen(false);
  };

  const renderMain = () => {
    switch (activeView) {
      case 'my-classes':
        return <MyClasses onManageClass={handleManageClass} />;
      case 'class-attendance':
        return selectedClass ? <ClassAttendance selectedClass={selectedClass} /> : <Attendance />;
      case 'attendance':
        return <Attendance />;
      case 'exams':
        return <Exams />;
      case 'online-exam':
        return <OnlineExam />;
      case 'assignments':
        return <Assignments />;
      case 'online-classes':
        return <OnlineClasses />;
      case 'materials':
        return <Materials />;
      case 'library':
        return <Library />;
      case 'messages':
        return <Messages />;
      case 'calendar':
        return <Calendar />;
      case 'announcements':
        return (
          <Announcements
            announcements={announcements}
            activeAnnouncementId={activeAnnouncementId}
            announcementTitle={announcementTitle}
            announcementType={announcementType}
            announcementMessage={announcementMessage}
            onTitleChange={setAnnouncementTitle}
            onTypeChange={setAnnouncementType}
            onMessageChange={setAnnouncementMessage}
            onPostAnnouncement={postAnnouncement}
            onSelectAnnouncement={setActiveAnnouncementId}
            onTogglePinned={togglePinnedAnnouncement}
            onDeleteAnnouncement={deleteAnnouncement}
          />
        );
      case 'edit-profile':
        return <EditProfile profile={profile} onSaveProfile={onSaveProfile} />;
      default:
        // dashboard view (existing content)
        return (
          <>
            <section className="welcome">
          <div className="welcome-text">
            <h1>Welcome, John Smith!</h1>
            <p>Grade 5 Math Teacher</p>
          </div>
          <img
            className="welcome-avatar"
            src="https://via.placeholder.com/64"
            alt="John Smith"
          />
        </section>

        <section className="stats-cards">
          <div className="card" onClick={() => setActiveView('my-classes')}>
            <div className="card-icon"><FaThList /></div>
            <div>
              <h3>6 My Classes</h3>
              <p>Grade 4 - Grade 8</p>
            </div>
          </div>
          <div className="card" onClick={() => setActiveView('exams')}>
            <div className="card-icon"><FaPen /></div>
            <div>
              <h3>35 Exams to Grade</h3>
              <p>5 Due Soon</p>
            </div>
          </div>
          <div className="card" onClick={() => setActiveView('online-classes')}>
            <div className="card-icon"><FaCalendarAlt /></div>
            <div>
              <h3>2 Upcoming Classes</h3>
              <p>Today at 10:00 AM</p>
            </div>
          </div>
          <div className="card" onClick={() => setActiveView('messages')}>
            <div className="card-icon"><FaEnvelope /></div>
            <div>
              <h3>8 New Messages</h3>
              <p>2 from Parents</p>
            </div>
          </div>
        </section>

        <section className="analytics-section">
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="section-header">
                <h2>Subject Performance</h2>
              </div>
              <div className="chart-list">
                {subjectPerformanceData.map((item) => (
                  <div key={item.subject} className="chart-row">
                    <div className="chart-row-top">
                      <span>{item.subject}</span>
                      <strong>{item.average}/20</strong>
                    </div>
                    <div className="chart-track">
                      <div className="chart-fill" style={{ width: `${(item.average / 20) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-card">
              <div className="section-header">
                <h2>Sequence Trend</h2>
              </div>
              <div className="trend-grid">
                {sequenceTrendData.map((point, index) => (
                  <div key={point.label} className="trend-point">
                    <div className="trend-bar-wrap">
                      <div className="trend-bar" style={{ height: `${(point.value / 20) * 120}px` }} />
                    </div>
                    <strong>{point.value}</strong>
                    <span>{point.label}</span>
                    {index < sequenceTrendData.length - 1 && <div className="trend-line" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="analytics-card support-card">
            <div className="section-header">
              <h2>Students Needing Support</h2>
            </div>
            <ul className="support-list">
              {supportStudents.map((student) => (
                <li key={student.id}>
                  <div>
                    <strong>{student.name}</strong>
                    <p>{student.className} • {student.subject}</p>
                  </div>
                  <div className="support-actions">
                    <span>{student.score}/20</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleManageClass({
                          id: student.id,
                          title: student.className,
                          students: 35,
                          sub: `${student.className} ${student.subject}`
                        })
                      }
                    >
                      Open Class
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="classes-section">
          <div className="section-header">
            <h2>My Classes</h2>
            <button
              type="button"
              className="view-all"
              onClick={() => setActiveView('my-classes')}
            >
              View All Classes &gt;
            </button>
          </div>
          <div className="class-cards">
            <div className="class-card">
              <h3>Grade 4</h3>
              <p>37 students</p>
              <span>Grade 4 Science</span>
              <p>33 Students</p>
              <button onClick={() => handleManageClass({ id: 101, title: 'Grade 4', students: 37, sub: 'Grade 4 Science' })}>Manage</button>
            </div>
            <div className="class-card">
              <h3>Math</h3>
              <p>39 students</p>
              <span>Grade 5 Math</span>
              <p>27 Students</p>
              <button onClick={() => handleManageClass({ id: 102, title: 'Grade 5', students: 39, sub: 'Grade 5 Math' })}>Manage</button>
            </div>
            <div className="class-card">
              <h3>Grade 6</h3>
              <p>36 students</p>
              <span>Grade 6 English</span>
              <p>33 Students</p>
              <button onClick={() => handleManageClass({ id: 103, title: 'Grade 6', students: 36, sub: 'Grade 6 English' })}>Manage</button>
            </div>
          </div>
        </section>

        <section className="upcoming-events">
          <h2>My Timetable</h2>
          <ul>
            {personalTimetable.slice(0, 4).map((item) => (
              <li key={item.id}>
                <span className="time">{item.day} • {item.period}</span>
                <span className="event-name">{item.activity || '-'}</span>
                <button className="join" onClick={() => setActiveView('calendar')}>View</button>
              </li>
            ))}
            {!personalTimetable.length && (
              <li>
                <span className="time">No Schedule</span>
                <span className="event-name">No personal timetable assigned yet.</span>
                <button className="join" onClick={() => setActiveView('calendar')}>Open Calendar</button>
              </li>
            )}
          </ul>
          <div className="mini-calendar">
            {/* placeholder calendar */}
            <p>April 2024</p>
            <div className="days">Sun Mon Tue Wed Thu Fri Sat</div>
          </div>
        </section>
      </>
        );
    }
  };

  const titleMap = {
    'dashboard': 'Dashboard',
    'my-classes': 'My Classes',
    'class-attendance': selectedClass ? `${selectedClass.sub} - Attendance` : 'Class Attendance',
    'attendance': 'Attendance',
    'exams': 'Exams',
    'online-exam': 'Online Exam',
    'assignments': 'Assignments',
    'online-classes': 'Online Classes',
    'materials': 'Materials',
    'library': 'Library',
    'messages': 'Messages',
    'calendar': 'Calendar',
    'announcements': 'Announcements'
  };

  const showRightColumn = activeView === 'dashboard';

  return (
    <div className="dashboard-container">
      <Sidebar
        active={activeView}
        onSelect={handleSidebarSelect}
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}
      />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
      <Header
        title={titleMap[activeView] || 'Dashboard'}
        onToggleMenu={() => setSidebarOpen(s => !s)}
        onLogout={onLogout}
        profile={profile}
        notificationCount={unreadNotificationCount}
        notifications={notificationItems}
        onNotificationSelect={handleNotificationSelect}
        onMarkAllNotificationsRead={markAllNotificationsAsRead}
        onViewAllNotifications={() => setActiveView('announcements')}
      />
      <main className="dashboard-main">
        <div className="left-content">
          {renderMain()}
        </div>

        {showRightColumn && <aside className="right-column">
          <section className="announcements">
            <div className="section-header">
              <h2>Announcements</h2>
              <button
                type="button"
                className="view-all"
                onClick={() => setShowAllAnnouncements((prev) => !prev)}
              >
                {showAllAnnouncements ? 'Show Less' : 'View All >'}
              </button>
            </div>

            <div className="announcement-form">
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Announcement title"
              />
              <textarea
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Write announcement details"
                rows={3}
              />
              <button type="button" className="post-announcement" onClick={postAnnouncement}>
                Post Announcement
              </button>
            </div>

            <ul className="announcement-list">
              {visibleAnnouncements.map((item) => (
                <li key={item.id} className={item.pinned ? 'pinned' : ''}>
                  <div className="announcement-top">
                    <strong>{item.title}</strong>
                    <span>{item.date}</span>
                  </div>
                  <p>{item.message}</p>
                  <div className="announcement-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAnnouncementId(item.id);
                        setActiveView('announcements');
                      }}
                    >
                      View
                    </button>
                    <button type="button" onClick={() => togglePinnedAnnouncement(item.id)}>
                      {item.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button type="button" onClick={() => deleteAnnouncement(item.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>

            {activeAnnouncement && (
              <div className="announcement-preview">
                <h3>{activeAnnouncement.title}</h3>
                <p>{activeAnnouncement.message}</p>
                <small>{activeAnnouncement.date}</small>
              </div>
            )}
          </section>

          <section className="quick-links">
            <div className="section-header">
              <h2>Quick Links</h2>
              <button
                type="button"
                className="view-all"
                onClick={() => setActiveView('dashboard')}
              >
                View All &gt;
              </button>
            </div>
            <ul>
              <li onClick={() => setActiveView('exams')}>Grade Exams</li>
              <li onClick={() => setActiveView('online-classes')}>Start Online Class</li>
              <li onClick={() => setActiveView('announcements')}>Post Announcement</li>
            </ul>
          </section>

          <section className="recent-messages">
            <div className="section-header">
              <h2>Recent Messages</h2>
            </div>
            <div className="message-item">
              <img src="https://via.placeholder.com/40" alt="Amelia Clark" />
              <div className="message-text">
                <strong>Amelia Clark</strong>
                <p>Thank you for the homework feedback.</p>
              </div>
              <span className="time">1h</span>
            </div>
          </section>
        </aside>}

      </main>

      <footer className="dashboard-footer">
        <a
          href="https://www.youtube.com/results?search_query=how+to+use+teacher+dashboard"
          target="_blank"
          rel="noreferrer"
        >
          Learn how to use your dashboard
        </a>
        <button
          type="button"
          onClick={() => window.open('mailto:support@eduignite.edu?subject=Teacher%20Dashboard%20Support', '_blank')}
        >
          Support
        </button>
      </footer>
    </div>
  );
};

export default TeacherDashboard;