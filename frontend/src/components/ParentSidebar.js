import React from 'react';
import {
  FaTachometerAlt,
  FaChartBar,
  FaClipboardCheck,
  FaCalendarAlt,
  FaWallet,
  FaFileInvoiceDollar,
  FaBullhorn,
  FaRegCalendarCheck,
  FaEnvelope,
  FaBell,
  FaUser,
  FaCog
} from 'react-icons/fa';
import './Sidebar.css';
import { useSchoolConfig } from './schoolConfig';

const parentTabs = [
  { key: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { key: 'academic-results', label: 'Academic Results', icon: FaChartBar },
  { key: 'attendance', label: 'Attendance', icon: FaClipboardCheck },
  { key: 'timetable', label: 'Timetable', icon: FaCalendarAlt },
  { key: 'fees-payments', label: 'Fees & Payments', icon: FaWallet },
  { key: 'invoices', label: 'Invoices', icon: FaFileInvoiceDollar },
  { key: 'announcements', label: 'Announcements', icon: FaBullhorn },
  { key: 'events-calendar', label: 'Events & Calendar', icon: FaRegCalendarCheck },
  { key: 'messages', label: 'Messages', icon: FaEnvelope },
  { key: 'notifications', label: 'Notifications', icon: FaBell },
  { key: 'profile', label: 'Profile', icon: FaUser },
  { key: 'settings', label: 'Settings', icon: FaCog }
];

const ParentSidebar = ({ active = 'dashboard', onSelect = () => {}, onClose = () => {}, open = false }) => {
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
          {parentTabs.map((tab) => {
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

export default ParentSidebar;
