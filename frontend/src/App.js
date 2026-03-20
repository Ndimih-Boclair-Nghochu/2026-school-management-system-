import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import LibrarianDashboard from './components/LibrarianDashboard';
import ParentDashboard from './components/ParentDashboard';
import AccountantDashboard from './components/AccountantDashboard';
import AdminDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import LoginPage from './components/LoginPage';
import SchoolLanding from './components/SchoolLanding';
import {
  createStudentAccountFromMatricule,
  getStudentEnrollmentByMatricule,
  getStudentEnrollments,
  STUDENT_ENROLLMENT_UPDATED_EVENT
} from './components/studentEnrollment';

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

const DEMO_PARENT = {
  matricule: 'PAR2026',
  password: 'parent123',
  phone: '677000444'
};

const DEMO_ACCOUNTANT = {
  matricule: 'ACC2026',
  password: 'accountant123',
  phone: '677000555'
};

const DEMO_ADMIN = {
  matricule: 'ADM2026',
  password: 'admin123',
  phone: '677000666'
};

const DEMO_SUPER_ADMIN = {
  matricule: 'FDR2026',
  password: 'founder123',
  phone: '677000777'
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [activeRole, setActiveRole] = useState('teacher');
  const [recoveryOtps, setRecoveryOtps] = useState({});
  const [studentEnrollments, setStudentEnrollments] = useState(getStudentEnrollments());
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
    },
    {
      matricule: DEMO_PARENT.matricule,
      name: 'Mary Johnson',
      password: DEMO_PARENT.password,
      phone: DEMO_PARENT.phone,
      role: 'parent',
      childName: 'Emily Johnson',
      className: 'Grade 5',
      avatar: 'https://via.placeholder.com/32/1570ef/ffffff?text=MJ'
    },
    {
      matricule: DEMO_ACCOUNTANT.matricule,
      name: 'Daniel Accountant',
      password: DEMO_ACCOUNTANT.password,
      phone: DEMO_ACCOUNTANT.phone,
      role: 'accountant',
      avatar: 'https://via.placeholder.com/32/f59e0b/ffffff?text=DA'
    },
    {
      matricule: DEMO_ADMIN.matricule,
      name: 'Alicia Admin',
      password: DEMO_ADMIN.password,
      phone: DEMO_ADMIN.phone,
      role: 'admin',
      avatar: 'https://via.placeholder.com/32/0f766e/ffffff?text=AA'
    },
    {
      matricule: DEMO_SUPER_ADMIN.matricule,
      name: 'Founder One',
      password: DEMO_SUPER_ADMIN.password,
      phone: DEMO_SUPER_ADMIN.phone,
      role: 'super-admin',
      avatar: 'https://via.placeholder.com/32/0f172a/ffffff?text=FA'
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

  useEffect(() => {
    const syncEnrollments = (event) => {
      if (Array.isArray(event?.detail)) {
        setStudentEnrollments(event.detail);
        return;
      }
      setStudentEnrollments(getStudentEnrollments());
    };

    window.addEventListener(STUDENT_ENROLLMENT_UPDATED_EVENT, syncEnrollments);
    window.addEventListener('storage', syncEnrollments);

    return () => {
      window.removeEventListener(STUDENT_ENROLLMENT_UPDATED_EVENT, syncEnrollments);
      window.removeEventListener('storage', syncEnrollments);
    };
  }, []);

  const accountByMatricule = useMemo(() => {
    const map = new Map();
    accounts.forEach((account) => map.set(account.matricule, account));
    return map;
  }, [accounts]);

  const resolveEnrollment = (matricule) => {
    return studentEnrollments.find((item) => item.matricule === matricule) || getStudentEnrollmentByMatricule(matricule);
  };

  const handleLogin = (matricule, password) => {
    const directAccount = accounts.find(
      (account) => account.matricule === matricule && account.password === password
    );

    let matchedAccount = directAccount;

    if (!matchedAccount) {
      const enrollment = resolveEnrollment(matricule);
      if (enrollment?.accountCreated && enrollment.password === password) {
        matchedAccount = {
          matricule: enrollment.matricule,
          name: enrollment.name,
          password: enrollment.password,
          phone: enrollment.guardianPhone,
          role: 'student',
          className: enrollment.className,
          section: enrollment.subSchool,
          avatar: `https://via.placeholder.com/32/2e90fa/ffffff?text=${encodeURIComponent((enrollment.name || 'S').charAt(0).toUpperCase())}`
        };
      }
    }

    if (matchedAccount) {
      const enrollment = matchedAccount.role === 'student' ? resolveEnrollment(matchedAccount.matricule) : null;
      const enriched = {
        ...matchedAccount,
        section: enrollment?.subSchool || matchedAccount.section,
        platformFeePaid: matchedAccount.role === 'student'
          ? Boolean(enrollment?.platformFeePaid ?? matchedAccount.platformFeePaid)
          : true,
        schoolCode: enrollment?.schoolCode,
        enrolledAt: enrollment?.enrolledAt
      };

      setUserProfile(enriched);
      setActiveRole(enriched.role || 'teacher');
      setIsAuthenticated(true);
      setShowLandingPage(true);
      return true;
    }

    return false;
  };

  const handleCreateAccount = (matricule, password) => {
    const exists = accountByMatricule.has(matricule);
    if (exists) return { success: false, message: 'This matricule already has an account.' };

    const studentCreation = createStudentAccountFromMatricule(matricule, password);
    if (studentCreation.success) {
      const enrollment = studentCreation.enrollment;
      const studentAccount = {
        matricule: enrollment.matricule,
        name: enrollment.name,
        password: enrollment.password,
        phone: enrollment.guardianPhone,
        role: 'student',
        className: enrollment.className,
        section: enrollment.subSchool,
        platformFeePaid: enrollment.platformFeePaid,
        avatar: `https://via.placeholder.com/32/2e90fa/ffffff?text=${encodeURIComponent((enrollment.name || 'S').charAt(0).toUpperCase())}`
      };

      setAccounts((prev) => [studentAccount, ...prev.filter((item) => item.matricule !== studentAccount.matricule)]);
      return { success: true, message: studentCreation.message };
    }

    const enrollmentExists = Boolean(resolveEnrollment(matricule));
    if (enrollmentExists) {
      return { success: false, message: studentCreation.message };
    }

    const newAccount = {
      matricule,
      name: 'New Teacher',
      password,
      phone: '',
      role: 'teacher',
      avatar: 'https://via.placeholder.com/32'
    };

    setAccounts((prev) => [newAccount, ...prev]);
    return { success: true, message: 'Account created successfully. Please log in.' };
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

<<<<<<< HEAD
  const studentDashboardLocked = activeRole === 'student' && !userProfile.platformFeePaid;
  const dashboardLockMessage = studentDashboardLocked
    ? 'Your dashboard is locked until your platform fee is confirmed by the school admin.'
    : '';
=======
  // Removed dashboard lock restriction for students
>>>>>>> e921754 (Remove admin restriction for student dashboard access)

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

  if (showLandingPage) {
    return (
      <SchoolLanding
        profile={userProfile}
        role={activeRole}
<<<<<<< HEAD
        canOpenDashboard={!studentDashboardLocked}
        dashboardBlockedReason={dashboardLockMessage}
        onOpenDashboard={() => {
          if (studentDashboardLocked) {
            alert(dashboardLockMessage);
            return;
          }
=======
        canOpenDashboard={true}
        dashboardBlockedReason={''}
        onOpenDashboard={() => {
>>>>>>> e921754 (Remove admin restriction for student dashboard access)
          setShowLandingPage(false);
        }}
        onLogout={() => {
          setShowLandingPage(false);
          setIsAuthenticated(false);
        }}
      />
    );
  }

  if (activeRole === 'student') {
    return (
      <StudentDashboard
        profile={userProfile}
        platformFeePaid={Boolean(userProfile.platformFeePaid)}
        onSaveProfile={handleSaveProfile}
        onLogout={() => {
          setShowLandingPage(false);
          setIsAuthenticated(false);
        }}
      />
    );
  }

  if (activeRole === 'librarian') {
    return (
      <LibrarianDashboard
        profile={userProfile}
        onSaveProfile={handleSaveProfile}
        onLogout={() => {
          setShowLandingPage(false);
          setIsAuthenticated(false);
        }}
      />
    );
  }

  if (activeRole === 'parent') {
    return (
      <ParentDashboard
        profile={userProfile}
        onSaveProfile={handleSaveProfile}
        onLogout={() => {
          setShowLandingPage(false);
          setIsAuthenticated(false);
        }}
      />
    );
  }

  if (activeRole === 'accountant') {
    return (
      <AccountantDashboard
        profile={userProfile}
        onSaveProfile={handleSaveProfile}
        onLogout={() => {
          setShowLandingPage(false);
          setIsAuthenticated(false);
        }}
      />
    );
  }

  if (activeRole === 'admin') {
    return (
      <AdminDashboard
        profile={userProfile}
        onSaveProfile={handleSaveProfile}
        onLogout={() => {
          setShowLandingPage(false);
          setIsAuthenticated(false);
        }}
      />
    );
  }

  if (activeRole === 'super-admin') {
    return (
      <SuperAdminDashboard
        profile={userProfile}
        onLogout={() => {
          setShowLandingPage(false);
          setIsAuthenticated(false);
        }}
      />
    );
  }

  return (
    <TeacherDashboard
      profile={userProfile}
      onSaveProfile={handleSaveProfile}
      onLogout={() => {
        setShowLandingPage(false);
        setIsAuthenticated(false);
      }}
    />
  );
}

export default App;