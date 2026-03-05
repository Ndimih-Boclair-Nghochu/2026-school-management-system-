import React, { useState } from 'react';
import { FaSearch, FaBell, FaBars } from 'react-icons/fa';
import './HeaderClean.css';

const SCHOOL_NAME = 'EduIgnite International School';
const SCHOOL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1b74d3" offset="0"/><stop stop-color="#2e90fa" offset="1"/></linearGradient></defs><rect width="88" height="88" rx="18" fill="url(#g)"/><circle cx="44" cy="44" r="22" fill="#fff" opacity="0.92"/><text x="44" y="50" text-anchor="middle" font-size="22" font-family="Arial" font-weight="700" fill="#1b74d3">EI</text></svg>')}`;

const Header = ({
  onToggleMenu,
  onLogout = () => {},
  profile,
  notificationCount = 0,
  notifications = [],
  onNotificationSelect = () => {},
  onMarkAllNotificationsRead = () => {},
  onViewAllNotifications = () => {}
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleMenu} aria-label="Toggle menu">
          <FaBars />
        </button>
        <div className="school-brand">
          <img src={SCHOOL_LOGO} alt="School Logo" className="school-brand-logo" />
          <h2>{SCHOOL_NAME}</h2>
        </div>
      </div>
      <div className="header-right">
        <FaSearch className="icon" />
        <div className="notification">
          <button
            type="button"
            className="notification-trigger"
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            aria-label="Notifications"
          >
            <FaBell className="icon" />
            {notificationCount > 0 && <span className="badge">{notificationCount}</span>}
          </button>

          {isNotificationOpen && (
            <div className="notification-menu">
              <div className="notification-menu-head">
                <strong>Notifications</strong>
                <button type="button" onClick={onMarkAllNotificationsRead}>Mark all read</button>
              </div>
              <ul>
                {notifications.length === 0 && <li className="empty">No notifications</li>}
                {notifications.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={item.unread ? 'unread' : ''}
                      onClick={() => {
                        onNotificationSelect(item.id);
                        setIsNotificationOpen(false);
                      }}
                    >
                      <span>{item.title}</span>
                      <small>{item.date}</small>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="view-all-notifications"
                onClick={() => {
                  onViewAllNotifications();
                  setIsNotificationOpen(false);
                }}
              >
                View all announcements
              </button>
            </div>
          )}
        </div>
        <div className="profile">
          <img
            src={profile?.avatar || 'https://via.placeholder.com/32'}
            alt="Profile"
            className="avatar"
          />
          <span className="name">{profile?.name || 'Teacher'}</span>
        </div>
        <button type="button" className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;