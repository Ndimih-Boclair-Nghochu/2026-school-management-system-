import React, { useMemo, useState } from 'react';
import './Announcements.css';

const Announcements = ({
  announcements = [],
  activeAnnouncementId = null,
  announcementTitle = '',
  announcementType = 'Important',
  announcementMessage = '',
  onTitleChange = () => {},
  onTypeChange = () => {},
  onMessageChange = () => {},
  onPostAnnouncement = () => {},
  onSelectAnnouncement = () => {},
  onTogglePinned = () => {},
  onDeleteAnnouncement = () => {},
  canCreateAnnouncement = true,
  canManageAnnouncement = true
}) => {
  const [showComposer, setShowComposer] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [viewFilter, setViewFilter] = useState('all');

  const getAnnouncementType = (item, index) => {
    if (item.type) return item.type;
    const title = item.title.toLowerCase();
    if (title.includes('meeting') || item.pinned) return 'Important';
    if (title.includes('trip') || title.includes('fair') || title.includes('event')) return 'Event';
    if (index % 3 === 1) return 'Event';
    if (index % 3 === 2) return 'Notice';
    return 'Important';
  };

  const getBadgeClass = (type) => {
    if (type === 'Important') return 'badge-important';
    if (type === 'Event') return 'badge-event';
    return 'badge-notice';
  };

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.id - a.id;
    });
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    return sortedAnnouncements.filter((item, index) => {
      const type = getAnnouncementType(item, index);
      const matchesFilter = viewFilter === 'all' ? true : type.toLowerCase() === viewFilter;
      const matchesSearch = `${item.title} ${item.message} ${item.date}`
        .toLowerCase()
        .includes(searchText.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [sortedAnnouncements, viewFilter, searchText]);

  const totalPinned = announcements.filter((item) => item.pinned).length;

  const activeAnnouncement = announcements.find((item) => item.id === activeAnnouncementId) || announcements[0];

  return (
    <div className="announcements-page">
      <div className="announcements-hero">
        <h2>📣 Announcements</h2>
        {canCreateAnnouncement && (
          <button
            type="button"
            className="create-announcement-btn"
            onClick={() => setShowComposer((prev) => !prev)}
          >
            {showComposer ? 'Close Composer' : '+ Create Announcement'}
          </button>
        )}
      </div>

      {canCreateAnnouncement && showComposer && (
        <div className="announcements-page-form">
          <input
            type="text"
            value={announcementTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Announcement title"
          />
          <select
            value={announcementType}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="Important">Important</option>
            <option value="Event">Event</option>
            <option value="Notice">Notice</option>
          </select>
          <textarea
            value={announcementMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Write announcement details"
            rows={4}
          />
          <button
            type="button"
            className="post-announcement"
            onClick={() => {
              onPostAnnouncement();
              setShowComposer(false);
            }}
          >
            Publish Announcement
          </button>
        </div>
      )}

      <div className="announcements-stats-grid">
        <article><strong>{announcements.length}</strong><span>Total</span></article>
        <article><strong>{totalPinned}</strong><span>Pinned</span></article>
        <article><strong>{announcements.length - totalPinned}</strong><span>Regular</span></article>
      </div>

      <div className="announcements-toolbar">
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search announcements"
        />
        <select value={viewFilter} onChange={(event) => setViewFilter(event.target.value)}>
          <option value="all">All Types</option>
          <option value="important">Important</option>
          <option value="event">Event</option>
          <option value="notice">Notice</option>
        </select>
      </div>

      <div className="announcements-content-grid">
      <ul className="announcements-page-list">
        {filteredAnnouncements.map((item, index) => {
          const type = getAnnouncementType(item, index);
          return (
          <li key={item.id} className={item.pinned ? 'pinned' : ''}>
            <div className="announcement-title-row">
              <span className={`announcement-badge ${getBadgeClass(type)}`}>{type}</span>
              <strong>{item.title}</strong>
            </div>
            <p>{item.message}</p>
            <div className="announcement-meta-row">
              <div className="posted-meta">
                <span>Posted by: <strong>{item.postedBy || 'Admin'}</strong></span>
                <span>{item.date}</span>
              </div>
              <div className="tag-chips">
                <span className="tag-chip">{type}</span>
                {item.pinned && <span className="tag-chip">Pinned</span>}
              </div>
            </div>
            <div className="announcement-actions-row">
              <button type="button" onClick={() => onSelectAnnouncement(item.id)}>View</button>
              {canManageAnnouncement && (
                <>
                  <button type="button" onClick={() => onTogglePinned(item.id)}>
                    {item.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button type="button" onClick={() => onDeleteAnnouncement(item.id)}>Delete</button>
                </>
              )}
            </div>
          </li>
        );})}
        {filteredAnnouncements.length === 0 && (
          <li className="announcement-empty">No announcements match your filter.</li>
        )}
      </ul>

      {activeAnnouncement && (
        <div className="announcements-page-preview">
          <div className="preview-top-row">
            <h3>{activeAnnouncement.title}</h3>
            <span>{activeAnnouncement.date}</span>
          </div>
          <p>{activeAnnouncement.message}</p>
          <small>Posted by {activeAnnouncement.postedBy || 'Admin'}</small>
        </div>
      )}
      </div>
    </div>
  );
};

export default Announcements;
