import React, { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  FaChartLine,
  FaSchool,
  FaUsers,
  FaUserGraduate,
  FaFileInvoiceDollar,
  FaBullhorn,
  FaBell,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import Header from './Header';
import AdminSidebar from './AdminSidebar';
import EditProfile from './EditProfile';
import {
  getAcademicTermStructure,
  getSchoolConfig,
  normalizeSchoolConfig,
  saveSchoolConfig
} from './schoolConfig';
import {
  enrollStudentRecord,
  getStudentEnrollments,
  STUDENT_ENROLLMENT_UPDATED_EVENT,
  updateStudentPlatformFee
} from './studentEnrollment';
import './TeacherDashboard.css';
import './AdminDashboard.css';

const buildAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=fff&bold=true`;

const formatCurrency = (value) => `XAF ${Number(value || 0).toLocaleString()}`;

const exportCsv = (rows, filename) => {
  if (!rows.length) {
    alert('No data available for export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(','))
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const INITIAL_DEPARTMENTS = [
  { id: 1, name: 'Sciences', head: 'Mr. Kelvin', staffCount: 18, status: 'Active' },
  { id: 2, name: 'Arts & Languages', head: 'Mrs. Tambe', staffCount: 14, status: 'Active' },
  { id: 3, name: 'Administration', head: 'Mr. Neba', staffCount: 9, status: 'Active' }
];

const INITIAL_USERS = [
  { id: 1, name: 'John Smith', role: 'Teacher', email: 'john.smith@eduignite.edu', department: 'Sciences', section: 'English School', status: 'Active' },
  { id: 2, name: 'Mary Johnson', role: 'Parent', email: 'mary.johnson@email.com', department: 'Community', section: 'English School', status: 'Active' },
  { id: 3, name: 'Grace Librarian', role: 'Staff', email: 'grace.lib@eduignite.edu', department: 'Administration', section: 'French School', status: 'Active' },
  { id: 4, name: 'Daniel Accountant', role: 'Staff', email: 'daniel.acc@eduignite.edu', department: 'Administration', section: 'Technical School', status: 'Active' },
  { id: 5, name: 'Alicia Admin', role: 'Admin', email: 'alicia.admin@eduignite.edu', department: 'Administration', section: 'English School', status: 'Active' },
  { id: 6, name: 'Peter Nsom', role: 'Teacher', email: 'peter.nsom@eduignite.edu', department: 'Sciences', section: 'Technical School', status: 'On Leave' }
];

const INITIAL_STUDENTS = [
  { id: 1, matricule: 'EIMS-EMILY-ENG-001', name: 'Emily Johnson', className: 'Grade 5', section: 'English School', parent: 'Mary Johnson', attendance: 95, resultAverage: 14.1, feeStatus: 'Partial', platformFeePaid: true, status: 'Active' },
  { id: 2, matricule: 'EIMS-DANIE-FRE-001', name: 'Daniel Johnson', className: 'Grade 3', section: 'French School', parent: 'Mary Johnson', attendance: 93, resultAverage: 13.4, feeStatus: 'Partial', platformFeePaid: true, status: 'Active' },
  { id: 3, matricule: 'EIMS-RITAN-TEC-001', name: 'Rita Nsame', className: 'Grade 4', section: 'Technical School', parent: 'Joseph Nsame', attendance: 98, resultAverage: 15.6, feeStatus: 'Cleared', platformFeePaid: true, status: 'Active' },
  { id: 4, matricule: 'EIMS-MICHA-ENG-001', name: 'Michael Tabi', className: 'Grade 6', section: 'English School', parent: 'Anna Tabi', attendance: 84, resultAverage: 11.2, feeStatus: 'Outstanding', platformFeePaid: true, status: 'At Risk' }
];

const INITIAL_CLASSES = [
  { id: 1, name: 'Grade 3', level: 'Primary', teacher: 'John Smith', students: 32, room: 'P-12' },
  { id: 2, name: 'Grade 4', level: 'Primary', teacher: 'Peter Nsom', students: 30, room: 'P-14' },
  { id: 3, name: 'Grade 5', level: 'Primary', teacher: 'John Smith', students: 35, room: 'P-16' },
  { id: 4, name: 'Grade 6', level: 'Primary', teacher: 'Peter Nsom', students: 29, room: 'P-18' }
];

const INITIAL_SUBJECTS = [
  { id: 1, name: 'Mathematics', department: 'Sciences', weeklyPeriods: 6, teacher: 'John Smith' },
  { id: 2, name: 'English Language', department: 'Arts & Languages', weeklyPeriods: 5, teacher: 'Brenda Nji' },
  { id: 3, name: 'Integrated Science', department: 'Sciences', weeklyPeriods: 4, teacher: 'Peter Nsom' }
];

const INITIAL_TIMETABLE = [
  { id: 1, day: 'Monday', className: 'Grade 5', period: '08:00 - 09:00', subject: 'Mathematics', teacher: 'John Smith' },
  { id: 2, day: 'Monday', className: 'Grade 6', period: '09:00 - 10:00', subject: 'Integrated Science', teacher: 'Peter Nsom' },
  { id: 3, day: 'Tuesday', className: 'Grade 3', period: '10:00 - 11:00', subject: 'English Language', teacher: 'Brenda Nji' }
];

const INITIAL_ATTENDANCE = [
  { id: 1, date: '2026-03-05', className: 'Grade 5', present: 33, absent: 2, late: 1 },
  { id: 2, date: '2026-03-05', className: 'Grade 4', present: 28, absent: 2, late: 0 },
  { id: 3, date: '2026-03-06', className: 'Grade 6', present: 26, absent: 3, late: 0 }
];

const INITIAL_ASSIGNMENTS = [
  { id: 1, title: 'Algebra Worksheet', className: 'Grade 5', subject: 'Mathematics', dueDate: '2026-03-12', status: 'Open' },
  { id: 2, title: 'Essay on Local History', className: 'Grade 4', subject: 'English Language', dueDate: '2026-03-13', status: 'Open' },
  { id: 3, title: 'Science Lab Report', className: 'Grade 6', subject: 'Integrated Science', dueDate: '2026-03-10', status: 'Submitted' }
];

const INITIAL_EXAMS = [
  { id: 1, title: 'Term 2 Mathematics Test', className: 'Grade 5', subject: 'Mathematics', date: '2026-03-19', status: 'Scheduled' },
  { id: 2, title: 'Term 2 Science Quiz', className: 'Grade 6', subject: 'Integrated Science', date: '2026-03-21', status: 'Scheduled' },
  { id: 3, title: 'English Continuous Assessment', className: 'Grade 4', subject: 'English Language', date: '2026-03-14', status: 'Completed' }
];

const INITIAL_RESULTS = [
  { id: 1, student: 'Emily Johnson', className: 'Grade 5', subject: 'Mathematics', score: 16, grade: 'A' },
  { id: 2, student: 'Daniel Johnson', className: 'Grade 3', subject: 'English Language', score: 14, grade: 'B+' },
  { id: 3, student: 'Michael Tabi', className: 'Grade 6', subject: 'Integrated Science', score: 10, grade: 'C' }
];

const INITIAL_FEES = [
  { id: 1, item: 'Tuition Fee', level: 'All', term: 'Term 2', amount: 120000, mandatory: true, status: 'Active' },
  { id: 2, item: 'Transport Fee', level: 'Grade 3-6', term: 'Term 2', amount: 30000, mandatory: false, status: 'Active' },
  { id: 3, item: 'Laboratory Levy', level: 'Grade 5-7', term: 'Term 2', amount: 15000, mandatory: true, status: 'Active' }
];

const INITIAL_INVOICES = [
  { id: 1, invoiceNo: 'INV-2026-301', student: 'Emily Johnson', className: 'Grade 5', amount: 120000, dueDate: '2026-03-15', status: 'Unpaid' },
  { id: 2, invoiceNo: 'INV-2026-302', student: 'Daniel Johnson', className: 'Grade 3', amount: 30000, dueDate: '2026-03-20', status: 'Unpaid' },
  { id: 3, invoiceNo: 'INV-2026-289', student: 'Rita Nsame', className: 'Grade 4', amount: 25000, dueDate: '2026-02-26', status: 'Paid' }
];

const INITIAL_ANNOUNCEMENTS = [
  { id: 1, title: 'Fee Collection Window Update', type: 'Finance', audience: 'All', date: '2026-03-20', message: 'Term 2 fee collection remains open until March 20, 2026.' },
  { id: 2, title: 'Science Fair Registration', type: 'Academic', audience: 'Students', date: '2026-03-18', message: 'All science fair project proposals should be submitted before Friday.' }
];

const INITIAL_EVENTS = [
  { id: 1, title: 'Parent-Teacher Meeting', date: '2026-03-22', category: 'Community', organizer: 'Administration' },
  { id: 2, title: 'Inter-School Debate', date: '2026-03-28', category: 'Academic', organizer: 'Arts & Languages' },
  { id: 3, title: 'Career Day', date: '2026-04-02', category: 'Guidance', organizer: 'Administration' }
];

const INITIAL_MESSAGES = [
  { id: 1, from: 'Principal Office', to: 'Admin', channel: 'Internal', priority: 'High', date: '2026-03-06', preview: 'Need consolidated report for board review.' },
  { id: 2, from: 'Parent Helpdesk', to: 'Admin', channel: 'Support', priority: 'Normal', date: '2026-03-05', preview: 'Requesting policy clarification for fee installment plans.' },
  { id: 3, from: 'Teacher Team', to: 'Admin', channel: 'Academic', priority: 'Normal', date: '2026-03-04', preview: 'Please approve revised timetable for Grade 6.' }
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: '4 users need approval', date: '2026-03-06', unread: true, view: 'users' },
  { id: 2, title: '2 invoices overdue', date: '2026-03-06', unread: true, view: 'invoices' },
  { id: 3, title: 'New event draft pending publish', date: '2026-03-05', unread: true, view: 'events-calendar' },
  { id: 4, title: 'Attendance dropped below 90% in Grade 6', date: '2026-03-05', unread: false, view: 'attendance' }
];

const INITIAL_LIBRARY = [
  { id: 1, title: 'Physics Essentials', copies: 22, available: 8, status: 'Low Stock' },
  { id: 2, title: 'English Grammar Handbook', copies: 30, available: 17, status: 'Healthy' },
  { id: 3, title: 'African History Atlas', copies: 16, available: 4, status: 'Low Stock' }
];

const INITIAL_TRANSPORT = [
  { id: 1, route: 'North Route', busNo: 'BUS-01', driver: 'M. Tamo', seats: 45, occupied: 41, status: 'On Schedule' },
  { id: 2, route: 'West Route', busNo: 'BUS-04', driver: 'J. Mbella', seats: 38, occupied: 33, status: 'On Schedule' },
  { id: 3, route: 'East Route', busNo: 'BUS-02', driver: 'P. Simo', seats: 40, occupied: 40, status: 'Full' }
];

const DEFAULT_ADMIN_SETTINGS = {
  timezone: 'Africa/Douala',
  autoApproveParents: false,
  autoGenerateInvoices: true,
  attendanceAlertThreshold: '90',
  reportCycle: 'Weekly',
  notificationChannel: 'Email + SMS'
};

const AdminDashboard = ({ profile, onSaveProfile = () => {}, onLogout = () => {} }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const [schoolProfile, setSchoolProfile] = useState(getSchoolConfig());
  const [savedSchoolProfileSnapshot, setSavedSchoolProfileSnapshot] = useState(getSchoolConfig());
  const [departments] = useState(INITIAL_DEPARTMENTS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [classes] = useState(INITIAL_CLASSES);
  const [subjects] = useState(INITIAL_SUBJECTS);
  const [timetable] = useState(INITIAL_TIMETABLE);
  const [attendance] = useState(INITIAL_ATTENDANCE);
  const [assignments] = useState(INITIAL_ASSIGNMENTS);
  const [exams] = useState(INITIAL_EXAMS);
  const [results] = useState(INITIAL_RESULTS);
  const [fees] = useState(INITIAL_FEES);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [events] = useState(INITIAL_EVENTS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [libraryBooks] = useState(INITIAL_LIBRARY);
  const [transportRoutes] = useState(INITIAL_TRANSPORT);

  const [globalSearch, setGlobalSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [studentClassFilter, setStudentClassFilter] = useState('All');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All');
  const [messagePriorityFilter, setMessagePriorityFilter] = useState('All');

  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', type: 'General', audience: 'All', date: '2026-03-15', message: '' });
  const [newMessage, setNewMessage] = useState({ to: 'Teachers', channel: 'Internal', priority: 'Normal', preview: '' });
  const [settingsDraft, setSettingsDraft] = useState({ ...DEFAULT_ADMIN_SETTINGS });
  const [settingsSnapshot, setSettingsSnapshot] = useState({ ...DEFAULT_ADMIN_SETTINGS });
  const [settingsSavedAt, setSettingsSavedAt] = useState('Not saved yet');
  const [activeSlideEditorIndex, setActiveSlideEditorIndex] = useState(0);
  const [slideEditorDraft, setSlideEditorDraft] = useState(getSchoolConfig().landingSlides[0]);
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedProfileTarget, setSelectedProfileTarget] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState(getStudentEnrollments());
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [enrollmentDraft, setEnrollmentDraft] = useState({
    name: '',
    className: 'Grade 1',
    parent: '',
    section: 'English School',
    gender: 'Not Specified',
    dateOfBirth: '',
    guardianPhone: '',
    address: ''
  });

  useEffect(() => {
    const safeIndex = Math.min(activeSlideEditorIndex, schoolProfile.landingSlides.length - 1);
    const selectedSlide = schoolProfile.landingSlides[Math.max(0, safeIndex)] || schoolProfile.landingSlides[0];
    setSlideEditorDraft(selectedSlide);
    if (safeIndex !== activeSlideEditorIndex) {
      setActiveSlideEditorIndex(Math.max(0, safeIndex));
    }
  }, [schoolProfile.landingSlides, activeSlideEditorIndex]);

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

  const teachers = useMemo(() => users.filter((item) => item.role === 'Teacher'), [users]);
  const parents = useMemo(() => users.filter((item) => item.role === 'Parent'), [users]);
  const staff = useMemo(() => users.filter((item) => item.role === 'Staff'), [users]);

  const profileForEdit = useMemo(() => ({
    matricule: profile?.matricule || 'ADM2026',
    name: profile?.name || 'School Administrator',
    avatar: profile?.avatar || buildAvatar(profile?.name || 'School Administrator'),
    password: profile?.password || 'admin123',
    phone: profile?.phone || '677000666'
  }), [profile]);

  const filteredUsers = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    return users.filter((item) => {
      const roleMatch = userRoleFilter === 'All' || item.role === userRoleFilter;
      const queryMatch = !query || `${item.name} ${item.email} ${item.role} ${item.department} ${item.section || ''}`.toLowerCase().includes(query);
      return roleMatch && queryMatch;
    });
  }, [users, globalSearch, userRoleFilter]);

  const filteredStudents = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    return students.filter((item) => {
      const classMatch = studentClassFilter === 'All' || item.className === studentClassFilter;
      const queryMatch = !query || `${item.matricule || ''} ${item.name} ${item.parent} ${item.className} ${item.feeStatus} ${item.section || ''} ${item.platformFeePaid ? 'paid' : 'pending'}`.toLowerCase().includes(query);
      return classMatch && queryMatch;
    });
  }, [students, globalSearch, studentClassFilter]);

  const filteredInvoices = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    return invoices.filter((item) => {
      const statusMatch = invoiceStatusFilter === 'All' || item.status === invoiceStatusFilter;
      const queryMatch = !query || `${item.invoiceNo} ${item.student} ${item.className}`.toLowerCase().includes(query);
      return statusMatch && queryMatch;
    });
  }, [invoices, globalSearch, invoiceStatusFilter]);

  const filteredMessages = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    return messages.filter((item) => {
      const priorityMatch = messagePriorityFilter === 'All' || item.priority === messagePriorityFilter;
      const queryMatch = !query || `${item.from} ${item.to} ${item.channel} ${item.preview}`.toLowerCase().includes(query);
      return priorityMatch && queryMatch;
    });
  }, [messages, globalSearch, messagePriorityFilter]);

  const attendanceSummary = useMemo(() => {
    const totals = attendance.reduce((acc, row) => {
      acc.present += row.present;
      acc.absent += row.absent;
      acc.late += row.late;
      return acc;
    }, { present: 0, absent: 0, late: 0 });

    const total = totals.present + totals.absent + totals.late;
    const rate = total ? Math.round((totals.present / total) * 100) : 0;

    return { ...totals, rate };
  }, [attendance]);

  const invoiceSummary = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter((item) => item.status === 'Paid').length,
    unpaid: invoices.filter((item) => item.status !== 'Paid').length,
    pendingAmount: invoices.filter((item) => item.status !== 'Paid').reduce((sum, item) => sum + item.amount, 0)
  }), [invoices]);

  const resultSummary = useMemo(() => {
    if (!results.length) return { average: 0, top: '-', atRisk: 0 };
    const average = (results.reduce((sum, item) => sum + item.score, 0) / results.length).toFixed(1);
    const top = [...results].sort((a, b) => b.score - a.score)[0]?.student || '-';
    const atRisk = results.filter((item) => item.score < 10).length;
    return { average, top, atRisk };
  }, [results]);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => item.unread),
    [notifications]
  );

  const dashboardMetrics = useMemo(() => ([
    { label: 'School Status', value: schoolProfile.status, icon: FaSchool, hint: `${schoolProfile.schoolName} • ${schoolProfile.currentTerm}` },
    { label: 'Total Users', value: users.length, icon: FaUsers, hint: `${users.filter((item) => item.status === 'Active').length} active users` },
    { label: 'Total Students', value: students.length, icon: FaUserGraduate, hint: `${students.filter((item) => item.status === 'At Risk').length} at risk` },
    { label: 'Unpaid Invoices', value: invoiceSummary.unpaid, icon: FaFileInvoiceDollar, hint: formatCurrency(invoiceSummary.pendingAmount) }
  ]), [schoolProfile, users, students, invoiceSummary]);

  const reportData = useMemo(() => {
    const collections = invoices.filter((item) => item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
    const billed = invoices.reduce((sum, item) => sum + item.amount, 0);

    return {
      usersByRole: {
        Admin: users.filter((item) => item.role === 'Admin').length,
        Teachers: users.filter((item) => item.role === 'Teacher').length,
        Parents: users.filter((item) => item.role === 'Parent').length,
        Staff: users.filter((item) => item.role === 'Staff').length
      },
      billed,
      collections,
      outstanding: billed - collections,
      attendanceRate: attendanceSummary.rate,
      resultAverage: resultSummary.average
    };
  }, [users, invoices, attendanceSummary.rate, resultSummary.average]);

  const enrollmentByClass = useMemo(() => {
    const grouped = students.reduce((accumulator, item) => {
      accumulator[item.className] = (accumulator[item.className] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(grouped)
      .map(([className, count]) => ({ className, count }))
      .sort((left, right) => left.className.localeCompare(right.className));
  }, [students]);

  const attendanceTrend = useMemo(() => {
    return attendance.map((item) => {
      const total = item.present + item.absent + item.late;
      const rate = total ? Math.round((item.present / total) * 100) : 0;
      return {
        date: item.date,
        className: item.className,
        rate
      };
    });
  }, [attendance]);

  const communicationPulse = useMemo(() => {
    const highPriority = messages.filter((item) => item.priority === 'High').length;
    const normalPriority = messages.filter((item) => item.priority === 'Normal').length;
    const unread = unreadNotifications.length;

    return [
      { label: 'High Priority', value: highPriority },
      { label: 'Normal Priority', value: normalPriority },
      { label: 'Unread Alerts', value: unread }
    ];
  }, [messages, unreadNotifications]);

  const academicTermStructure = useMemo(
    () => getAcademicTermStructure(schoolProfile),
    [schoolProfile]
  );

  const sectionOptions = useMemo(() => {
    const normalized = normalizeSchoolConfig(schoolProfile);
    return normalized.sections || [];
  }, [schoolProfile]);

  useEffect(() => {
    const fallbackSection = sectionOptions[0];
    if (!fallbackSection) {
      return;
    }

    setUsers((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (sectionOptions.includes(item.section)) {
          return item;
        }
        changed = true;
        return { ...item, section: fallbackSection };
      });
      return changed ? next : prev;
    });

    setStudents((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (sectionOptions.includes(item.section)) {
          return item;
        }
        changed = true;
        return { ...item, section: fallbackSection };
      });
      return changed ? next : prev;
    });
  }, [sectionOptions]);

  useEffect(() => {
    if (!sectionOptions.length) {
      return;
    }
    setEnrollmentDraft((prev) => ({
      ...prev,
      section: sectionOptions.includes(prev.section) ? prev.section : sectionOptions[0]
    }));
  }, [sectionOptions]);

  useEffect(() => {
    if (!studentEnrollments.length) {
      return;
    }

    setStudents((prev) => {
      const byMatricule = new Map(prev.map((item) => [item.matricule || item.name, item]));
      let changed = false;

      studentEnrollments.forEach((entry) => {
        const key = entry.matricule || entry.name;
        const existing = byMatricule.get(key);
        const merged = {
          id: existing?.id || Date.now() + Math.floor(Math.random() * 1000),
          matricule: entry.matricule,
          name: entry.name,
          className: entry.className,
          section: entry.subSchool,
          parent: entry.parent || existing?.parent || 'N/A',
          attendance: existing?.attendance ?? 0,
          resultAverage: existing?.resultAverage ?? 0,
          feeStatus: existing?.feeStatus || 'Pending',
          platformFeePaid: entry.platformFeePaid,
          status: entry.platformFeePaid ? (existing?.status || 'Active') : 'Platform Fee Pending'
        };

        if (!existing || JSON.stringify(existing) !== JSON.stringify(merged)) {
          changed = true;
          byMatricule.set(key, merged);
        }
      });

      return changed ? Array.from(byMatricule.values()) : prev;
    });
  }, [studentEnrollments]);

  const classOptions = useMemo(() => ['All', ...Array.from(new Set(students.map((item) => item.className)))], [students]);

  const selectedProfileDetails = useMemo(() => {
    if (!selectedProfileTarget) {
      return null;
    }

    if (selectedProfileTarget.type === 'student') {
      const student = students.find((item) => item.id === selectedProfileTarget.id);
      if (!student) {
        return null;
      }

      const enrollment = studentEnrollments.find((item) => item.matricule === student.matricule || item.name === student.name);

      const parentAccount = users.find((item) => item.role === 'Parent' && item.name === student.parent);
      const studentResults = results.filter((item) => item.student === student.name);
      const studentInvoices = invoices.filter((item) => item.student === student.name);
      const classAttendanceRows = attendance.filter((item) => item.className === student.className);
      const averageScore = studentResults.length
        ? (studentResults.reduce((sum, item) => sum + item.score, 0) / studentResults.length).toFixed(1)
        : Number(student.resultAverage || 0).toFixed(1);

      return {
        name: student.name,
        role: 'Student',
        status: student.status,
        section: student.section || sectionOptions[0] || '-',
        schoolName: schoolProfile.schoolName,
        session: schoolProfile.currentSession,
        term: schoolProfile.currentTerm,
        email: parentAccount?.email || 'N/A',
        department: 'Academic Affairs',
        overview: [
          { label: 'Matricule', value: student.matricule || 'Not generated' },
          { label: 'Platform Fee', value: student.platformFeePaid ? 'PAID' : 'PENDING' },
          { label: 'Class', value: student.className },
          { label: 'Parent', value: student.parent },
          { label: 'Attendance', value: `${student.attendance}%` },
          { label: 'Result Average', value: `${averageScore}/20` }
        ],
        insights: [
          {
            title: 'Enrollment Identity',
            items: [
              `School Code: ${enrollment?.schoolCode || schoolProfile.schoolCode}`,
              `Sub-School: ${student.section || enrollment?.subSchool || 'N/A'}`,
              `Date of Birth: ${enrollment?.dateOfBirth || 'N/A'}`,
              `Guardian Phone: ${enrollment?.guardianPhone || 'N/A'}`,
              `Address: ${enrollment?.address || 'N/A'}`
            ]
          },
          {
            title: 'Results',
            items: studentResults.length
              ? studentResults.map((item) => `${item.subject}: ${item.score}/20 (${item.grade})`)
              : ['No subject result records yet.']
          },
          {
            title: 'Fees & Invoices',
            items: studentInvoices.length
              ? studentInvoices.map((item) => `${item.invoiceNo} • ${formatCurrency(item.amount)} • ${item.status}`)
              : ['No invoice records linked yet.']
          },
          {
            title: 'Class Attendance Logs',
            items: classAttendanceRows.length
              ? classAttendanceRows.map((item) => `${item.date} • Present ${item.present}, Absent ${item.absent}, Late ${item.late}`)
              : ['No attendance logs found for this class.']
          },
          {
            title: 'Access Status',
            items: student.platformFeePaid
              ? ['Platform fee confirmed. Student dashboard can be accessed.']
              : ['Platform fee pending. Student can see landing page only and dashboard remains locked.']
          }
        ]
      };
    }

    const user = users.find((item) => item.id === selectedProfileTarget.id);
    if (!user) {
      return null;
    }

    const roleMessages = messages.filter((item) => {
      const to = String(item.to || '').toLowerCase();
      const from = String(item.from || '').toLowerCase();
      return to.includes(String(user.role || '').toLowerCase()) || to.includes(String(user.name || '').toLowerCase()) || from.includes(String(user.name || '').toLowerCase());
    });

    const baseDetails = {
      name: user.name,
      role: user.role,
      status: user.status,
      section: user.section || sectionOptions[0] || '-',
      schoolName: schoolProfile.schoolName,
      session: schoolProfile.currentSession,
      term: schoolProfile.currentTerm,
      email: user.email,
      department: user.department,
      overview: [
        { label: 'Department', value: user.department },
        { label: 'Sub-School', value: user.section || sectionOptions[0] || '-' },
        { label: 'School Session', value: schoolProfile.currentSession },
        { label: 'Current Term', value: schoolProfile.currentTerm }
      ]
    };

    if (user.role === 'Teacher') {
      const assignedClasses = classes.filter((item) => item.teacher === user.name);
      const assignedSubjects = subjects.filter((item) => item.teacher === user.name);
      const scheduleRows = timetable.filter((item) => item.teacher === user.name);

      return {
        ...baseDetails,
        insights: [
          {
            title: 'Assigned Classes',
            items: assignedClasses.length
              ? assignedClasses.map((item) => `${item.name} • Room ${item.room} • ${item.students} students`)
              : ['No class assignment found.']
          },
          {
            title: 'Teaching Subjects',
            items: assignedSubjects.length
              ? assignedSubjects.map((item) => `${item.name} • ${item.weeklyPeriods} periods/week`)
              : ['No subject assignment found.']
          },
          {
            title: 'Timetable Records',
            items: scheduleRows.length
              ? scheduleRows.map((item) => `${item.day} • ${item.period} • ${item.className} (${item.subject})`)
              : ['No timetable entry linked yet.']
          }
        ]
      };
    }

    if (user.role === 'Parent') {
      const children = students.filter((item) => item.parent === user.name);
      const childNames = children.map((item) => item.name);
      const childInvoices = invoices.filter((item) => childNames.includes(item.student));

      return {
        ...baseDetails,
        insights: [
          {
            title: 'Children Linked',
            items: children.length
              ? children.map((item) => `${item.name} • ${item.className} • ${item.section || sectionOptions[0] || '-'}`)
              : ['No students currently linked.']
          },
          {
            title: 'Fee Obligations',
            items: childInvoices.length
              ? childInvoices.map((item) => `${item.student}: ${item.invoiceNo} • ${formatCurrency(item.amount)} • ${item.status}`)
              : ['No invoice records for linked students.']
          },
          {
            title: 'Communication',
            items: roleMessages.length
              ? roleMessages.map((item) => `${item.date} • ${item.channel} • ${item.preview}`)
              : ['No direct communication records.']
          }
        ]
      };
    }

    const departmentPeers = users.filter((item) => item.department === user.department && item.id !== user.id);
    return {
      ...baseDetails,
      insights: [
        {
          title: 'Department Team',
          items: departmentPeers.length
            ? departmentPeers.map((item) => `${item.name} • ${item.role} • ${item.status}`)
            : ['No additional staff in this department.']
        },
        {
          title: 'Operational Messages',
          items: roleMessages.length
            ? roleMessages.map((item) => `${item.date} • ${item.priority} • ${item.preview}`)
            : ['No communication records linked.']
        },
        {
          title: 'School Context',
          items: [
            `Principal: ${schoolProfile.principal}`,
            `Campus: ${schoolProfile.city}`,
            `School Code: ${schoolProfile.schoolCode}`
          ]
        }
      ]
    };
  }, [selectedProfileTarget, students, users, results, invoices, attendance, messages, classes, subjects, timetable, schoolProfile, sectionOptions, studentEnrollments]);

  const openUserDetails = (id) => {
    setSelectedProfileTarget({ type: 'user', id });
  };

  const openStudentDetails = (id) => {
    setSelectedProfileTarget({ type: 'student', id });
  };

  const renderUserProfilePanel = () => {
    if (!selectedProfileDetails) {
      return null;
    }

    return (
      <article className="admin-card admin-user-profile-panel">
        <div className="section-header compact">
          <h3>User 360 Profile</h3>
          <p>Comprehensive profile pulled from school, academic, finance and operations records.</p>
        </div>

        <div className="admin-user-profile-head">
          <div className="admin-user-profile-id">
            <img src={buildAvatar(selectedProfileDetails.name)} alt={selectedProfileDetails.name} />
            <div>
              <strong>{selectedProfileDetails.name}</strong>
              <span>{selectedProfileDetails.role} • {selectedProfileDetails.section}</span>
              <small>{selectedProfileDetails.schoolName} • {selectedProfileDetails.session} • {selectedProfileDetails.term}</small>
            </div>
          </div>
          <div className="admin-actions">
            <span className={`admin-badge ${selectedProfileDetails.status.toLowerCase().replace(' ', '-')}`}>{selectedProfileDetails.status}</span>
            <button type="button" className="row-action" onClick={() => setSelectedProfileTarget(null)}>Close Profile</button>
          </div>
        </div>

        <div className="admin-user-overview-grid">
          <article>
            <span>Email</span>
            <strong>{selectedProfileDetails.email || 'N/A'}</strong>
          </article>
          <article>
            <span>Department</span>
            <strong>{selectedProfileDetails.department || 'N/A'}</strong>
          </article>
          {selectedProfileDetails.overview.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <div className="admin-user-insight-grid">
          {selectedProfileDetails.insights.map((section) => (
            <div key={section.title} className="admin-user-insight-card">
              <h4>{section.title}</h4>
              <ul>
                {section.items.map((entry, index) => <li key={`${section.title}-${index}`}>{entry}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </article>
    );
  };

  const renderInlineProfileRow = (type, id, colSpan) => {
    if (!selectedProfileTarget || selectedProfileTarget.type !== type || selectedProfileTarget.id !== id) {
      return null;
    }

    if (!selectedProfileDetails) {
      return null;
    }

    return (
      <tr className="admin-profile-inline-row">
        <td colSpan={colSpan}>
          {renderUserProfilePanel()}
        </td>
      </tr>
    );
  };

  const updateAcademicTermCount = (count) => {
    const safeCount = Math.min(10, Math.max(1, Number(count) || 1));
    setSchoolProfile((prev) => {
      const existing = prev.academicStructure || [];
      const next = Array.from({ length: safeCount }, (_, index) => (
        existing[index] || { name: `Term ${index + 1}`, sequenceCount: 2 }
      ));
      const validCurrentTerm = next.some((item) => item.name === prev.currentTerm);

      return {
        ...prev,
        academicStructure: next,
        currentTerm: validCurrentTerm ? prev.currentTerm : next[0]?.name || prev.currentTerm
      };
    });
  };

  const updateAcademicTerm = (index, field, value) => {
    setSchoolProfile((prev) => {
      const nextStructure = [...(prev.academicStructure || [])];
      const current = nextStructure[index] || { name: `Term ${index + 1}`, sequenceCount: 2 };

      if (field === 'sequenceCount') {
        current.sequenceCount = Math.min(10, Math.max(1, Number(value) || 1));
      } else {
        const trimmedName = String(value || '').trim();
        current.name = trimmedName || `Term ${index + 1}`;
      }

      nextStructure[index] = current;

      const exists = nextStructure.some((item) => item.name === prev.currentTerm);
      return {
        ...prev,
        academicStructure: nextStructure,
        currentTerm: exists ? prev.currentTerm : nextStructure[0]?.name || prev.currentTerm
      };
    });
  };

  const toggleUserStatus = (id) => {
    setUsers((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      return { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' };
    }));
    setNotice('User access updated successfully.');
  };

  const assignUserSection = (id, section) => {
    setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, section } : item)));
    setNotice(`Sub-school assignment updated to ${section}.`);
  };

  const assignStudentSection = (id, section) => {
    let blocked = false;
    setStudents((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      if (!item.platformFeePaid) {
        blocked = true;
        return item;
      }
      return { ...item, section };
    }));
    if (blocked) {
      setNotice('Sub-school allocation is locked until platform fee is paid.');
      return;
    }
    setNotice(`Student sub-school assignment updated to ${section}.`);
  };

  const addSection = () => {
    const nextName = newSectionName.trim();
    if (!nextName) {
      alert('Please enter a sub-school name.');
      return;
    }

    if (sectionOptions.some((item) => item.toLowerCase() === nextName.toLowerCase())) {
      alert('That sub-school already exists.');
      return;
    }

    setSchoolProfile((prev) => normalizeSchoolConfig({
      ...prev,
      sections: [...(prev.sections || []), nextName]
    }));
    setNewSectionName('');
    setNotice(`Sub-school ${nextName} added.`);
  };

  const removeSection = (name) => {
    const nextSections = sectionOptions.filter((item) => item !== name);
    if (!nextSections.length) {
      alert('At least one sub-school is required.');
      return;
    }

    const fallbackSection = nextSections[0];
    setSchoolProfile((prev) => normalizeSchoolConfig({
      ...prev,
      sections: nextSections
    }));
    setUsers((prev) => prev.map((item) => (item.section === name ? { ...item, section: fallbackSection } : item)));
    setStudents((prev) => prev.map((item) => (item.section === name ? { ...item, section: fallbackSection } : item)));
    setNotice(`Sub-school ${name} removed. Linked records moved to ${fallbackSection}.`);
  };

  const toggleSchoolStatus = () => {
    const updated = normalizeSchoolConfig({
      ...schoolProfile,
      status: schoolProfile.status === 'Active' ? 'Inactive' : 'Active'
    });
    setSchoolProfile(updated);
    saveSchoolConfig(updated);
    setSavedSchoolProfileSnapshot(updated);
    setNotice('School status updated and applied across the platform.');
  };

  const protectSuperAdminFields = (draft) => ({
    ...draft,
    schoolName: savedSchoolProfileSnapshot.schoolName,
    shortName: savedSchoolProfileSnapshot.shortName,
    systemTitle: savedSchoolProfileSnapshot.systemTitle,
    schoolCode: savedSchoolProfileSnapshot.schoolCode,
    logoUrl: savedSchoolProfileSnapshot.logoUrl
  });

  const updateLandingSlide = (index, field, value) => {
    setSchoolProfile((prev) => {
      const nextSlides = [...prev.landingSlides];
      nextSlides[index] = {
        ...nextSlides[index],
        [field]: value
      };

      return normalizeSchoolConfig({
      ...prev,
        landingSlides: nextSlides
      });
    });
  };

  const saveSlideEditorDraft = () => {
    updateLandingSlide(activeSlideEditorIndex, 'title', slideEditorDraft.title);
    updateLandingSlide(activeSlideEditorIndex, 'subtitle', slideEditorDraft.subtitle);
    updateLandingSlide(activeSlideEditorIndex, 'image', slideEditorDraft.image);
    setNotice(`Slide ${activeSlideEditorIndex + 1} updated. Save school profile to publish everywhere.`);
  };

  const handleImageUpload = (event, onLoaded) => {
    const [file] = event.target.files || [];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        onLoaded(result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const saveSchoolProfile = () => {
    const normalized = normalizeSchoolConfig(protectSuperAdminFields(schoolProfile));
    const persisted = saveSchoolConfig(normalized);
    setSchoolProfile(persisted);
    setSavedSchoolProfileSnapshot(persisted);
    setNotice('School profile saved. Core identity fields are managed by Super Admin only.');
  };

  const resetSchoolProfileDraft = () => {
    setSchoolProfile(savedSchoolProfileSnapshot);
    setNotice('School customization changes reverted to last saved state.');
  };

  const promoteStudent = (id) => {
    setStudents((prev) => prev.map((student) => {
      if (student.id !== id) return student;
      if (!student.platformFeePaid) return student;
      const match = student.className.match(/(\d+)/);
      if (!match) return student;
      const nextLevel = Number(match[1]) + 1;
      return { ...student, className: `Grade ${nextLevel}` };
    }));
    setNotice('Student promoted to the next class level.');
  };

  const downloadStudentEnrollmentPdf = (student) => {
    const enrollment = studentEnrollments.find((item) => item.matricule === student.matricule);
    const doc = new jsPDF();
    const lines = [
      `School: ${schoolProfile.schoolName}`,
      `School Code: ${schoolProfile.schoolCode}`,
      `Student Name: ${student.name}`,
      `Matricule: ${student.matricule || 'N/A'}`,
      `Sub-School: ${student.section || 'N/A'}`,
      `Class: ${student.className || 'N/A'}`,
      `Parent/Guardian: ${student.parent || enrollment?.parent || 'N/A'}`,
      `Gender: ${enrollment?.gender || 'N/A'}`,
      `Date of Birth: ${enrollment?.dateOfBirth || 'N/A'}`,
      `Guardian Phone: ${enrollment?.guardianPhone || 'N/A'}`,
      `Address: ${enrollment?.address || 'N/A'}`,
      `Platform Fee Status: ${student.platformFeePaid ? 'Paid' : 'Pending'}`,
      `Enrolled At: ${enrollment?.enrolledAt || new Date().toISOString().slice(0, 10)}`
    ];

    doc.setFontSize(16);
    doc.text('Student Enrollment Form', 14, 20);
    doc.setFontSize(11);
    lines.forEach((line, index) => doc.text(line, 14, 35 + index * 8));
    doc.save(`${(student.matricule || student.name || 'student').replace(/\s+/g, '-')}-enrollment-form.pdf`);
  };

  const enrollStudentFromAdmin = () => {
    const safeName = enrollmentDraft.name.trim();
    const safeClass = enrollmentDraft.className.trim();
    const safeSection = enrollmentDraft.section.trim();

    if (!safeName || !safeClass || !safeSection) {
      alert('Please complete at least student name, class and sub-school.');
      return;
    }

    const created = enrollStudentRecord({
      schoolCode: schoolProfile.schoolCode,
      name: safeName,
      className: safeClass,
      subSchool: safeSection,
      parent: enrollmentDraft.parent,
      gender: enrollmentDraft.gender,
      dateOfBirth: enrollmentDraft.dateOfBirth,
      guardianPhone: enrollmentDraft.guardianPhone,
      address: enrollmentDraft.address
    });

    setStudents((prev) => [
      {
        id: Date.now(),
        matricule: created.matricule,
        name: created.name,
        className: created.className,
        section: created.subSchool,
        parent: created.parent || 'N/A',
        attendance: 0,
        resultAverage: 0,
        feeStatus: 'Pending',
        platformFeePaid: false,
        status: 'Platform Fee Pending'
      },
      ...prev.filter((item) => item.matricule !== created.matricule)
    ]);

    setEnrollmentDraft((prev) => ({
      ...prev,
      name: '',
      className: prev.className,
      parent: '',
      gender: 'Not Specified',
      dateOfBirth: '',
      guardianPhone: '',
      address: ''
    }));

    setNotice(`Student enrolled successfully. Generated matricule: ${created.matricule}`);
    setShowEnrollmentForm(false);
    downloadStudentEnrollmentPdf({
      matricule: created.matricule,
      name: created.name,
      className: created.className,
      section: created.subSchool,
      parent: created.parent,
      platformFeePaid: created.platformFeePaid
    });
  };

  const toggleStudentPlatformFee = (student) => {
    if (!student.matricule) {
      alert('This student has no registered matricule yet.');
      return;
    }

    const updated = updateStudentPlatformFee(student.matricule, !student.platformFeePaid);

    setStudents((prev) => prev.map((item) => {
      if (item.id !== student.id) return item;
      return {
        ...item,
        platformFeePaid: Boolean(updated?.platformFeePaid),
        status: updated?.platformFeePaid ? 'Active' : 'Platform Fee Pending'
      };
    }));

    setNotice(`Platform fee marked as ${updated?.platformFeePaid ? 'PAID' : 'PENDING'} for ${student.name}.`);
  };

  const markInvoicePaid = (id) => {
    setInvoices((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'Paid' } : item)));
    setNotice('Invoice marked as paid and financial stats refreshed.');
  };

  const publishAnnouncement = () => {
    const title = newAnnouncement.title.trim();
    const message = newAnnouncement.message.trim();

    if (!title || !message) {
      alert('Please complete announcement title and message.');
      return;
    }

    const item = {
      id: Date.now(),
      ...newAnnouncement,
      title,
      message
    };

    setAnnouncements((prev) => [item, ...prev]);
    setNotifications((prev) => [
      {
        id: Date.now() + 1,
        title: `New announcement: ${title}`,
        date: item.date,
        unread: true,
        view: 'announcements'
      },
      ...prev
    ]);
    setNewAnnouncement({ title: '', type: 'General', audience: 'All', date: '2026-03-15', message: '' });
    setNotice('Announcement published to the selected audience.');
  };

  const sendMessage = () => {
    const body = newMessage.preview.trim();
    if (!body) {
      alert('Please enter a message before sending.');
      return;
    }

    const message = {
      id: Date.now(),
      from: profile?.name || 'Admin Office',
      to: newMessage.to,
      channel: newMessage.channel,
      priority: newMessage.priority,
      date: new Date().toISOString().slice(0, 10),
      preview: body
    };

    setMessages((prev) => [message, ...prev]);
    setNewMessage({ to: 'Teachers', channel: 'Internal', priority: 'Normal', preview: '' });
    setNotice('Message sent successfully.');
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
    setNotice('All notifications marked as read.');
  };

  const saveSettings = () => {
    setSettingsSnapshot({ ...settingsDraft });
    setSettingsSavedAt(new Date().toLocaleString());
    setNotice('Admin settings saved and synced.');
  };

  const resetSettings = () => {
    setSettingsDraft({ ...settingsSnapshot });
    setNotice('Settings reverted to last saved snapshot.');
  };

  const defaultsSettings = () => {
    setSettingsDraft({ ...DEFAULT_ADMIN_SETTINGS });
    setNotice('Default admin settings restored.');
  };

  const exportReportsPdf = () => {
    const pdf = new jsPDF();
    const rows = [
      `Users - Admin: ${reportData.usersByRole.Admin}`,
      `Users - Teachers: ${reportData.usersByRole.Teachers}`,
      `Users - Parents: ${reportData.usersByRole.Parents}`,
      `Users - Staff: ${reportData.usersByRole.Staff}`,
      `Billed: ${formatCurrency(reportData.billed)}`,
      `Collected: ${formatCurrency(reportData.collections)}`,
      `Outstanding: ${formatCurrency(reportData.outstanding)}`,
      `Attendance Rate: ${reportData.attendanceRate}%`,
      `Result Average: ${reportData.resultAverage}/20`
    ];

    pdf.setFontSize(16);
    pdf.text('EduIgnite - Administration Summary Report', 14, 20);
    pdf.setFontSize(11);
    rows.forEach((line, index) => pdf.text(line, 14, 36 + index * 8));
    pdf.save('admin-summary-report.pdf');
  };

  const exportFinanceCsv = () => {
    exportCsv(
      invoices.map((item) => ({
        Invoice: item.invoiceNo,
        Student: item.student,
        Class: item.className,
        Amount: item.amount,
        DueDate: item.dueDate,
        Status: item.status
      })),
      'admin-invoices.csv'
    );
  };

  const renderDashboard = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Administration Control Center</h2>
        <p>Manage your school users, academics, operations and finance from one secure workspace.</p>
      </div>

      <div className="admin-metric-grid">
        {dashboardMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label}>
              <div className="admin-metric-head">
                <span>{metric.label}</span>
                <Icon />
              </div>
              <strong>{metric.value}</strong>
              <small>{metric.hint}</small>
            </article>
          );
        })}
      </div>

      <div className="admin-dual-grid">
        <article className="admin-card">
          <div className="section-header compact">
            <h3>Critical Alerts</h3>
          </div>
          <ul className="admin-alert-list">
            {invoiceSummary.unpaid > 0 && (
              <li>
                <FaExclamationTriangle />
                <span>{invoiceSummary.unpaid} invoices are still unpaid.</span>
              </li>
            )}
            {attendanceSummary.rate < Number(settingsDraft.attendanceAlertThreshold) && (
              <li>
                <FaExclamationTriangle />
                <span>Attendance rate is below configured threshold.</span>
              </li>
            )}
            {unreadNotifications.length === 0 && (
              <li className="ok">
                <FaCheckCircle />
                <span>No critical alerts right now.</span>
              </li>
            )}
          </ul>
        </article>

        <article className="admin-card">
          <div className="section-header compact">
            <h3>Quick Actions</h3>
          </div>
          <div className="admin-actions">
            <button type="button" onClick={() => setActiveView('users')}>Manage Users</button>
            <button type="button" onClick={() => setActiveView('invoices')}>Resolve Invoices</button>
            <button type="button" onClick={() => setActiveView('attendance')}>Inspect Attendance</button>
            <button type="button" onClick={() => setActiveView('reports')}>Open Reports</button>
          </div>
        </article>
      </div>

      <div className="admin-trend-card">
        <div className="section-header compact">
          <h3>School Fee Snapshot</h3>
        </div>
        <div className="admin-kpi-row">
          <article>
            <span>Total Billed</span>
            <strong>{formatCurrency(reportData.billed)}</strong>
          </article>
          <article>
            <span>Collections</span>
            <strong>{formatCurrency(reportData.collections)}</strong>
          </article>
          <article>
            <span>Outstanding Fees</span>
            <strong>{formatCurrency(reportData.outstanding)}</strong>
          </article>
          <article>
            <span>Attendance Rate</span>
            <strong>{reportData.attendanceRate}%</strong>
          </article>
        </div>
      </div>

      <div className="admin-dual-grid admin-chart-section">
        <article className="admin-card">
          <div className="section-header compact">
            <h3>Enrollment by Class</h3>
          </div>
          <div className="admin-inline-chart">
            {!enrollmentByClass.length && <p className="attendance-empty">No enrollment data available.</p>}
            {enrollmentByClass.map((item) => (
              <div key={item.className} className="admin-inline-chart-row">
                <span>{item.className}</span>
                <div>
                  <i style={{ width: `${Math.min(100, item.count * 20)}%` }} />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="section-header compact">
            <h3>Attendance Trend</h3>
          </div>
          <div className="admin-inline-chart">
            {!attendanceTrend.length && <p className="attendance-empty">No attendance trend available.</p>}
            {attendanceTrend.map((item) => (
              <div key={`${item.date}-${item.className}`} className="admin-inline-chart-row">
                <span>{item.className} ({item.date})</span>
                <div>
                  <i style={{ width: `${item.rate}%` }} />
                </div>
                <strong>{item.rate}%</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Communication Pulse</h3>
        </div>
        <div className="admin-mini-kpis">
          {communicationPulse.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  );

  const renderSchools = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>School</h2>
        <p>Customize your school platform branding, landing page content and general school information.</p>
      </div>

      <div className="admin-notice">
        Super Admin Controlled: School Name, Short Name, Platform Title, School Code and Logo.
      </div>

      <div className="admin-kpi-row compact">
        <article><span>School Name</span><strong>{schoolProfile.schoolName}</strong></article>
        <article><span>School Code</span><strong>{schoolProfile.schoolCode}</strong></article>
        <article><span>Current Session</span><strong>{schoolProfile.currentSession}</strong></article>
        <article><span>Academic Structure</span><strong>{academicTermStructure.length} Terms • {sectionOptions.length} Sub-Schools</strong></article>
      </div>

      <div className="admin-control-grid">
        <label>
          School Name
          <input type="text" value={schoolProfile.schoolName} readOnly />
        </label>
        <label>
          Short Name
          <input type="text" value={schoolProfile.shortName} readOnly />
        </label>
        <label>
          Platform Title
          <input type="text" value={schoolProfile.systemTitle} readOnly />
        </label>
        <label>
          School Code
          <input type="text" value={schoolProfile.schoolCode} readOnly />
        </label>
        <label className="admin-field-span">
          Logo URL
          <input type="text" value={schoolProfile.logoUrl} readOnly />
        </label>
      </div>

      <div className="admin-control-grid">
        <label>
          Principal
          <input
            type="text"
            value={schoolProfile.principal}
            onChange={(event) => setSchoolProfile((prev) => ({ ...prev, principal: event.target.value }))}
          />
        </label>
        <label>
          City
          <input
            type="text"
            value={schoolProfile.city}
            onChange={(event) => setSchoolProfile((prev) => ({ ...prev, city: event.target.value }))}
          />
        </label>
        <label>
          Academic Session
          <input
            type="text"
            value={schoolProfile.currentSession}
            onChange={(event) => setSchoolProfile((prev) => ({ ...prev, currentSession: event.target.value }))}
            placeholder="e.g. 2025 / 2026"
          />
        </label>
        <label>
          Current Term
          <select
            value={schoolProfile.currentTerm}
            onChange={(event) => setSchoolProfile((prev) => ({ ...prev, currentTerm: event.target.value }))}
          >
            {academicTermStructure.map((term) => (
              <option key={term.name} value={term.name}>{term.name}</option>
            ))}
          </select>
        </label>
      </div>

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Terms & Sequences</h3>
        </div>
        <div className="admin-control-grid">
          <label>
            Number of Terms
            <input
              type="number"
              min="1"
              max="10"
              value={(schoolProfile.academicStructure || []).length}
              onChange={(event) => updateAcademicTermCount(event.target.value)}
            />
          </label>
        </div>
        <div className="admin-academic-grid">
          {(schoolProfile.academicStructure || []).map((term, index) => (
            <div key={`${term.name}-${index}`} className="admin-academic-item">
              <strong>Term #{index + 1}</strong>
              <label>
                Term Name
                <input
                  type="text"
                  value={term.name}
                  onChange={(event) => updateAcademicTerm(index, 'name', event.target.value)}
                />
              </label>
              <label>
                Number of Sequences
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={term.sequenceCount}
                  onChange={(event) => updateAcademicTerm(index, 'sequenceCount', event.target.value)}
                />
              </label>
            </div>
          ))}
        </div>
      </article>

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Sub-Schools (Sections)</h3>
          <p>Create internal schools such as English School, French School or Technical School and allocate people during enrollment.</p>
        </div>
        <div className="admin-control-grid">
          <label>
            Add New Sub-School
            <input
              type="text"
              value={newSectionName}
              onChange={(event) => setNewSectionName(event.target.value)}
              placeholder="e.g. Bilingual School"
            />
          </label>
          <label>
            Existing Sub-Schools
            <div className="admin-section-list" role="list" aria-label="Sub-schools list">
              {sectionOptions.map((section) => (
                <span key={section} className="admin-section-pill" role="listitem">
                  {section}
                  <button type="button" onClick={() => removeSection(section)} aria-label={`Remove ${section}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </label>
        </div>
        <div className="admin-actions">
          <button type="button" onClick={addSection}>Add Sub-School</button>
        </div>
      </article>

      <div className="admin-control-grid">
        <label>
          Contact Email
          <input
            type="email"
            value={schoolProfile.contactEmail}
            onChange={(event) => setSchoolProfile((prev) => ({ ...prev, contactEmail: event.target.value }))}
          />
        </label>
        <label>
          Contact Phone
          <input
            type="text"
            value={schoolProfile.contactPhone}
            onChange={(event) => setSchoolProfile((prev) => ({ ...prev, contactPhone: event.target.value }))}
          />
        </label>
        <label className="admin-field-span">
          School Address
          <input
            type="text"
            value={schoolProfile.address}
            onChange={(event) => setSchoolProfile((prev) => ({ ...prev, address: event.target.value }))}
          />
        </label>
      </div>

      <div className="admin-control-grid">
        <label className="admin-field-span">
          School Motto
          <input
            type="text"
            value={schoolProfile.motto}
            onChange={(event) => setSchoolProfile((prev) => ({ ...prev, motto: event.target.value }))}
          />
        </label>
        <label className="admin-field-span">
          About School
          <textarea
            rows="2"
            value={schoolProfile.about}
            onChange={(event) => setSchoolProfile((prev) => ({ ...prev, about: event.target.value }))}
            placeholder="General school description"
          />
        </label>
        <label className="admin-field-span">
          Landing Footer Note
          <textarea
            rows="2"
            value={schoolProfile.landingNote}
            onChange={(event) => setSchoolProfile((prev) => ({ ...prev, landingNote: event.target.value }))}
            placeholder="Message shown at the bottom of landing page"
          />
        </label>
      </div>

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Landing Page Slides</h3>
        </div>
        <div className="admin-slide-cards">
          {schoolProfile.landingSlides.map((slide, index) => (
            <button
              type="button"
              key={slide.id}
              className={`admin-slide-card ${activeSlideEditorIndex === index ? 'active' : ''}`}
              onClick={() => {
                setActiveSlideEditorIndex(index);
                setSlideEditorDraft(slide);
              }}
            >
              <img src={slide.image} alt={`Slide ${index + 1}`} />
              <div>
                <strong>Slide {index + 1}: {slide.title}</strong>
                <p>{slide.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="admin-landing-item admin-slide-editor">
          <strong>Edit Slide {activeSlideEditorIndex + 1}</strong>
          <label>
            Title
            <input
              type="text"
              value={slideEditorDraft?.title || ''}
              onChange={(event) => setSlideEditorDraft((prev) => ({ ...(prev || {}), title: event.target.value }))}
            />
          </label>
          <label>
            Subtitle
            <textarea
              rows="2"
              value={slideEditorDraft?.subtitle || ''}
              onChange={(event) => setSlideEditorDraft((prev) => ({ ...(prev || {}), subtitle: event.target.value }))}
            />
          </label>
          <label>
            Background Image URL
            <input
              type="text"
              value={slideEditorDraft?.image || ''}
              onChange={(event) => setSlideEditorDraft((prev) => ({ ...(prev || {}), image: event.target.value }))}
            />
            <div className="admin-upload-row">
              <label className="admin-upload-btn">
                Upload Slide Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageUpload(event, (value) => setSlideEditorDraft((prev) => ({ ...(prev || {}), image: value })))}
                />
              </label>
            </div>
          </label>

          <div className="admin-actions">
            <button type="button" onClick={saveSlideEditorDraft}>Save This Slide</button>
          </div>
        </div>
      </article>

      <div className="admin-actions">
        <button type="button" onClick={saveSchoolProfile}>Save School Profile</button>
        <button type="button" onClick={resetSchoolProfileDraft}>Revert Unsaved Changes</button>
        <button type="button" className="row-action" onClick={toggleSchoolStatus}>
          {schoolProfile.status === 'Active' ? 'Deactivate School Access' : 'Activate School Access'}
        </button>
        <span className={`admin-badge ${schoolProfile.status.toLowerCase()}`}>{schoolProfile.status}</span>
      </div>

      <p className="admin-school-hint">
        Saved changes update login branding, landing page content, header branding, and all dashboard sidebars.
      </p>
    </section>
  );

  const renderUsers = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Users</h2>
        <p>Create governance over all accounts, permissions and account states.</p>
      </div>

      <div className="admin-control-grid">
        <label>
          Search users
          <input
            type="text"
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Search by name, email, role or department"
          />
        </label>
        <label>
          Role
          <select value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}>
            <option>All</option>
            <option>Admin</option>
            <option>Teacher</option>
            <option>Parent</option>
            <option>Staff</option>
          </select>
        </label>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Sub-School</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((item) => (
              <React.Fragment key={item.id}>
                <tr>
                  <td>{item.name}</td>
                  <td>{item.role}</td>
                  <td>{item.department}</td>
                  <td>
                    <select value={item.section || sectionOptions[0] || ''} onChange={(event) => assignUserSection(item.id, event.target.value)}>
                      {sectionOptions.map((section) => <option key={section}>{section}</option>)}
                    </select>
                  </td>
                  <td>{item.email}</td>
                  <td><span className={`admin-badge ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="row-action" onClick={() => openUserDetails(item.id)}>
                        View Profile
                      </button>
                      <button type="button" className="row-action" onClick={() => toggleUserStatus(item.id)}>
                        Toggle Access
                      </button>
                    </div>
                  </td>
                </tr>
                {renderInlineProfileRow('user', item.id, 7)}
              </React.Fragment>
            ))}
            {!filteredUsers.length && (
              <tr>
                <td colSpan="7" className="attendance-empty">No users match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderStudents = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Students</h2>
        <p>Enroll students, generate matricules, track platform fee payment and control academic records.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total</span><strong>{students.length}</strong></article>
        <article><span>At Risk</span><strong>{students.filter((item) => item.status === 'At Risk').length}</strong></article>
        <article><span>Platform Paid</span><strong>{students.filter((item) => item.platformFeePaid).length}</strong></article>
        <article><span>Platform Pending</span><strong>{students.filter((item) => !item.platformFeePaid).length}</strong></article>
      </div>

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Enroll Student</h3>
          <p>Register student identity and generate matricule using school code, student name and sub-school.</p>
        </div>

        {!showEnrollmentForm && (
          <div className="admin-actions">
            <button type="button" onClick={() => setShowEnrollmentForm(true)}>Enroll Student</button>
          </div>
        )}

        {showEnrollmentForm && (
          <>
            <div className="admin-control-grid">
              <label>
                Student Full Name
                <input
                  type="text"
                  value={enrollmentDraft.name}
                  onChange={(event) => setEnrollmentDraft((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Sonia Mbella"
                />
              </label>
              <label>
                Class
                <input
                  type="text"
                  value={enrollmentDraft.className}
                  onChange={(event) => setEnrollmentDraft((prev) => ({ ...prev, className: event.target.value }))}
                  placeholder="e.g. Grade 6"
                />
              </label>
              <label>
                Sub-School
                <select
                  value={enrollmentDraft.section}
                  onChange={(event) => setEnrollmentDraft((prev) => ({ ...prev, section: event.target.value }))}
                >
                  {sectionOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Parent / Guardian Name
                <input
                  type="text"
                  value={enrollmentDraft.parent}
                  onChange={(event) => setEnrollmentDraft((prev) => ({ ...prev, parent: event.target.value }))}
                  placeholder="e.g. Marie Mbella"
                />
              </label>
              <label>
                Gender
                <select
                  value={enrollmentDraft.gender}
                  onChange={(event) => setEnrollmentDraft((prev) => ({ ...prev, gender: event.target.value }))}
                >
                  <option>Not Specified</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </label>
              <label>
                Date of Birth
                <input
                  type="date"
                  value={enrollmentDraft.dateOfBirth}
                  onChange={(event) => setEnrollmentDraft((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
                />
              </label>
              <label>
                Guardian Phone
                <input
                  type="text"
                  value={enrollmentDraft.guardianPhone}
                  onChange={(event) => setEnrollmentDraft((prev) => ({ ...prev, guardianPhone: event.target.value }))}
                  placeholder="e.g. 677123456"
                />
              </label>
              <label>
                Address
                <input
                  type="text"
                  value={enrollmentDraft.address}
                  onChange={(event) => setEnrollmentDraft((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="e.g. Douala - Bonapriso"
                />
              </label>
            </div>

            <div className="admin-actions">
              <button type="button" onClick={enrollStudentFromAdmin}>Enroll Student + Download PDF Form</button>
              <button type="button" className="row-action" onClick={() => setShowEnrollmentForm(false)}>Hide Form</button>
            </div>
          </>
        )}
      </article>

      <div className="admin-control-grid">
        <label>
          Search
          <input
            type="text"
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Search by student, parent or class"
          />
        </label>
        <label>
          Class
          <select value={studentClassFilter} onChange={(event) => setStudentClassFilter(event.target.value)}>
            {classOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Student</th>
              <th>Class</th>
              <th>Sub-School</th>
              <th>Parent</th>
              <th>Platform Fee</th>
              <th>Attendance</th>
              <th>Average</th>
              <th>Fee Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((item) => (
              <React.Fragment key={item.id}>
                <tr>
                  <td>{item.matricule || '-'}</td>
                  <td>{item.name}</td>
                  <td>{item.className}</td>
                  <td>
                    <select
                      value={item.section || sectionOptions[0] || ''}
                      onChange={(event) => assignStudentSection(item.id, event.target.value)}
                      disabled={!item.platformFeePaid}
                    >
                      {sectionOptions.map((section) => <option key={section}>{section}</option>)}
                    </select>
                  </td>
                  <td>{item.parent}</td>
                  <td>
                    <span className={`admin-badge ${item.platformFeePaid ? 'paid' : 'unpaid'}`}>
                      {item.platformFeePaid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td>{item.attendance}%</td>
                  <td>{item.resultAverage}/20</td>
                  <td><span className={`admin-badge ${item.feeStatus.toLowerCase()}`}>{item.feeStatus}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="row-action" onClick={() => openStudentDetails(item.id)}>
                        View Profile
                      </button>
                      <button type="button" className="row-action" onClick={() => downloadStudentEnrollmentPdf(item)}>
                        PDF Form
                      </button>
                      <button type="button" className="row-action" onClick={() => toggleStudentPlatformFee(item)}>
                        {item.platformFeePaid ? 'Mark Unpaid' : 'Confirm Paid'}
                      </button>
                      <button type="button" className="row-action" onClick={() => promoteStudent(item.id)} disabled={!item.platformFeePaid}>
                        Promote
                      </button>
                    </div>
                    {!item.platformFeePaid && <small className="admin-cell-note">Academic updates locked until platform fee is paid.</small>}
                  </td>
                </tr>
                {renderInlineProfileRow('student', item.id, 10)}
              </React.Fragment>
            ))}
            {!filteredStudents.length && (
              <tr>
                <td colSpan="10" className="attendance-empty">No students match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderSimpleRoleTable = (title, subtitle, rows, role) => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total {title}</span><strong>{rows.length}</strong></article>
        <article><span>Active</span><strong>{rows.filter((item) => item.status === 'Active').length}</strong></article>
        <article><span>Departments</span><strong>{new Set(rows.map((item) => item.department)).size || 1}</strong></article>
        <article><span>Sub-Schools</span><strong>{new Set(rows.map((item) => item.section || sectionOptions[0])).size || 1}</strong></article>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Sub-School</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <React.Fragment key={item.id}>
                <tr>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.department}</td>
                  <td>
                    <select value={item.section || sectionOptions[0] || ''} onChange={(event) => assignUserSection(item.id, event.target.value)}>
                      {sectionOptions.map((section) => <option key={section}>{section}</option>)}
                    </select>
                  </td>
                  <td><span className={`admin-badge ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="row-action" onClick={() => openUserDetails(item.id)}>
                        View Profile
                      </button>
                      <button type="button" className="row-action" onClick={() => toggleUserStatus(item.id)}>
                        {item.status === 'Active' ? `Suspend ${role}` : `Activate ${role}`}
                      </button>
                    </div>
                  </td>
                </tr>
                {renderInlineProfileRow('user', item.id, 6)}
              </React.Fragment>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan="6" className="attendance-empty">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderClasses = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Classes</h2>
        <p>Coordinate class ownership, room allocation and class size distribution.</p>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Class</th>
              <th>Level</th>
              <th>Teacher</th>
              <th>Room</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.level}</td>
                <td>{item.teacher}</td>
                <td>{item.room}</td>
                <td>{item.students}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderSubjects = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Subjects</h2>
        <p>Align subjects with departments, teaching load and responsible teachers.</p>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Department</th>
              <th>Teacher</th>
              <th>Weekly Periods</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.department}</td>
                <td>{item.teacher}</td>
                <td>{item.weeklyPeriods}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderDepartments = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Departments</h2>
        <p>Manage leadership and staffing distribution across departments.</p>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Head</th>
              <th>Staff Count</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.head}</td>
                <td>{item.staffCount}</td>
                <td><span className={`admin-badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderTimetable = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Timetable</h2>
        <p>Central timetable visibility to maintain teaching load and room utilization.</p>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Class</th>
              <th>Period</th>
              <th>Subject</th>
              <th>Teacher</th>
            </tr>
          </thead>
          <tbody>
            {timetable.map((item) => (
              <tr key={item.id}>
                <td>{item.day}</td>
                <td>{item.className}</td>
                <td>{item.period}</td>
                <td>{item.subject}</td>
                <td>{item.teacher}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderAttendance = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Attendance</h2>
        <p>Track presence trends and identify underperforming attendance segments.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Present</span><strong>{attendanceSummary.present}</strong></article>
        <article><span>Absent</span><strong>{attendanceSummary.absent}</strong></article>
        <article><span>Late</span><strong>{attendanceSummary.late}</strong></article>
        <article><span>Overall Rate</span><strong>{attendanceSummary.rate}%</strong></article>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Class</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((item) => (
              <tr key={item.id}>
                <td>{item.date}</td>
                <td>{item.className}</td>
                <td>{item.present}</td>
                <td>{item.absent}</td>
                <td>{item.late}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderAssignments = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Assignments</h2>
        <p>Control assignment publication and submission status by class and subject.</p>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.className}</td>
                <td>{item.subject}</td>
                <td>{item.dueDate}</td>
                <td><span className={`admin-badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderExams = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Exams</h2>
        <p>Supervise exam scheduling, readiness and completion across all levels.</p>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.className}</td>
                <td>{item.subject}</td>
                <td>{item.date}</td>
                <td><span className={`admin-badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderResults = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Results</h2>
        <p>Validate academic performance and flag learners requiring intervention.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Average Score</span><strong>{resultSummary.average}/20</strong></article>
        <article><span>Top Performer</span><strong>{resultSummary.top}</strong></article>
        <article><span>Below Pass Mark</span><strong>{resultSummary.atRisk}</strong></article>
        <article><span>Total Records</span><strong>{results.length}</strong></article>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Score</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item) => (
              <tr key={item.id}>
                <td>{item.student}</td>
                <td>{item.className}</td>
                <td>{item.subject}</td>
                <td>{item.score}/20</td>
                <td>{item.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderFees = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Fees Structure</h2>
        <p>Manage school fees policy and fee items used in invoice generation.</p>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Level</th>
              <th>Term</th>
              <th>Amount</th>
              <th>Mandatory</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((item) => (
              <tr key={item.id}>
                <td>{item.item}</td>
                <td>{item.level}</td>
                <td>{item.term}</td>
                <td>{formatCurrency(item.amount)}</td>
                <td>{item.mandatory ? 'Yes' : 'No'}</td>
                <td><span className={`admin-badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderInvoices = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Invoices</h2>
        <p>Monitor receivables and enforce financial compliance across learners.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total Invoices</span><strong>{invoiceSummary.total}</strong></article>
        <article><span>Paid</span><strong>{invoiceSummary.paid}</strong></article>
        <article><span>Unpaid</span><strong>{invoiceSummary.unpaid}</strong></article>
        <article><span>Outstanding</span><strong>{formatCurrency(invoiceSummary.pendingAmount)}</strong></article>
      </div>

      <div className="admin-control-grid">
        <label>
          Search
          <input
            type="text"
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Search by invoice, class or student"
          />
        </label>
        <label>
          Status
          <select value={invoiceStatusFilter} onChange={(event) => setInvoiceStatusFilter(event.target.value)}>
            <option>All</option>
            <option>Paid</option>
            <option>Unpaid</option>
          </select>
        </label>
        <button type="button" className="row-action" onClick={exportFinanceCsv}>Export CSV</button>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Student</th>
              <th>Class</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((item) => (
              <tr key={item.id}>
                <td>{item.invoiceNo}</td>
                <td>{item.student}</td>
                <td>{item.className}</td>
                <td>{formatCurrency(item.amount)}</td>
                <td>{item.dueDate}</td>
                <td><span className={`admin-badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
                <td>
                  <button
                    type="button"
                    className="row-action"
                    onClick={() => markInvoicePaid(item.id)}
                    disabled={item.status === 'Paid'}
                  >
                    Mark Paid
                  </button>
                </td>
              </tr>
            ))}
            {!filteredInvoices.length && (
              <tr>
                <td colSpan="7" className="attendance-empty">No invoices match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderAnnouncements = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Announcements</h2>
        <p>Broadcast policy updates and critical notices to all school actors.</p>
      </div>

      <div className="admin-compose-grid">
        <label>
          Title
          <input
            type="text"
            value={newAnnouncement.title}
            onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Announcement title"
          />
        </label>
        <label>
          Type
          <select
            value={newAnnouncement.type}
            onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, type: event.target.value }))}
          >
            <option>General</option>
            <option>Academic</option>
            <option>Finance</option>
            <option>Emergency</option>
          </select>
        </label>
        <label>
          Audience
          <select
            value={newAnnouncement.audience}
            onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, audience: event.target.value }))}
          >
            <option>All</option>
            <option>Students</option>
            <option>Parents</option>
            <option>Teachers</option>
            <option>Staff</option>
          </select>
        </label>
        <label>
          Date
          <input
            type="date"
            value={newAnnouncement.date}
            onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, date: event.target.value }))}
          />
        </label>
        <label className="full">
          Message
          <textarea
            rows="3"
            value={newAnnouncement.message}
            onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, message: event.target.value }))}
            placeholder="Write announcement details"
          />
        </label>
        <button type="button" onClick={publishAnnouncement}>Publish Announcement</button>
      </div>

      <ul className="admin-feed-list">
        {announcements.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            <p>{item.message}</p>
            <small>{item.type} • {item.audience} • {item.date}</small>
          </li>
        ))}
      </ul>
    </section>
  );

  const renderEvents = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Events & Calendar</h2>
        <p>Publish school events, monitor scheduling conflicts and organizer ownership.</p>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Category</th>
              <th>Organizer</th>
            </tr>
          </thead>
          <tbody>
            {events.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.date}</td>
                <td>{item.category}</td>
                <td>{item.organizer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderMessages = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Messages</h2>
        <p>Coordinate all internal and external communication channels for your school.</p>
      </div>

      <div className="admin-control-grid">
        <label>
          Search
          <input
            type="text"
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Search messages"
          />
        </label>
        <label>
          Priority
          <select
            value={messagePriorityFilter}
            onChange={(event) => setMessagePriorityFilter(event.target.value)}
          >
            <option>All</option>
            <option>High</option>
            <option>Normal</option>
          </select>
        </label>
      </div>

      <div className="admin-compose-grid compact">
        <label>
          To
          <select
            value={newMessage.to}
            onChange={(event) => setNewMessage((prev) => ({ ...prev, to: event.target.value }))}
          >
            <option>Teachers</option>
            <option>Parents</option>
            <option>Students</option>
            <option>Staff</option>
            <option>All Users</option>
          </select>
        </label>
        <label>
          Channel
          <select
            value={newMessage.channel}
            onChange={(event) => setNewMessage((prev) => ({ ...prev, channel: event.target.value }))}
          >
            <option>Internal</option>
            <option>Support</option>
            <option>Academic</option>
            <option>Finance</option>
          </select>
        </label>
        <label>
          Priority
          <select
            value={newMessage.priority}
            onChange={(event) => setNewMessage((prev) => ({ ...prev, priority: event.target.value }))}
          >
            <option>Normal</option>
            <option>High</option>
          </select>
        </label>
        <label className="full">
          Message
          <textarea
            rows="2"
            value={newMessage.preview}
            onChange={(event) => setNewMessage((prev) => ({ ...prev, preview: event.target.value }))}
            placeholder="Write a message"
          />
        </label>
        <button type="button" onClick={sendMessage}>Send Message</button>
      </div>

      <ul className="admin-feed-list">
        {filteredMessages.map((item) => (
          <li key={item.id}>
            <strong>{item.from} → {item.to}</strong>
            <p>{item.preview}</p>
            <small>{item.channel} • {item.priority} • {item.date}</small>
          </li>
        ))}
      </ul>
    </section>
  );

  const renderNotifications = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Notifications</h2>
        <p>Review system alerts and jump directly to the impacted management module.</p>
      </div>

      <div className="admin-notification-head">
        <strong>{unreadNotifications.length} unread notifications</strong>
        <button type="button" className="row-action" onClick={markAllNotificationsRead}>Mark All Read</button>
      </div>

      <ul className="admin-feed-list">
        {notifications.map((item) => (
          <li key={item.id} className={item.unread ? 'unread' : ''}>
            <strong>{item.title}</strong>
            <small>{item.date}</small>
            <div>
              <button type="button" className="row-action" onClick={() => markNotificationRead(item.id)}>
                Open
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  const renderReports = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Reports</h2>
        <p>Generate school-wide operational, academic and financial executive reports.</p>
      </div>

      <div className="admin-kpi-row">
        <article><span>Attendance Rate</span><strong>{reportData.attendanceRate}%</strong></article>
        <article><span>Result Average</span><strong>{reportData.resultAverage}/20</strong></article>
        <article><span>Total Billed</span><strong>{formatCurrency(reportData.billed)}</strong></article>
        <article><span>Total Collected</span><strong>{formatCurrency(reportData.collections)}</strong></article>
      </div>

      <div className="admin-chart-grid">
        {Object.entries(reportData.usersByRole).map(([key, value]) => (
          <article key={key}>
            <span>{key}</span>
            <div><i style={{ height: `${Math.max(24, value * 14)}px` }} /></div>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-actions">
        <button type="button" onClick={exportReportsPdf}>Export PDF Report</button>
        <button
          type="button"
          onClick={() => exportCsv(
            [
              {
                attendanceRate: `${reportData.attendanceRate}%`,
                resultAverage: reportData.resultAverage,
                billed: reportData.billed,
                collections: reportData.collections,
                outstanding: reportData.outstanding
              }
            ],
            'admin-summary.csv'
          )}
        >
          Export CSV Snapshot
        </button>
      </div>
    </section>
  );

  const renderLibrary = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Library</h2>
        <p>Additional control tab to monitor stock health and library service readiness.</p>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>Total Copies</th>
              <th>Available</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {libraryBooks.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.copies}</td>
                <td>{item.available}</td>
                <td><span className={`admin-badge ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderTransport = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Transport</h2>
        <p>Additional control tab for route, capacity and transport punctuality governance.</p>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Route</th>
              <th>Bus</th>
              <th>Driver</th>
              <th>Capacity</th>
              <th>Occupancy</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transportRoutes.map((item) => (
              <tr key={item.id}>
                <td>{item.route}</td>
                <td>{item.busNo}</td>
                <td>{item.driver}</td>
                <td>{item.seats}</td>
                <td>{item.occupied}</td>
                <td><span className={`admin-badge ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Settings</h2>
        <p>Control school-level automation and governance rules.</p>
      </div>

      <div className="admin-settings-status">
        <span className={JSON.stringify(settingsDraft) === JSON.stringify(settingsSnapshot) ? 'synced' : 'pending'}>
          {JSON.stringify(settingsDraft) === JSON.stringify(settingsSnapshot) ? 'Synced' : 'Pending Changes'}
        </span>
        <small>Last saved: {settingsSavedAt}</small>
      </div>

      <form className="admin-settings-grid" onSubmit={(event) => event.preventDefault()}>
        <label>
          Timezone
          <select
            value={settingsDraft.timezone}
            onChange={(event) => setSettingsDraft((prev) => ({ ...prev, timezone: event.target.value }))}
          >
            <option>Africa/Douala</option>
            <option>Africa/Lagos</option>
            <option>Africa/Nairobi</option>
          </select>
        </label>

        <label>
          Notification Channel
          <select
            value={settingsDraft.notificationChannel}
            onChange={(event) => setSettingsDraft((prev) => ({ ...prev, notificationChannel: event.target.value }))}
          >
            <option>Email + SMS</option>
            <option>Email Only</option>
            <option>SMS Only</option>
          </select>
        </label>

        <label>
          Attendance Alert Threshold (%)
          <input
            type="number"
            min="50"
            max="100"
            value={settingsDraft.attendanceAlertThreshold}
            onChange={(event) => setSettingsDraft((prev) => ({ ...prev, attendanceAlertThreshold: event.target.value }))}
          />
        </label>

        <label>
          Report Cycle
          <select
            value={settingsDraft.reportCycle}
            onChange={(event) => setSettingsDraft((prev) => ({ ...prev, reportCycle: event.target.value }))}
          >
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={settingsDraft.autoApproveParents}
            onChange={(event) => setSettingsDraft((prev) => ({ ...prev, autoApproveParents: event.target.checked }))}
          />
          Auto-approve parent accounts
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={settingsDraft.autoGenerateInvoices}
            onChange={(event) => setSettingsDraft((prev) => ({ ...prev, autoGenerateInvoices: event.target.checked }))}
          />
          Auto-generate invoices per cycle
        </label>
      </form>

      <div className="admin-actions">
        <button type="button" onClick={saveSettings}>Save Settings</button>
        <button type="button" onClick={resetSettings}>Revert to Saved</button>
        <button type="button" onClick={defaultsSettings}>Restore Defaults</button>
      </div>
    </section>
  );

  const renderMain = () => {
    switch (activeView) {
      case 'schools':
        return renderSchools();
      case 'users':
        return renderUsers();
      case 'students':
        return renderStudents();
      case 'parents':
        return renderSimpleRoleTable('Parents', 'Control parent account lifecycle and communication readiness.', parents, 'Parent');
      case 'teachers':
        return renderSimpleRoleTable('Teachers', 'Monitor teacher account readiness and instructional staffing.', teachers, 'Teacher');
      case 'staff':
        return renderSimpleRoleTable('Staff', 'Manage non-teaching staff operations and account access.', staff, 'Staff');
      case 'classes':
        return renderClasses();
      case 'subjects':
        return renderSubjects();
      case 'departments':
        return renderDepartments();
      case 'timetable':
        return renderTimetable();
      case 'attendance':
        return renderAttendance();
      case 'assignments':
        return renderAssignments();
      case 'exams':
        return renderExams();
      case 'results':
        return renderResults();
      case 'fees-structure':
        return renderFees();
      case 'invoices':
        return renderInvoices();
      case 'announcements':
        return renderAnnouncements();
      case 'events-calendar':
        return renderEvents();
      case 'messages':
        return renderMessages();
      case 'notifications':
        return renderNotifications();
      case 'reports':
        return renderReports();
      case 'library':
        return renderLibrary();
      case 'transport':
        return renderTransport();
      case 'profile':
        return (
          <section className="admin-panel">
            <div className="section-header">
              <h2>Profile</h2>
              <p>Maintain the administrator identity used across all controlled modules.</p>
            </div>
            <EditProfile profile={profileForEdit} onSaveProfile={onSaveProfile} />
          </section>
        );
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="dashboard-container">
      <AdminSidebar
        active={activeView}
        onSelect={(view) => {
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
          name: profile?.name || 'School Administrator',
          avatar: profile?.avatar || buildAvatar(profile?.name || 'School Administrator')
        }}
        notificationCount={unreadNotifications.length}
        notifications={notifications}
        onNotificationSelect={markNotificationRead}
        onMarkAllNotificationsRead={markAllNotificationsRead}
        onViewAllNotifications={() => setActiveView('notifications')}
      />

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="dashboard-main admin-main">
        <div className="left-content admin-left-content">
          {notice && <div className="admin-notice">{notice}</div>}
          {renderMain()}
        </div>

        <aside className="right-sidebar admin-right-sidebar">
          <section className="notifications section-card">
            <h2>Admin Highlights</h2>
            <ul className="admin-mini-list">
              <li>
                <span>Unread Notifications</span>
                <strong>{unreadNotifications.length}</strong>
              </li>
              <li>
                <span>Attendance Rate</span>
                <strong>{attendanceSummary.rate}%</strong>
              </li>
              <li>
                <span>Outstanding Fees</span>
                <strong>{formatCurrency(invoiceSummary.pendingAmount)}</strong>
              </li>
              <li>
                <span>Open Assignments</span>
                <strong>{assignments.filter((item) => item.status === 'Open').length}</strong>
              </li>
            </ul>
          </section>

          <section className="performance section-card">
            <h2>Operations Pulse</h2>
            <div className="admin-right-chart">
              <article>
                <FaChartLine />
                <div>
                  <strong>{reportData.attendanceRate}%</strong>
                  <p>Attendance Health</p>
                </div>
              </article>
              <article>
                <FaBullhorn />
                <div>
                  <strong>{announcements.length}</strong>
                  <p>Active Announcements</p>
                </div>
              </article>
              <article>
                <FaBell />
                <div>
                  <strong>{notifications.length}</strong>
                  <p>Total School Alerts</p>
                </div>
              </article>
            </div>
          </section>
        </aside>
      </main>

      <footer className="dashboard-footer">
        <a href="https://www.khanacademy.org/" target="_blank" rel="noreferrer">Learning Resources</a>
        <button
          type="button"
          onClick={() => window.open('mailto:support@eduignite.edu?subject=Admin%20Dashboard%20Support', '_blank')}
        >
          Support
        </button>
      </footer>
    </div>
  );
};

export default AdminDashboard;
