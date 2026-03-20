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
import { useSchoolConfig } from './schoolConfig';

const studentTabs = [
  { key: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { key: 'my-subjects', label: 'My Subjects', icon: FaBookOpen },
  { key: 'assignments', label: 'Assignments', icon: FaTasks },
  // Removed 'online-classes' tab
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
