import React from 'react';
import {
  FaTachometerAlt,
  FaSchool,
  FaUserShield,
  FaUsers,
  FaKey,
  FaUniversity,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUserFriends,
  FaBuilding,
  FaBook,
  FaClipboardCheck,
  FaFileAlt,
  FaFileInvoiceDollar,
  FaBullhorn,
  FaEnvelope,
  FaChartBar,
  FaCog,
  FaIdBadge,
  FaMobileAlt,
  FaDatabase,
  FaHistory,
  FaLock,
  FaPlug,
  FaLifeRing,
  FaSyncAlt,
  FaSignOutAlt
} from 'react-icons/fa';
import './Sidebar.css';
import { useSchoolConfig } from './schoolConfig';

const superAdminTabs = [
  { key: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { key: 'schools', label: 'Schools / Institutions', icon: FaSchool },
  { key: 'admin-management', label: 'Admin Management', icon: FaUserShield },
  { key: 'user-management', label: 'User Management', icon: FaUsers },
  { key: 'roles-permissions', label: 'Roles & Permissions', icon: FaKey },
  { key: 'academic-management', label: 'Academic Management', icon: FaUniversity },
  { key: 'students-management', label: 'Students Management', icon: FaUserGraduate },
  { key: 'teachers-management', label: 'Teachers Management', icon: FaChalkboardTeacher },
  { key: 'parents-management', label: 'Parents Management', icon: FaUserFriends },
  { key: 'classes-departments', label: 'Classes & Departments', icon: FaBuilding },
  { key: 'subjects', label: 'Subjects', icon: FaBook },
  { key: 'attendance-management', label: 'Attendance Management', icon: FaClipboardCheck },
  { key: 'exams-results', label: 'Exams & Results', icon: FaFileAlt },
  { key: 'fees-finance-management', label: 'Fees / Finance Management', icon: FaFileInvoiceDollar },
  { key: 'announcements', label: 'Announcements', icon: FaBullhorn },
  { key: 'messages-communication', label: 'Messages / Communication', icon: FaEnvelope },
  { key: 'reports-analytics', label: 'Reports & Analytics', icon: FaChartBar },
  { key: 'system-settings', label: 'System Settings', icon: FaCog },
  { key: 'subscription-license-management', label: 'Subscription / License Management', icon: FaIdBadge },
  { key: 'app-management', label: 'App Management (Mobile & Desktop Versions)', icon: FaMobileAlt },
  { key: 'backup-restore', label: 'Backup & Restore', icon: FaDatabase },
  { key: 'activity-logs', label: 'Activity Logs', icon: FaHistory },
  { key: 'security-settings', label: 'Security Settings', icon: FaLock },
  { key: 'api-integrations', label: 'API Integrations', icon: FaPlug },
  { key: 'help-support', label: 'Help & Support', icon: FaLifeRing },
  { key: 'system-updates', label: 'System Updates', icon: FaSyncAlt },
  { key: 'logout', label: 'Logout', icon: FaSignOutAlt }
];

const SuperAdminSidebar = ({ active = 'dashboard', onSelect = () => {}, onClose = () => {}, open = false }) => {
  const schoolConfig = useSchoolConfig();

  const handleClick = (key) => {
    onSelect(key);
    onClose();
  };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="logo">
        <img src={schoolConfig.logoUrl} alt="School Logo" className="sidebar-logo-img" />
        <span className="sidebar-logo-text">Founder Control</span>
      </div>

      <nav className="menu">
        <ul>
          {superAdminTabs.map((tab) => {
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

export default SuperAdminSidebar;
