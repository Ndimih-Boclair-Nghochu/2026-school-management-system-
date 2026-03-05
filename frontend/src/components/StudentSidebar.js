import React from 'react';
import {
  FaTachometerAlt,
  FaBookOpen,
  FaTasks,
  FaVideo,
  FaLaptopCode,
  FaCalendarAlt,
  FaClipboardList,
  FaChartBar,
  FaWallet,
  FaBullhorn,
  FaFolderOpen,
  FaUniversity,
  FaEnvelope,
  FaUser
} from 'react-icons/fa';
import './Sidebar.css';

const SCHOOL_NAME = 'EduIgnite School';
const SCHOOL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1b74d3" offset="0"/><stop stop-color="#2e90fa" offset="1"/></linearGradient></defs><rect width="88" height="88" rx="18" fill="url(#g)"/><circle cx="44" cy="44" r="22" fill="#fff" opacity="0.92"/><text x="44" y="50" text-anchor="middle" font-size="22" font-family="Arial" font-weight="700" fill="#1b74d3">EI</text></svg>')}`;

const studentTabs = [
  { key: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { key: 'my-subjects', label: 'My Subjects', icon: FaBookOpen },
  { key: 'assignments', label: 'Assignments', icon: FaTasks },
  { key: 'online-classes', label: 'Online Classes', icon: FaVideo },
  { key: 'online-exams', label: 'Online Exams', icon: FaLaptopCode },
  { key: 'timetable', label: 'Timetable', icon: FaCalendarAlt },
  { key: 'attendance', label: 'Attendance', icon: FaClipboardList },
  { key: 'results', label: 'Results', icon: FaChartBar },
  { key: 'finance', label: 'Finance', icon: FaWallet },
  { key: 'announcements', label: 'Announcements', icon: FaBullhorn },
  { key: 'online-materials', label: 'Online Materials', icon: FaFolderOpen },
  { key: 'library', label: 'Library', icon: FaUniversity },
  { key: 'messages', label: 'Messages', icon: FaEnvelope },
  { key: 'profile', label: 'Profile', icon: FaUser }
];

const StudentSidebar = ({ active = 'dashboard', onSelect = () => {}, onClose = () => {}, open = false }) => {
  const handleClick = (key) => {
    onSelect(key);
    onClose();
  };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="logo">
        <img src={SCHOOL_LOGO} alt="School Logo" className="sidebar-logo-img" />
        <span className="sidebar-logo-text">{SCHOOL_NAME}</span>
      </div>

      <nav className="menu">
        <ul>
          {studentTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <li
                key={tab.key}
                className={active === tab.key ? 'active' : ''}
                onClick={() => handleClick(tab.key)}
              >
                <Icon /> <span>{tab.label}</span>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default StudentSidebar;
