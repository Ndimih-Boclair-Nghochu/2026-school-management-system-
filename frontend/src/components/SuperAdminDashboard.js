import React, { useMemo, useState } from 'react';
import {
  FaTachometerAlt,
  FaSchool,
  FaUserShield,
  FaUsers,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import Header from './Header';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useSchoolConfig } from './schoolConfig';
import './TeacherDashboard.css';
import './AdminDashboard.css';
import './SuperAdminDashboard.css';

const formatCurrency = (value) => `XAF ${Number(value || 0).toLocaleString()}`;

const SUPER_ADMIN_ROLES = [
  { role: 'Founder', scope: 'Global', users: 2 },
  { role: 'Platform Admin', scope: 'All Institutions', users: 6 },
  { role: 'School Admin', scope: 'Assigned Institution', users: 24 },
  { role: 'Academic Admin', scope: 'Academics', users: 11 },
  { role: 'Finance Admin', scope: 'Finance', users: 8 }
];

const INITIAL_SCHOOLS = [
  { id: 1, name: 'EduIgnite International School', code: 'EIMS-MAIN', city: 'Douala', plan: 'Enterprise', status: 'Active', admins: 7, users: 1240, lastSeen: '2026-03-08', license: '2027-03-01' },
  { id: 2, name: 'Success Academy', code: 'SCA-BDA', city: 'Bamenda', plan: 'Professional', status: 'Active', admins: 5, users: 920, lastSeen: '2026-03-08', license: '2026-12-30' },
  { id: 3, name: 'Future Leaders College', code: 'FLC-YDE', city: 'Yaounde', plan: 'Starter', status: 'Suspended', admins: 3, users: 410, lastSeen: '2026-03-03', license: '2026-10-10' }
];

const INITIAL_PLATFORM_ADMINS = [
  { id: 1, name: 'Founder One', email: 'founder1@eduignite.com', role: 'Founder', status: 'Active' },
  { id: 2, name: 'Founder Two', email: 'founder2@eduignite.com', role: 'Founder', status: 'Active' },
  { id: 3, name: 'Platform Ops', email: 'ops@eduignite.com', role: 'Platform Admin', status: 'Active' }
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'One school license expires in 45 days', date: '2026-03-08', unread: true, view: 'subscription-license-management' },
  { id: 2, title: 'Suspended school attempted access', date: '2026-03-08', unread: true, view: 'security-settings' },
  { id: 3, title: 'Backup completed successfully', date: '2026-03-07', unread: false, view: 'backup-restore' }
];

const INITIAL_ACTIVITY_LOGS = [
  { id: 1, actor: 'Founder One', action: 'Suspended school', target: 'Future Leaders College', date: '2026-03-06 09:20' },
  { id: 2, actor: 'Platform Ops', action: 'Ran full backup', target: 'Global Database', date: '2026-03-07 22:15' },
  { id: 3, actor: 'Founder Two', action: 'Updated security policy', target: 'Session Timeout', date: '2026-03-08 08:02' }
];

const SuperAdminDashboard = ({ profile, onLogout = () => {} }) => {
  const schoolConfig = useSchoolConfig();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const [schools, setSchools] = useState(INITIAL_SCHOOLS);
  const [platformAdmins, setPlatformAdmins] = useState(INITIAL_PLATFORM_ADMINS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activityLogs, setActivityLogs] = useState(INITIAL_ACTIVITY_LOGS);
  const [newSchool, setNewSchool] = useState({ name: '', code: '', city: '', plan: 'Starter' });
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'Platform Admin' });
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowNewInstitutions: true,
    globalMessage: 'Welcome to EduIgnite founder control center.'
  });
  const [securitySettings, setSecuritySettings] = useState({
    requireMfa: true,
    strictIpRules: false,
    sessionTimeoutMinutes: 30
  });

  const platformStats = useMemo(() => {
    const activeSchools = schools.filter((item) => item.status === 'Active').length;
    const suspendedSchools = schools.filter((item) => item.status === 'Suspended').length;
    const totalUsers = schools.reduce((sum, item) => sum + Number(item.users || 0), 0);

    return {
      schools: schools.length,
      activeSchools,
      suspendedSchools,
      totalUsers,
      admins: platformAdmins.length
    };
  }, [schools, platformAdmins]);

  const unreadNotifications = useMemo(() => notifications.filter((item) => item.unread), [notifications]);

  const trackActivity = (action, target) => {
    setActivityLogs((prev) => [
      {
        id: Date.now(),
        actor: profile?.name || 'Super Admin',
        action,
        target,
        date: new Date().toISOString().slice(0, 16).replace('T', ' ')
      },
      ...prev
    ]);
  };

  const addSchool = () => {
    const name = newSchool.name.trim();
    const code = newSchool.code.trim().toUpperCase();
    const city = newSchool.city.trim();

    if (!name || !code || !city) {
      alert('Provide school name, code and city.');
      return;
    }

    if (schools.some((item) => item.code.toUpperCase() === code)) {
      alert('School code already exists.');
      return;
    }

    const payload = {
      id: Date.now(),
      name,
      code,
      city,
      plan: newSchool.plan,
      status: 'Active',
      admins: 1,
      users: 0,
      lastSeen: new Date().toISOString().slice(0, 10),
      license: '2027-03-01'
    };

    setSchools((prev) => [payload, ...prev]);
    setNewSchool({ name: '', code: '', city: '', plan: 'Starter' });
    setNotice(`Institution ${name} added successfully.`);
    trackActivity('Created school', name);
  };

  const toggleSchoolStatus = (id) => {
    setSchools((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const nextStatus = item.status === 'Active' ? 'Suspended' : 'Active';
      setNotice(`${item.name} is now ${nextStatus}.`);
      trackActivity(nextStatus === 'Suspended' ? 'Suspended school' : 'Reactivated school', item.name);
      return { ...item, status: nextStatus };
    }));
  };

  const deleteSchool = (id) => {
    const target = schools.find((item) => item.id === id);
    if (!target) {
      return;
    }

    const confirmed = window.confirm(`Delete ${target.name} from platform permanently?`);
    if (!confirmed) {
      return;
    }

    setSchools((prev) => prev.filter((item) => item.id !== id));
    setNotice(`${target.name} deleted from the platform.`);
    trackActivity('Deleted school', target.name);
  };

  const addPlatformAdmin = () => {
    const name = newAdmin.name.trim();
    const email = newAdmin.email.trim();
    if (!name || !email) {
      alert('Provide admin name and email.');
      return;
    }

    setPlatformAdmins((prev) => [
      {
        id: Date.now(),
        name,
        email,
        role: newAdmin.role,
        status: 'Active'
      },
      ...prev
    ]);

    setNewAdmin({ name: '', email: '', role: 'Platform Admin' });
    setNotice(`Platform admin ${name} added.`);
    trackActivity('Added platform admin', name);
  };

  const toggleAdminStatus = (id) => {
    setPlatformAdmins((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const nextStatus = item.status === 'Active' ? 'Suspended' : 'Active';
      setNotice(`${item.name} is now ${nextStatus}.`);
      trackActivity(nextStatus === 'Suspended' ? 'Suspended admin' : 'Reactivated admin', item.name);
      return { ...item, status: nextStatus };
    }));
  };

  const markNotificationRead = (id) => {
    const target = notifications.find((item) => item.id === id);
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    if (target?.view) {
      setActiveView(target.view);
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const renderDashboard = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Founder Super Admin Dashboard</h2>
        <p>Global command center to govern all institutions, users, security and platform operations.</p>
      </div>

      {notice && <div className="admin-notice">{notice}</div>}

      <div className="admin-metric-grid">
        <article>
          <div className="admin-metric-head"><span>Institutions</span><FaSchool /></div>
          <strong>{platformStats.schools}</strong>
          <small>{platformStats.activeSchools} active • {platformStats.suspendedSchools} suspended</small>
        </article>
        <article>
          <div className="admin-metric-head"><span>Platform Users</span><FaUsers /></div>
          <strong>{platformStats.totalUsers.toLocaleString()}</strong>
          <small>Across all registered schools</small>
        </article>
        <article>
          <div className="admin-metric-head"><span>Control Team</span><FaUserShield /></div>
          <strong>{platformStats.admins}</strong>
          <small>Founders + platform administrators</small>
        </article>
        <article>
          <div className="admin-metric-head"><span>Operational Health</span><FaChartLine /></div>
          <strong>99.4%</strong>
          <small>Uptime in last 30 days</small>
        </article>
      </div>

      <div className="admin-dual-grid">
        <article className="admin-card">
          <div className="section-header compact">
            <h3>Critical Alerts</h3>
          </div>
          <ul className="admin-alert-list">
            <li><FaExclamationTriangle /> License renewal due for one institution in under 60 days.</li>
            <li className="ok"><FaCheckCircle /> Last backup completed successfully.</li>
            <li className="ok"><FaCheckCircle /> API health check passed for all connected services.</li>
          </ul>
        </article>

        <article className="admin-card">
          <div className="section-header compact">
            <h3>Quick Founder Actions</h3>
          </div>
          <div className="admin-actions">
            <button type="button" onClick={() => setActiveView('schools')}>Manage Institutions</button>
            <button type="button" onClick={() => setActiveView('security-settings')}>Review Security</button>
            <button type="button" onClick={() => setActiveView('backup-restore')}>Run Backups</button>
            <button type="button" onClick={() => setActiveView('system-updates')}>Check Updates</button>
          </div>
        </article>
      </div>
    </section>
  );

  const renderSchools = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Schools / Institutions</h2>
        <p>Create institutions, suspend access, reactivate schools, or permanently delete from the platform.</p>
      </div>

      <div className="admin-compose-grid compact">
        <label>
          School Name
          <input value={newSchool.name} onChange={(event) => setNewSchool((prev) => ({ ...prev, name: event.target.value }))} placeholder="Institution name" />
        </label>
        <label>
          School Code
          <input value={newSchool.code} onChange={(event) => setNewSchool((prev) => ({ ...prev, code: event.target.value }))} placeholder="EIMS-NEW" />
        </label>
        <label>
          City
          <input value={newSchool.city} onChange={(event) => setNewSchool((prev) => ({ ...prev, city: event.target.value }))} placeholder="City" />
        </label>
        <label>
          Plan
          <select value={newSchool.plan} onChange={(event) => setNewSchool((prev) => ({ ...prev, plan: event.target.value }))}>
            <option>Starter</option>
            <option>Professional</option>
            <option>Enterprise</option>
          </select>
        </label>
        <button type="button" onClick={addSchool}>Add Institution</button>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>School</th>
              <th>Code</th>
              <th>City</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Users</th>
              <th>License</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.code}</td>
                <td>{item.city}</td>
                <td>{item.plan}</td>
                <td>{item.status}</td>
                <td>{item.users}</td>
                <td>{item.license}</td>
                <td>
                  <div className="admin-row-actions">
                    <button type="button" className="row-action" onClick={() => toggleSchoolStatus(item.id)}>
                      {item.status === 'Active' ? 'Suspend' : 'Reactivate'}
                    </button>
                    <button type="button" className="row-action danger" onClick={() => deleteSchool(item.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderAdminManagement = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Admin Management</h2>
        <p>Control founder and platform admin identities with immediate suspend/reactivate capability.</p>
      </div>

      <div className="admin-control-grid">
        <label>
          Full Name
          <input value={newAdmin.name} onChange={(event) => setNewAdmin((prev) => ({ ...prev, name: event.target.value }))} placeholder="Admin name" />
        </label>
        <label>
          Email
          <input value={newAdmin.email} onChange={(event) => setNewAdmin((prev) => ({ ...prev, email: event.target.value }))} placeholder="admin@eduignite.com" />
        </label>
        <label>
          Role
          <select value={newAdmin.role} onChange={(event) => setNewAdmin((prev) => ({ ...prev, role: event.target.value }))}>
            <option>Platform Admin</option>
            <option>Support Admin</option>
            <option>Security Admin</option>
          </select>
        </label>
      </div>

      <div className="admin-actions" style={{ marginBottom: 10 }}>
        <button type="button" onClick={addPlatformAdmin}>Create Platform Admin</button>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {platformAdmins.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.role}</td>
                <td>{item.status}</td>
                <td>
                  <button type="button" className="row-action" onClick={() => toggleAdminStatus(item.id)}>
                    {item.status === 'Active' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderUserManagement = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>User Management</h2>
        <p>Global user governance across all institutions and role groups.</p>
      </div>
      <div className="admin-kpi-row compact">
        <article><span>Students</span><strong>2,740</strong></article>
        <article><span>Teachers</span><strong>198</strong></article>
        <article><span>Parents</span><strong>1,920</strong></article>
        <article><span>Staff & Admins</span><strong>116</strong></article>
      </div>
      <p className="superadmin-note">Use this panel to enforce account suspensions, resets, and institution-level user policies.</p>
    </section>
  );

  const renderRolesPermissions = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Roles & Permissions</h2>
        <p>Define and audit what each control role can access platform-wide.</p>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Scope</th>
              <th>Assigned Users</th>
            </tr>
          </thead>
          <tbody>
            {SUPER_ADMIN_ROLES.map((item) => (
              <tr key={item.role}>
                <td>{item.role}</td>
                <td>{item.scope}</td>
                <td>{item.users}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderSystemSettings = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>System Settings</h2>
        <p>Global platform controls that apply to all institutions.</p>
      </div>
      <div className="admin-settings-grid">
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={systemSettings.maintenanceMode}
            onChange={(event) => setSystemSettings((prev) => ({ ...prev, maintenanceMode: event.target.checked }))}
          />
          Enable maintenance mode
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={systemSettings.allowNewInstitutions}
            onChange={(event) => setSystemSettings((prev) => ({ ...prev, allowNewInstitutions: event.target.checked }))}
          />
          Allow new institutions onboarding
        </label>
        <label className="span-2">
          Global Banner Message
          <input
            type="text"
            value={systemSettings.globalMessage}
            onChange={(event) => setSystemSettings((prev) => ({ ...prev, globalMessage: event.target.value }))}
          />
        </label>
      </div>
      <div className="admin-actions">
        <button type="button" onClick={() => setNotice('System settings saved successfully.')}>Save System Settings</button>
      </div>
    </section>
  );

  const renderSecuritySettings = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Security Settings</h2>
        <p>Enforce platform-wide security posture and access restrictions.</p>
      </div>
      <div className="admin-settings-grid">
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={securitySettings.requireMfa}
            onChange={(event) => setSecuritySettings((prev) => ({ ...prev, requireMfa: event.target.checked }))}
          />
          Require MFA for all admin roles
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={securitySettings.strictIpRules}
            onChange={(event) => setSecuritySettings((prev) => ({ ...prev, strictIpRules: event.target.checked }))}
          />
          Enable strict IP allow-listing
        </label>
        <label>
          Session Timeout (minutes)
          <input
            type="number"
            min="5"
            max="240"
            value={securitySettings.sessionTimeoutMinutes}
            onChange={(event) => setSecuritySettings((prev) => ({ ...prev, sessionTimeoutMinutes: Number(event.target.value || 30) }))}
          />
        </label>
      </div>
      <div className="admin-actions">
        <button type="button" onClick={() => setNotice('Security policy updated and applied.')}>Apply Security Policy</button>
      </div>
    </section>
  );

  const renderSubscriptionManagement = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Subscription / License Management</h2>
        <p>Oversee plan assignment, renewals and revenue control for each institution.</p>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Institution</th>
              <th>Plan</th>
              <th>License Expiry</th>
              <th>Estimated MRR</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.plan}</td>
                <td>{item.license}</td>
                <td>{formatCurrency(item.plan === 'Enterprise' ? 850000 : item.plan === 'Professional' ? 420000 : 180000)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderBackupRestore = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Backup & Restore</h2>
        <p>Run platform backups, verify integrity, and restore disaster snapshots.</p>
      </div>
      <div className="admin-actions">
        <button type="button" onClick={() => { setNotice('Full backup initiated successfully.'); trackActivity('Started backup', 'Global Database'); }}>Run Full Backup</button>
        <button type="button" onClick={() => { setNotice('Backup restore point validated.'); trackActivity('Validated restore point', 'Nightly Snapshot'); }}>Validate Restore Point</button>
      </div>
    </section>
  );

  const renderActivityLogs = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Activity Logs</h2>
        <p>Centralized immutable stream of founder and platform admin actions.</p>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {activityLogs.map((item) => (
              <tr key={item.id}>
                <td>{item.actor}</td>
                <td>{item.action}</td>
                <td>{item.target}</td>
                <td>{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderGenericTab = (title, subtitle) => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="admin-card">
        <p className="superadmin-note">This module is active in Super Admin scope and ready for deeper workflow extension.</p>
      </div>
    </section>
  );

  const renderMain = () => {
    switch (activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'schools':
        return renderSchools();
      case 'admin-management':
        return renderAdminManagement();
      case 'user-management':
        return renderUserManagement();
      case 'roles-permissions':
        return renderRolesPermissions();
      case 'academic-management':
        return renderGenericTab('Academic Management', 'Govern institution-level academic calendars, grading templates and policies.');
      case 'students-management':
        return renderGenericTab('Students Management', 'Supervise student identity, lifecycle, migration and compliance controls globally.');
      case 'teachers-management':
        return renderGenericTab('Teachers Management', 'Manage teacher records, qualifications, and workload governance across schools.');
      case 'parents-management':
        return renderGenericTab('Parents Management', 'Control parent portal policy, access governance, and engagement channels.');
      case 'classes-departments':
        return renderGenericTab('Classes & Departments', 'Control the institutional structure templates used by all onboarded schools.');
      case 'subjects':
        return renderGenericTab('Subjects', 'Maintain global subject catalogs and mapping standards.');
      case 'attendance-management':
        return renderGenericTab('Attendance Management', 'Monitor attendance policy compliance and anomaly reports platform-wide.');
      case 'exams-results':
        return renderGenericTab('Exams & Results', 'Enforce exam publication standards and result integrity controls.');
      case 'fees-finance-management':
        return renderGenericTab('Fees / Finance Management', 'Oversee fee engines, payment gateways and finance policy controls.');
      case 'announcements':
        return renderGenericTab('Announcements', 'Control global communication templates and priority notice channels.');
      case 'messages-communication':
        return renderGenericTab('Messages / Communication', 'Audit and configure platform communication channels and message policies.');
      case 'reports-analytics':
        return renderGenericTab('Reports & Analytics', 'Access platform-wide KPIs, school performance metrics and operational analytics.');
      case 'system-settings':
        return renderSystemSettings();
      case 'subscription-license-management':
        return renderSubscriptionManagement();
      case 'app-management':
        return renderGenericTab('App Management (Mobile & Desktop Versions)', 'Publish app versions and rollout controls for web, mobile and desktop clients.');
      case 'backup-restore':
        return renderBackupRestore();
      case 'activity-logs':
        return renderActivityLogs();
      case 'security-settings':
        return renderSecuritySettings();
      case 'api-integrations':
        return renderGenericTab('API Integrations', 'Manage third-party integrations, keys, webhooks and sync reliability.');
      case 'help-support':
        return renderGenericTab('Help & Support', 'Control support channels, SLAs and escalation workflows.');
      case 'system-updates':
        return renderGenericTab('System Updates', 'Manage release channels, update windows and rollback safety controls.');
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="dashboard-container">
      <SuperAdminSidebar
        active={activeView}
        onSelect={(view) => {
          if (view === 'logout') {
            onLogout();
            return;
          }
          setActiveView(view);
          setSidebarOpen(false);
        }}
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}
      />

      <Header
        onToggleMenu={() => setSidebarOpen((prev) => !prev)}
        onLogout={onLogout}
        profile={{
          name: profile?.name || 'Founder Super Admin',
          avatar: profile?.avatar || 'https://via.placeholder.com/32/0f172a/ffffff?text=SA'
        }}
        notificationCount={unreadNotifications.length}
        notifications={notifications}
        onNotificationSelect={markNotificationRead}
        onMarkAllNotificationsRead={markAllNotificationsRead}
        onViewAllNotifications={() => setActiveView('activity-logs')}
      />

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="dashboard-main admin-main">
        <div className="admin-left-content">
          {renderMain()}
        </div>

        <aside className="admin-right-sidebar">
          <article className="admin-card admin-chart-section">
            <div className="section-header compact">
              <h3>Platform Context</h3>
            </div>
            <ul className="admin-alert-list">
              <li className="ok">Institution Template: {schoolConfig.schoolName}</li>
              <li>Session: {schoolConfig.currentSession}</li>
              <li>Term: {schoolConfig.currentTerm}</li>
            </ul>
          </article>
        </aside>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
