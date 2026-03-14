import React from 'react';
import {
  FaTachometerAlt,
  FaBook,
  FaPlusCircle,
  FaHandHolding,
  FaUndoAlt,
  FaHistory,
  FaExclamationTriangle,
  FaUsers,
  FaChartBar,
  FaCog,
  FaUserEdit
} from 'react-icons/fa';
import './Sidebar.css';
import { useSchoolConfig } from './schoolConfig';

const librarianTabs = [
  { key: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { key: 'books-catalog', label: 'Books Catalog', icon: FaBook },
  { key: 'add-book', label: 'Add Book', icon: FaPlusCircle },
  { key: 'issue-book', label: 'Issue Book', icon: FaHandHolding },
  { key: 'return-book', label: 'Return Book', icon: FaUndoAlt },
  { key: 'borrowing-records', label: 'Borrowing Records', icon: FaHistory },
  { key: 'overdue-books', label: 'Overdue Books', icon: FaExclamationTriangle },
  { key: 'library-members', label: 'Library Members', icon: FaUsers },
  { key: 'reports', label: 'Reports', icon: FaChartBar },
  { key: 'settings', label: 'Settings', icon: FaCog },
  { key: 'profile', label: 'Profile', icon: FaUserEdit }
];

const LibrarianSidebar = ({ active = 'dashboard', onSelect = () => {}, onClose = () => {}, open = false }) => {
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
          {librarianTabs.map((tab) => {
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

export default LibrarianSidebar;
