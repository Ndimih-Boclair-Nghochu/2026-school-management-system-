import React from 'react';
import { FaTachometerAlt, FaChalkboardTeacher, FaClipboardList, FaFileAlt, FaVideo, FaBook, FaBookOpen, FaEnvelope, FaCalendarAlt, FaBullhorn, FaLaptopCode, FaUserEdit } from 'react-icons/fa';
import './Sidebar.css';
import { useSchoolConfig } from './schoolConfig';

const Sidebar = ({ active = 'dashboard', onSelect = () => {}, onClose = () => {}, open }) => {
  const schoolConfig = useSchoolConfig();
  const handleClick = (key) => {
    onSelect(key);
    onClose();
  };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="logo">
        <img src={schoolConfig.logoUrl} alt="School Logo" className="sidebar-logo-img" />
        <span className="sidebar-logo-text">{schoolConfig.schoolName}</span>
      </div>
      <nav className="menu">
        <ul>
          <li
            className={active === 'ai-assistant' ? 'active' : ''}
            onClick={() => handleClick('ai-assistant')}
          >
            <FaBookOpen /> <span>AI Assistant</span>
          </li>
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