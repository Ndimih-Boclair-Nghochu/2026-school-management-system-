import React, { useEffect, useState } from 'react';
import { FaSearch, FaBell, FaBars } from 'react-icons/fa';
import './HeaderClean.css';
import { useSchoolConfig } from './schoolConfig';

const LANGUAGE_STORAGE_KEY = 'eduignite.language';

const headerTexts = {
  en: {
    notifications: 'Notifications',
    markAllRead: 'Mark all read',
    noNotifications: 'No notifications',
    viewAllAnnouncements: 'View all announcements',
    logout: 'Logout',
    languageToggle: 'FR'
  },
  fr: {
    notifications: 'Notifications',
    markAllRead: 'Tout marquer lu',
    noNotifications: 'Aucune notification',
    viewAllAnnouncements: 'Voir toutes les annonces',
    logout: 'Déconnexion',
    languageToggle: 'EN'
  }
};

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
  const schoolConfig = useSchoolConfig();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved === 'fr' ? 'fr' : 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const text = headerTexts[language] || headerTexts.en;

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleMenu} aria-label="Toggle menu">
          <FaBars />
        </button>
        <div className="school-brand">
          <img src={schoolConfig.logoUrl} alt="School Logo" className="school-brand-logo" />
          <h2>{schoolConfig.schoolName}</h2>
        </div>
      </div>
      <div className="header-right">
        <button
          type="button"
          className="language-toggle"
          onClick={() => setLanguage((prev) => (prev === 'en' ? 'fr' : 'en'))}
          aria-label={language === 'en' ? 'Switch to French' : 'Passer en anglais'}
          title={language === 'en' ? 'Switch to French' : 'Passer en anglais'}
        >
          {text.languageToggle}
        </button>
        <FaSearch className="icon" />
        <div className="notification">
          <button
            type="button"
            className="notification-trigger"
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            aria-label={text.notifications}
          >
            <FaBell className="icon" />
            {notificationCount > 0 && <span className="badge">{notificationCount}</span>}
          </button>

          {isNotificationOpen && (
            <div className="notification-menu">
              <div className="notification-menu-head">
                <strong>{text.notifications}</strong>
                <button type="button" onClick={onMarkAllNotificationsRead}>{text.markAllRead}</button>
              </div>
              <ul>
                {notifications.length === 0 && <li className="empty">{text.noNotifications}</li>}
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
                {text.viewAllAnnouncements}
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
        <button type="button" className="logout-btn" onClick={onLogout}>{text.logout}</button>
      </div>
    </header>
  );
};

export default Header;