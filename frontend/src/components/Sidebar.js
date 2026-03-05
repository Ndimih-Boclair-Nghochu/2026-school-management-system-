import React from 'react';
import { FaTachometerAlt, FaChalkboardTeacher, FaClipboardList, FaFileAlt, FaVideo, FaBook, FaBookOpen, FaEnvelope, FaCalendarAlt, FaBullhorn, FaLaptopCode, FaUserEdit } from 'react-icons/fa';
import './Sidebar.css';

const SCHOOL_NAME = 'EduIgnite School';
const SCHOOL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1b74d3" offset="0"/><stop stop-color="#2e90fa" offset="1"/></linearGradient></defs><rect width="88" height="88" rx="18" fill="url(#g)"/><circle cx="44" cy="44" r="22" fill="#fff" opacity="0.92"/><text x="44" y="50" text-anchor="middle" font-size="22" font-family="Arial" font-weight="700" fill="#1b74d3">EI</text></svg>')}`;

const Sidebar = ({ active = 'dashboard', onSelect = () => {}, onClose = () => {}, open }) => {
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
          <li
            className={active === 'dashboard' ? 'active' : ''}
            onClick={() => handleClick('dashboard')}
          >
            <FaTachometerAlt /> <span>Dashboard</span>
          </li>
          <li
            className={active === 'my-classes' ? 'active' : ''}
            onClick={() => handleClick('my-classes')}
          >
            <FaChalkboardTeacher /> <span>My Classes</span>
          </li>
          <li
            className={active === 'attendance' ? 'active' : ''}
            onClick={() => handleClick('attendance')}
          >
            <FaClipboardList /> <span>Attendance</span>
          </li>
          <li
            className={active === 'exams' ? 'active' : ''}
            onClick={() => handleClick('exams')}
          >
            <FaFileAlt /> <span>Exams</span>
          </li>
          <li
            className={active === 'online-exam' ? 'active' : ''}
            onClick={() => handleClick('online-exam')}
          >
            <FaLaptopCode /> <span>Online Exam</span>
          </li>
          <li
            className={active === 'assignments' ? 'active' : ''}
            onClick={() => handleClick('assignments')}
          >
            <FaFileAlt /> <span>Assignments</span>
          </li>
          <li
            className={active === 'online-classes' ? 'active' : ''}
            onClick={() => handleClick('online-classes')}
          >
            <FaVideo /> <span>Online Classes</span>
          </li>
          <li
            className={active === 'materials' ? 'active' : ''}
            onClick={() => handleClick('materials')}
          >
            <FaBook /> <span>Materials</span>
          </li>
          <li
            className={active === 'library' ? 'active' : ''}
            onClick={() => handleClick('library')}
          >
            <FaBookOpen /> <span>Library</span>
          </li>
          <li
            className={active === 'messages' ? 'active' : ''}
            onClick={() => handleClick('messages')}
          >
            <FaEnvelope /> <span>Messages</span>
          </li>
          <li
            className={active === 'announcements' ? 'active' : ''}
            onClick={() => handleClick('announcements')}
          >
            <FaBullhorn /> <span>Announcements</span>
          </li>
          <li
            className={active === 'calendar' ? 'active' : ''}
            onClick={() => handleClick('calendar')}
          >
            <FaCalendarAlt /> <span>Calendar</span>
          </li>
          <li
            className={active === 'edit-profile' ? 'active' : ''}
            onClick={() => handleClick('edit-profile')}
          >
            <FaUserEdit /> <span>Edit Profile</span>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;