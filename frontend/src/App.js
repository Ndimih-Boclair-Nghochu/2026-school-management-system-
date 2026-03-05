import React, { useState } from 'react';
import './App.css';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import LibrarianDashboard from './components/LibrarianDashboard';
import LoginPage from './components/LoginPage';

const DEMO_TEACHER = {
  matricule: 'TCH2026',
  password: 'demo1234',
  phone: '677000111'
};

const DEMO_STUDENT = {
  matricule: 'STD2026',
  password: 'student123',
  phone: '677000222'
};

const DEMO_LIBRARIAN = {
  matricule: 'LIB2026',
  password: 'librarian123',
  phone: '677000333'
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeRole, setActiveRole] = useState('teacher');
  const [recoveryOtps, setRecoveryOtps] = useState({});
  const [accounts, setAccounts] = useState([
    {
      matricule: DEMO_TEACHER.matricule,
      name: 'John Smith',
      password: DEMO_TEACHER.password,
      phone: DEMO_TEACHER.phone,
      role: 'teacher',
      avatar: 'https://via.placeholder.com/32'
    },
    {
      matricule: DEMO_STUDENT.matricule,
      name: 'Emily Johnson',
      password: DEMO_STUDENT.password,
      phone: DEMO_STUDENT.phone,
      role: 'student',
      className: 'Form 4 Science',
      avatar: 'https://via.placeholder.com/32/2e90fa/ffffff?text=EJ'
    },
    {
      matricule: DEMO_LIBRARIAN.matricule,
      name: 'Grace Librarian',
      password: DEMO_LIBRARIAN.password,
      phone: DEMO_LIBRARIAN.phone,
      role: 'librarian',
      avatar: 'https://via.placeholder.com/32/7f56d9/ffffff?text=GL'
    }
  ]);

  const [userProfile, setUserProfile] = useState({
    matricule: DEMO_TEACHER.matricule,
    name: 'John Smith',
    password: DEMO_TEACHER.password,
    phone: DEMO_TEACHER.phone,
    role: 'teacher',
    avatar: 'https://via.placeholder.com/32'
  });

  const handleLogin = (matricule, password) => {
    const matchedAccount = accounts.find(
      (account) => account.matricule === matricule && account.password === password
    );

    if (matchedAccount) {
      setUserProfile(matchedAccount);
      setActiveRole(matchedAccount.role || 'teacher');
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const handleCreateAccount = (matricule, password) => {
    const exists = accounts.some((account) => account.matricule === matricule);
    if (exists) return false;

    const newAccount = {
      matricule,
      name: 'New Teacher',
      password,
      phone: '',
      role: 'teacher',
      avatar: 'https://via.placeholder.com/32'
    };

    setAccounts((prev) => [newAccount, ...prev]);
    return true;
  };

  const handleStartPasswordRecovery = (matricule, phone) => {
    const matchedAccount = accounts.find(
      (account) => account.matricule === matricule && account.phone === phone
    );

    if (!matchedAccount) {
      return null;
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    setRecoveryOtps((prev) => ({ ...prev, [matricule]: otpCode }));
    return otpCode;
  };

  const handleVerifyRecoveryOtp = (matricule, otpCode) => recoveryOtps[matricule] === otpCode;

  const handleResetPassword = (matricule, otpCode, newPassword) => {
    if (recoveryOtps[matricule] !== otpCode) {
      return false;
    }

    let accountUpdated = false;

    setAccounts((prevAccounts) => prevAccounts.map((account) => {
      if (account.matricule === matricule) {
        accountUpdated = true;
        return { ...account, password: newPassword };
      }

      return account;
    }));

    if (!accountUpdated) {
      return false;
    }

    setUserProfile((prev) => (
      prev.matricule === matricule ? { ...prev, password: newPassword } : prev
    ));

    setRecoveryOtps((prev) => {
      const next = { ...prev };
      delete next[matricule];
      return next;
    });

    return true;
  };

  const handleSaveProfile = (updates) => {
    setUserProfile((prev) => {
      const nextProfile = { ...prev, ...updates };
      setAccounts((prevAccounts) => prevAccounts.map((account) => (
        account.matricule === nextProfile.matricule ? nextProfile : account
      )));
      return nextProfile;
    });
  };

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccount}
        onStartPasswordRecovery={handleStartPasswordRecovery}
        onVerifyRecoveryOtp={handleVerifyRecoveryOtp}
        onResetPassword={handleResetPassword}
      />
    );
  }

  if (activeRole === 'student') {
    return (
      <StudentDashboard
        profile={userProfile}
        onSaveProfile={handleSaveProfile}
        onLogout={() => setIsAuthenticated(false)}
      />
    );
  }

  if (activeRole === 'librarian') {
    return (
      <LibrarianDashboard
        profile={userProfile}
        onSaveProfile={handleSaveProfile}
        onLogout={() => setIsAuthenticated(false)}
      />
    );
  }

  return (
    <TeacherDashboard
      profile={userProfile}
      onSaveProfile={handleSaveProfile}
      onLogout={() => setIsAuthenticated(false)}
    />
  );
}

export default App;