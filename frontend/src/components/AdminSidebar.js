import React from 'react';
import {
  FaTachometerAlt,
  FaSchool,
  FaUsers,
  FaUserGraduate,
  FaUserFriends,
  FaChalkboardTeacher,
  FaUserTie,
  FaChalkboard,
  FaBook,
  FaBuilding,
  FaCalendarAlt,
  FaClipboardCheck,
  FaFileAlt,
  FaPoll,
  FaWallet,
  FaFileInvoiceDollar,
  FaBullhorn,
  FaEnvelope,
  FaBell,
  FaChartBar,
  FaUser,
  FaCog,
  FaBookOpen,
  FaBus
} from 'react-icons/fa';
import './Sidebar.css';
import { useSchoolConfig } from './schoolConfig';

const adminTabs = [
  { key: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { key: 'schools', label: 'School', icon: FaSchool },
  { key: 'users', label: 'Users', icon: FaUsers },
  { key: 'students', label: 'Students', icon: FaUserGraduate },
  { key: 'parents', label: 'Parents', icon: FaUserFriends },
  { key: 'teachers', label: 'Teachers', icon: FaChalkboardTeacher },
  { key: 'staff', label: 'Staff', icon: FaUserTie },
  { key: 'classes', label: 'Classes', icon: FaChalkboard },
  { key: 'subjects', label: 'Subjects', icon: FaBook },
  { key: 'departments', label: 'Departments', icon: FaBuilding },
  { key: 'timetable', label: 'Timetable', icon: FaCalendarAlt },
  { key: 'attendance', label: 'Attendance', icon: FaClipboardCheck },
  { key: 'exams', label: 'Exams', icon: FaFileAlt },
  { key: 'results', label: 'Results', icon: FaPoll },
  { key: 'fees-structure', label: 'Fees Structure', icon: FaWallet },
  { key: 'invoices', label: 'Invoices', icon: FaFileInvoiceDollar },
  { key: 'announcements', label: 'Announcements', icon: FaBullhorn },
  { key: 'events-calendar', label: 'Events & Calendar', icon: FaCalendarAlt },
  { key: 'messages', label: 'Messages', icon: FaEnvelope },
  { key: 'notifications', label: 'Notifications', icon: FaBell },
  { key: 'reports', label: 'Reports', icon: FaChartBar },
  { key: 'library', label: 'Library', icon: FaBookOpen },
  { key: 'transport', label: 'Transport', icon: FaBus },
  { key: 'profile', label: 'Profile', icon: FaUser },
  { key: 'settings', label: 'Settings', icon: FaCog }
];

const AdminSidebar = ({ active = 'dashboard', onSelect = () => {}, onClose = () => {}, open = false }) => {
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
          {adminTabs.map((tab) => {
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

export default AdminSidebar;
