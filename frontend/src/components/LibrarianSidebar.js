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

const SCHOOL_NAME = 'EduIgnite School';
const SCHOOL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1b74d3" offset="0"/><stop stop-color="#2e90fa" offset="1"/></linearGradient></defs><rect width="88" height="88" rx="18" fill="url(#g)"/><circle cx="44" cy="44" r="22" fill="#fff" opacity="0.92"/><text x="44" y="50" text-anchor="middle" font-size="22" font-family="Arial" font-weight="700" fill="#1b74d3">EI</text></svg>')}`;

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
