import React from 'react';
import {
  FaTachometerAlt,
  FaUsers,
  FaWallet,
  FaFileInvoiceDollar,
  FaChartBar,
  FaBullhorn,
  FaEnvelope,
  FaBell,
  FaUser,
  FaCog
} from 'react-icons/fa';
import './Sidebar.css';
import { useSchoolConfig } from './schoolConfig';

const accountantTabs = [
  { key: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { key: 'students', label: 'Students', icon: FaUsers },
  { key: 'fees-structure', label: 'Fees Structure', icon: FaWallet },
  { key: 'invoices', label: 'Invoices', icon: FaFileInvoiceDollar },
  { key: 'financial-reports', label: 'Financial Reports', icon: FaChartBar },
  { key: 'announcements', label: 'Announcements', icon: FaBullhorn },
  { key: 'messages', label: 'Messages', icon: FaEnvelope },
  { key: 'notifications', label: 'Notifications', icon: FaBell },
  { key: 'profile', label: 'Profile', icon: FaUser },
  { key: 'settings', label: 'Settings', icon: FaCog }
];

const AccountantSidebar = ({ active = 'dashboard', onSelect = () => {}, onClose = () => {}, open = false }) => {
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
          {accountantTabs.map((tab) => {
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

export default AccountantSidebar;
