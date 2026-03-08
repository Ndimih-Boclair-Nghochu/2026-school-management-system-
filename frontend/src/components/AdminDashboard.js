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
import Messages from './Messages';
import Library from './Library';
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
  updateStudentEnrollmentByMatricule,
  updateStudentPlatformFee
} from './studentEnrollment';
import {
  getTimetableEntries,
  saveTimetableEntries,
  TIMETABLE_UPDATED_EVENT,
  TIMETABLE_DAYS
} from './timetableData';
import { publishReportCards } from './reportCardPublications';
import './TeacherDashboard.css';
import './AdminDashboard.css';

const buildAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=fff&bold=true`;

const formatDisplayDate = (value, fallback = '-') => {
  const raw = String(value || '').trim();
  if (!raw) {
    return fallback;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatCurrency = (value) => `XAF ${Number(value || 0).toLocaleString()}`;

const buildClassKey = (className, section) => `${className || 'Unknown Class'}__${section || 'Unassigned'}`;

const getGradeFromAverage = (score) => {
  const safe = Number(score || 0);
  if (safe >= 17) return 'A';
  if (safe >= 15) return 'B+';
  if (safe >= 13) return 'B';
  if (safe >= 11) return 'C+';
  if (safe >= 10) return 'C';
  if (safe >= 8) return 'D';
  return 'F';
};

const getPerformanceBand = (score) => {
  const safe = Number(score || 0);
  if (safe >= 16) return 'Excellent';
  if (safe >= 13) return 'Good';
  if (safe >= 10) return 'Average';
  return 'At Risk';
};

const getOrdinalRank = (value) => {
  const rank = Number(value || 0);
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${rank}th`;
  }

  switch (rank % 10) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
};

const getRecentAcademicYears = (currentSession, count = 4) => {
  const source = String(currentSession || '').trim();
  const [firstChunk, secondChunk] = source.split('/');
  const startYear = Number.parseInt(firstChunk, 10);
  const endYear = Number.parseInt(secondChunk, 10);

  if (!Number.isFinite(startYear) || !Number.isFinite(endYear) || endYear !== startYear + 1) {
    return [source || '2025/2026'];
  }

  return Array.from({ length: count }, (_, index) => {
    const from = startYear - index;
    const to = endYear - index;
    return `${from}/${to}`;
  });
};

const getAcademicYearFromDate = (dateValue, fallbackSession = '2025/2026') => {
  const raw = String(dateValue || '').trim();
  if (!raw) {
    return String(fallbackSession || '2025/2026');
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return String(fallbackSession || '2025/2026');
  }

  const month = parsed.getMonth() + 1;
  const year = parsed.getFullYear();
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
};

const ADMIN_TAB_ACCESS_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'schools', label: 'School' },
  { key: 'users', label: 'Users' },
  { key: 'admin-enrolment', label: 'Admin Enrolment' },
  { key: 'students', label: 'Students' },
  { key: 'id-cards', label: 'ID Cards' },
  { key: 'parents', label: 'Parents' },
  { key: 'teachers', label: 'Teachers' },
  { key: 'staff', label: 'Staff' },
  { key: 'classes', label: 'Classes' },
  { key: 'subjects', label: 'Subjects' },
  { key: 'departments', label: 'Departments' },
  { key: 'timetable', label: 'Timetable' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'exams', label: 'Exams' },
  { key: 'results', label: 'Results' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'events-calendar', label: 'Events & Calendar' },
  { key: 'messages', label: 'Messages' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'reports', label: 'Reports' },
  { key: 'library', label: 'Library' },
  { key: 'transport', label: 'Transport' },
  { key: 'profile', label: 'Profile' },
  { key: 'settings', label: 'Settings' }
];

const ADMIN_TAB_LABEL_LOOKUP = ADMIN_TAB_ACCESS_OPTIONS.reduce((accumulator, tab) => {
  accumulator[tab.key] = tab.label;
  return accumulator;
}, {});

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
  { id: 1, name: 'Sciences', head: 'Mr. Kelvin', section: 'English School', office: 'Block B • Room 05', status: 'Active' },
  { id: 2, name: 'Arts & Languages', head: 'Mrs. Tambe', section: 'French School', office: 'Block A • Room 03', status: 'Active' },
  { id: 3, name: 'Administration', head: 'Mr. Neba', section: 'Technical School', office: 'Main Building • Room 01', status: 'Active' }
];

const INITIAL_USERS = [
  { id: 1, name: 'John Smith', role: 'Teacher', email: 'john.smith@eduignite.edu', department: 'Sciences', section: 'English School', status: 'Active' },
  { id: 2, name: 'Mary Johnson', role: 'Parent', email: 'mary.johnson@email.com', department: 'Community', section: 'English School', status: 'Active' },
  { id: 3, name: 'Grace Librarian', role: 'Staff', email: 'grace.lib@eduignite.edu', department: 'Administration', section: 'French School', status: 'Active' },
  { id: 4, name: 'Daniel Accountant', role: 'Staff', email: 'daniel.acc@eduignite.edu', department: 'Administration', section: 'Technical School', status: 'Active' },
  { id: 5, name: 'Alicia Admin', role: 'Admin', email: 'alicia.admin@eduignite.edu', department: 'Administration', section: 'English School', managedTabs: ADMIN_TAB_ACCESS_OPTIONS.map((tab) => tab.key), status: 'Active' },
  { id: 6, name: 'Peter Nsom', role: 'Teacher', email: 'peter.nsom@eduignite.edu', department: 'Sciences', section: 'Technical School', status: 'On Leave' }
];

const INITIAL_STUDENTS = [
  { id: 1, matricule: 'EIMS-EMILY-ENG-001', name: 'Emily Johnson', className: 'Grade 5', section: 'English School', gender: 'Female', parent: 'Mary Johnson', attendance: 95, resultAverage: 14.1, feeStatus: 'Partial', platformFeePaid: true, status: 'Active' },
  { id: 2, matricule: 'EIMS-DANIE-FRE-001', name: 'Daniel Johnson', className: 'Grade 3', section: 'French School', gender: 'Male', parent: 'Mary Johnson', attendance: 93, resultAverage: 13.4, feeStatus: 'Partial', platformFeePaid: true, status: 'Active' },
  { id: 3, matricule: 'EIMS-RITAN-TEC-001', name: 'Rita Nsame', className: 'Grade 4', section: 'Technical School', gender: 'Female', parent: 'Joseph Nsame', attendance: 98, resultAverage: 15.6, feeStatus: 'Cleared', platformFeePaid: true, status: 'Active' },
  { id: 4, matricule: 'EIMS-MICHA-ENG-001', name: 'Michael Tabi', className: 'Grade 6', section: 'English School', gender: 'Male', parent: 'Anna Tabi', attendance: 84, resultAverage: 11.2, feeStatus: 'Outstanding', platformFeePaid: true, status: 'At Risk' },
  { id: 5, matricule: 'EIMS-SOPHI-FRE-001', name: 'Sophie Mbarga', className: 'Grade 3', section: 'French School', gender: 'Female', parent: 'Julienne Mbarga', attendance: 91, resultAverage: 12.8, feeStatus: 'Pending', platformFeePaid: false, status: 'Platform Fee Pending' },
  { id: 6, matricule: 'EIMS-KEVIN-ENG-001', name: 'Kevin Ndzi', className: 'Grade 4', section: 'English School', gender: 'Male', parent: 'Ruth Ndzi', attendance: 88, resultAverage: 11.9, feeStatus: 'Outstanding', platformFeePaid: false, status: 'Platform Fee Pending' },
  { id: 7, matricule: 'EIMS-BRIGI-TEC-001', name: 'Brigitte Simo', className: 'Grade 5', section: 'Technical School', gender: 'Female', parent: 'Paul Simo', attendance: 96, resultAverage: 15.2, feeStatus: 'Cleared', platformFeePaid: true, status: 'Active' },
  { id: 8, matricule: 'EIMS-FRANC-ENG-001', name: 'Francis Talla', className: 'Grade 6', section: 'English School', gender: 'Male', parent: 'Deborah Talla', attendance: 82, resultAverage: 10.7, feeStatus: 'Partial', platformFeePaid: true, status: 'At Risk' },
  { id: 9, matricule: 'EIMS-GLORI-FRE-001', name: 'Gloria Ewane', className: 'Grade 3', section: 'French School', gender: 'Female', parent: 'Jonas Ewane', attendance: 94, resultAverage: 13.9, feeStatus: 'Partial', platformFeePaid: true, status: 'Active' },
  { id: 10, matricule: 'EIMS-NELSO-TEC-001', name: 'Nelson Fokou', className: 'Grade 4', section: 'Technical School', gender: 'Male', parent: 'Aline Fokou', attendance: 90, resultAverage: 12.4, feeStatus: 'Pending', platformFeePaid: false, status: 'Platform Fee Pending' },
  { id: 11, matricule: 'EIMS-LYDIA-ENG-001', name: 'Lydia Muna', className: 'Grade 5', section: 'English School', gender: 'Female', parent: 'Prisca Muna', attendance: 97, resultAverage: 16.1, feeStatus: 'Cleared', platformFeePaid: true, status: 'Active' },
  { id: 12, matricule: 'EIMS-BLAIS-FRE-001', name: 'Blaise Kotto', className: 'Grade 6', section: 'French School', gender: 'Male', parent: 'Rose Kotto', attendance: 86, resultAverage: 11.5, feeStatus: 'Outstanding', platformFeePaid: true, status: 'At Risk' },
  { id: 13, matricule: 'EIMS-NAOMI-TEC-001', name: 'Naomi Mbella', className: 'Grade 3', section: 'Technical School', gender: 'Female', parent: 'Gerard Mbella', attendance: 89, resultAverage: 12.1, feeStatus: 'Partial', platformFeePaid: true, status: 'Active' },
  { id: 14, matricule: 'EIMS-CHRIS-ENG-001', name: 'Chris Neba', className: 'Grade 4', section: 'English School', gender: 'Male', parent: 'Sandra Neba', attendance: 92, resultAverage: 13.2, feeStatus: 'Pending', platformFeePaid: false, status: 'Platform Fee Pending' },
  { id: 15, matricule: 'EIMS-ESTHE-FRE-001', name: 'Esther Ndzi', className: 'Grade 5', section: 'French School', gender: 'Female', parent: 'Victor Ndzi', attendance: 95, resultAverage: 14.8, feeStatus: 'Cleared', platformFeePaid: true, status: 'Active' },
  { id: 16, matricule: 'EIMS-PATRI-TEC-001', name: 'Patrick Mbi', className: 'Grade 6', section: 'Technical School', gender: 'Male', parent: 'Angela Mbi', attendance: 87, resultAverage: 11.3, feeStatus: 'Partial', platformFeePaid: true, status: 'Active' },
  { id: 17, matricule: 'EIMS-ANGEL-ENG-001', name: 'Angela Tombi', className: 'Grade 3', section: 'English School', gender: 'Female', parent: 'Peter Tombi', attendance: 93, resultAverage: 13.5, feeStatus: 'Outstanding', platformFeePaid: false, status: 'Platform Fee Pending' },
  { id: 18, matricule: 'EIMS-SAMUE-FRE-001', name: 'Samuel Mvondo', className: 'Grade 4', section: 'French School', gender: 'Male', parent: 'Seline Mvondo', attendance: 90, resultAverage: 12.6, feeStatus: 'Partial', platformFeePaid: true, status: 'Active' },
  { id: 19, matricule: 'EIMS-JUDIT-TEC-001', name: 'Judith Ngu', className: 'Grade 5', section: 'Technical School', gender: 'Female', parent: 'Arthur Ngu', attendance: 96, resultAverage: 15.4, feeStatus: 'Cleared', platformFeePaid: true, status: 'Active' },
  { id: 20, matricule: 'EIMS-MARTI-ENG-001', name: 'Martin Yondo', className: 'Grade 6', section: 'English School', gender: 'Male', parent: 'Linda Yondo', attendance: 85, resultAverage: 10.9, feeStatus: 'Pending', platformFeePaid: false, status: 'Platform Fee Pending' },
  { id: 21, matricule: 'EIMS-IRENE-FRE-001', name: 'Irene Mbi', className: 'Grade 3', section: 'French School', gender: 'Female', parent: 'Patrick Mbi', attendance: 94, resultAverage: 14.2, feeStatus: 'Partial', platformFeePaid: true, status: 'Active' },
  { id: 22, matricule: 'EIMS-ARTHU-ENG-001', name: 'Arthur Ndzi', className: 'Grade 4', section: 'English School', gender: 'Male', parent: 'Sylvia Ndzi', attendance: 89, resultAverage: 12.7, feeStatus: 'Pending', platformFeePaid: false, status: 'Platform Fee Pending' },
  { id: 23, matricule: 'EIMS-CAROL-TEC-001', name: 'Caroline Muna', className: 'Grade 5', section: 'Technical School', gender: 'Female', parent: 'Daniel Muna', attendance: 96, resultAverage: 15.3, feeStatus: 'Cleared', platformFeePaid: true, status: 'Active' },
  { id: 24, matricule: 'EIMS-BENJA-FRE-001', name: 'Benjamin Ewane', className: 'Grade 6', section: 'French School', gender: 'Male', parent: 'Loic Ewane', attendance: 88, resultAverage: 11.8, feeStatus: 'Outstanding', platformFeePaid: true, status: 'At Risk' },
  { id: 25, matricule: 'EIMS-PAULI-ENG-001', name: 'Pauline Tamo', className: 'Grade 3', section: 'English School', gender: 'Female', parent: 'Eric Tamo', attendance: 97, resultAverage: 15.7, feeStatus: 'Cleared', platformFeePaid: true, status: 'Active' },
  { id: 26, matricule: 'EIMS-ROGER-TEC-001', name: 'Roger Mbella', className: 'Grade 4', section: 'Technical School', gender: 'Male', parent: 'Alice Mbella', attendance: 84, resultAverage: 10.6, feeStatus: 'Pending', platformFeePaid: false, status: 'Platform Fee Pending' },
  { id: 27, matricule: 'EIMS-SARAH-FRE-001', name: 'Sarah Ndzi', className: 'Grade 5', section: 'French School', gender: 'Female', parent: 'Jonas Ndzi', attendance: 92, resultAverage: 13.8, feeStatus: 'Partial', platformFeePaid: true, status: 'Active' },
  { id: 28, matricule: 'EIMS-VICTO-ENG-001', name: 'Victor Mvondo', className: 'Grade 6', section: 'English School', gender: 'Male', parent: 'Claire Mvondo', attendance: 86, resultAverage: 11.1, feeStatus: 'Outstanding', platformFeePaid: true, status: 'At Risk' },
  { id: 29, matricule: 'EIMS-HELEN-TEC-001', name: 'Helen Simo', className: 'Grade 3', section: 'Technical School', gender: 'Female', parent: 'Joseph Simo', attendance: 95, resultAverage: 14.9, feeStatus: 'Cleared', platformFeePaid: true, status: 'Active' },
  { id: 30, matricule: 'EIMS-KEITH-ENG-001', name: 'Keith Nfor', className: 'Grade 5', section: 'English School', gender: 'Male', parent: 'Rebecca Nfor', attendance: 90, resultAverage: 13.1, feeStatus: 'Partial', platformFeePaid: true, status: 'Active' }
];

const INITIAL_CLASSES = [
  { id: 1, name: 'Grade 3', blockName: 'Primary Block A', roomNumber: '12', section: 'English School', capacity: 40, status: 'Active' },
  { id: 2, name: 'Grade 4', blockName: 'Primary Block B', roomNumber: '14', section: 'French School', capacity: 38, status: 'Active' },
  { id: 3, name: 'Grade 5', blockName: 'Technical Block', roomNumber: '16', section: 'Technical School', capacity: 42, status: 'Active' },
  { id: 4, name: 'Grade 6', blockName: 'Primary Block A', roomNumber: '18', section: 'English School', capacity: 36, status: 'Active' }
];

const INITIAL_SUBJECTS = [
  { id: 1, name: 'Mathematics', department: 'Sciences', className: 'Grade 5', section: 'Technical School', weeklyPeriods: 6, teacher: 'John Smith', status: 'Active' },
  { id: 2, name: 'English Language', department: 'Arts & Languages', className: 'Grade 4', section: 'French School', weeklyPeriods: 5, teacher: 'Brenda Nji', status: 'Active' },
  { id: 3, name: 'Integrated Science', department: 'Sciences', className: 'Grade 6', section: 'English School', weeklyPeriods: 4, teacher: 'Peter Nsom', status: 'Active' }
];

const INITIAL_ATTENDANCE = [
  { id: 1, date: '2026-03-05', className: 'Grade 5', present: 33, absent: 2, late: 1 },
  { id: 2, date: '2026-03-05', className: 'Grade 4', present: 28, absent: 2, late: 0 },
  { id: 3, date: '2026-03-06', className: 'Grade 6', present: 26, absent: 3, late: 0 }
];

const INITIAL_EXAMS = [
  {
    id: 1,
    title: 'Term 2 Mathematics Test',
    className: 'Grade 5',
    subject: 'Mathematics',
    term: 'Term 2',
    sequence: 'Sequence 1',
    startDate: '2026-03-19',
    latestDate: '2026-03-20',
    status: 'Published',
    publishedAt: '2026-03-10'
  },
  {
    id: 2,
    title: 'Term 2 Science Quiz',
    className: 'Grade 6',
    subject: 'Integrated Science',
    term: 'Term 2',
    sequence: 'Sequence 2',
    startDate: '2026-03-21',
    latestDate: '2026-03-22',
    status: 'Scheduled',
    publishedAt: ''
  },
  {
    id: 3,
    title: 'English Continuous Assessment',
    className: 'Grade 4',
    subject: 'English Language',
    term: 'Term 1',
    sequence: 'Sequence 3',
    startDate: '2026-02-12',
    latestDate: '2026-02-13',
    status: 'Closed',
    publishedAt: '2026-02-01'
  }
];

const INITIAL_RESULT_BLUEPRINTS = [
  { student: 'Emily Johnson', className: 'Grade 5', scores: { Mathematics: 16, 'English Language': 15, 'Integrated Science': 14, History: 13, French: 14 } },
  { student: 'Daniel Johnson', className: 'Grade 3', scores: { Mathematics: 14, 'English Language': 14, 'Integrated Science': 13, History: 12, French: 13 } },
  { student: 'Rita Nsame', className: 'Grade 4', scores: { Mathematics: 17, 'English Language': 15, 'Integrated Science': 16, History: 14, French: 15 } },
  { student: 'Michael Tabi', className: 'Grade 6', scores: { Mathematics: 10, 'English Language': 11, 'Integrated Science': 10, History: 9, French: 10 } },
  { student: 'Sophie Mbarga', className: 'Grade 3', scores: { Mathematics: 12, 'English Language': 13, 'Integrated Science': 12, History: 11, French: 12 } },
  { student: 'Kevin Ndzi', className: 'Grade 4', scores: { Mathematics: 11, 'English Language': 12, 'Integrated Science': 11, History: 10, French: 11 } },
  { student: 'Brigitte Simo', className: 'Grade 5', scores: { Mathematics: 16, 'English Language': 15, 'Integrated Science': 15, History: 14, French: 15 } },
  { student: 'Francis Talla', className: 'Grade 6', scores: { Mathematics: 10, 'English Language': 11, 'Integrated Science': 10, History: 9, French: 10 } },
  { student: 'Gloria Ewane', className: 'Grade 3', scores: { Mathematics: 14, 'English Language': 15, 'Integrated Science': 14, History: 13, French: 14 } },
  { student: 'Nelson Fokou', className: 'Grade 4', scores: { Mathematics: 12, 'English Language': 12, 'Integrated Science': 13, History: 11, French: 12 } },
  { student: 'Lydia Muna', className: 'Grade 5', scores: { Mathematics: 18, 'English Language': 16, 'Integrated Science': 17, History: 15, French: 16 } },
  { student: 'Blaise Kotto', className: 'Grade 6', scores: { Mathematics: 11, 'English Language': 12, 'Integrated Science': 11, History: 10, French: 11 } },
  { student: 'Naomi Mbella', className: 'Grade 3', scores: { Mathematics: 12, 'English Language': 13, 'Integrated Science': 12, History: 11, French: 12 } },
  { student: 'Chris Neba', className: 'Grade 4', scores: { Mathematics: 13, 'English Language': 14, 'Integrated Science': 13, History: 12, French: 13 } },
  { student: 'Esther Ndzi', className: 'Grade 5', scores: { Mathematics: 15, 'English Language': 16, 'Integrated Science': 15, History: 14, French: 15 } },
  { student: 'Patrick Mbi', className: 'Grade 6', scores: { Mathematics: 11, 'English Language': 11, 'Integrated Science': 12, History: 10, French: 11 } },
  { student: 'Angela Tombi', className: 'Grade 3', scores: { Mathematics: 13, 'English Language': 14, 'Integrated Science': 13, History: 12, French: 13 } },
  { student: 'Samuel Mvondo', className: 'Grade 4', scores: { Mathematics: 12, 'English Language': 13, 'Integrated Science': 12, History: 12, French: 12 } },
  { student: 'Judith Ngu', className: 'Grade 5', scores: { Mathematics: 16, 'English Language': 15, 'Integrated Science': 16, History: 14, French: 15 } },
  { student: 'Martin Yondo', className: 'Grade 6', scores: { Mathematics: 10, 'English Language': 11, 'Integrated Science': 10, History: 10, French: 10 } },
  { student: 'Irene Mbi', className: 'Grade 3', scores: { Mathematics: 15, 'English Language': 14, 'Integrated Science': 14, History: 13, French: 15 } },
  { student: 'Arthur Ndzi', className: 'Grade 4', scores: { Mathematics: 13, 'English Language': 12, 'Integrated Science': 13, History: 12, French: 13 } },
  { student: 'Caroline Muna', className: 'Grade 5', scores: { Mathematics: 17, 'English Language': 16, 'Integrated Science': 16, History: 15, French: 16 } },
  { student: 'Benjamin Ewane', className: 'Grade 6', scores: { Mathematics: 11, 'English Language': 12, 'Integrated Science': 11, History: 10, French: 11 } },
  { student: 'Pauline Tamo', className: 'Grade 3', scores: { Mathematics: 17, 'English Language': 16, 'Integrated Science': 15, History: 15, French: 16 } },
  { student: 'Roger Mbella', className: 'Grade 4', scores: { Mathematics: 10, 'English Language': 11, 'Integrated Science': 10, History: 9, French: 10 } },
  { student: 'Sarah Ndzi', className: 'Grade 5', scores: { Mathematics: 14, 'English Language': 14, 'Integrated Science': 13, History: 13, French: 14 } },
  { student: 'Victor Mvondo', className: 'Grade 6', scores: { Mathematics: 11, 'English Language': 11, 'Integrated Science': 10, History: 10, French: 11 } },
  { student: 'Helen Simo', className: 'Grade 3', scores: { Mathematics: 15, 'English Language': 15, 'Integrated Science': 14, History: 14, French: 15 } },
  { student: 'Keith Nfor', className: 'Grade 5', scores: { Mathematics: 13, 'English Language': 13, 'Integrated Science': 13, History: 12, French: 13 } }
];

const INITIAL_RESULTS = INITIAL_RESULT_BLUEPRINTS.flatMap((blueprint, blueprintIndex) => {
  const subjects = Object.entries(blueprint.scores || {});
  return subjects.map(([subjectName, subjectScore], subjectIndex) => ({
    id: (blueprintIndex * 10) + subjectIndex + 1,
    student: blueprint.student,
    className: blueprint.className,
    subject: subjectName,
    score: Number(subjectScore || 0),
    grade: getGradeFromAverage(subjectScore)
  }));
});

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

const ROWS_PER_PAGE = 10;

const AdminDashboard = ({ profile, onSaveProfile = () => {}, onLogout = () => {} }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const [schoolProfile, setSchoolProfile] = useState(getSchoolConfig());
  const [savedSchoolProfileSnapshot, setSavedSchoolProfileSnapshot] = useState(getSchoolConfig());
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
  const [timetableEntries, setTimetableEntries] = useState(() => getTimetableEntries());
  const [attendance] = useState(INITIAL_ATTENDANCE);
  const [exams, setExams] = useState(INITIAL_EXAMS);
  const [results] = useState(INITIAL_RESULTS);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [messages] = useState(INITIAL_MESSAGES);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [transportRoutes, setTransportRoutes] = useState(INITIAL_TRANSPORT);

  const [globalSearch, setGlobalSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [studentClassFilter, setStudentClassFilter] = useState('All');
  const [studentSectionFilter, setStudentSectionFilter] = useState('All');
  const [idCardClassFilter, setIdCardClassFilter] = useState('All');
  const [idCardSectionFilter, setIdCardSectionFilter] = useState('All');
  const [studentGenderFilter, setStudentGenderFilter] = useState('All');
  const [studentPlatformFeeFilter, setStudentPlatformFeeFilter] = useState('All');
  const [studentSchoolFeeFilter, setStudentSchoolFeeFilter] = useState('All');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [teacherDepartmentFilter, setTeacherDepartmentFilter] = useState('All');
  const [teacherSectionFilter, setTeacherSectionFilter] = useState('All');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState('All');
  const [teacherClassFilter, setTeacherClassFilter] = useState('All');
  const [teacherSubjectFilter, setTeacherSubjectFilter] = useState('All');
  const [showClassRegistrationForm, setShowClassRegistrationForm] = useState(false);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [classSectionFilter, setClassSectionFilter] = useState('All');
  const [classBlockFilter, setClassBlockFilter] = useState('All');
  const [classStatusFilter, setClassStatusFilter] = useState('All');
  const [showSubjectRegistrationForm, setShowSubjectRegistrationForm] = useState(false);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [subjectClassFilter, setSubjectClassFilter] = useState('All');
  const [subjectSectionFilter, setSubjectSectionFilter] = useState('All');
  const [subjectClassSlotFilter, setSubjectClassSlotFilter] = useState('All');
  const [subjectDepartmentFilter, setSubjectDepartmentFilter] = useState('All');
  const [subjectStatusFilter, setSubjectStatusFilter] = useState('All');
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [departmentSectionFilter, setDepartmentSectionFilter] = useState('All');
  const [departmentHeadFilter, setDepartmentHeadFilter] = useState('All');
  const [departmentStatusFilter, setDepartmentStatusFilter] = useState('All');
  const [showTimetableForm, setShowTimetableForm] = useState(false);
  const [timetableAudienceFilter, setTimetableAudienceFilter] = useState('All');
  const [timetableDayFilter, setTimetableDayFilter] = useState('All');
  const [timetableSectionFilter, setTimetableSectionFilter] = useState('All');
  const [timetableClassFilter, setTimetableClassFilter] = useState('All');
  const [timetableStaffRoleFilter, setTimetableStaffRoleFilter] = useState('All');
  const [timetableStaffFilter, setTimetableStaffFilter] = useState('All');
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
  const [attendanceRoleFilter, setAttendanceRoleFilter] = useState('All');
  const [attendanceSectionFilter, setAttendanceSectionFilter] = useState('All');
  const [attendanceBandFilter, setAttendanceBandFilter] = useState('All');
  const [attendanceSortBy, setAttendanceSortBy] = useState('Highest');
  const [showExamForm, setShowExamForm] = useState(false);
  const [examSearchTerm, setExamSearchTerm] = useState('');
  const [examClassFilter, setExamClassFilter] = useState('All');
  const [examTermFilter, setExamTermFilter] = useState('All');
  const [examSequenceFilter, setExamSequenceFilter] = useState('All');
  const [examStatusFilter, setExamStatusFilter] = useState('All');
  const [resultSectionFilter, setResultSectionFilter] = useState('All');
  const [resultClassFilter, setResultClassFilter] = useState('All');
  const [resultBandFilter, setResultBandFilter] = useState('All');
  const [resultSearchTerm, setResultSearchTerm] = useState('');
  const [resultTopCountInput, setResultTopCountInput] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All');
  const [paginationState, setPaginationState] = useState({});

  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', type: 'General', audience: 'All', date: '2026-03-15', message: '' });
  const [newEvent, setNewEvent] = useState(() => ({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'Academic',
    organizer: 'Administration'
  }));
  const [transportDraft, setTransportDraft] = useState({
    route: '',
    busNo: '',
    driver: '',
    seats: 40,
    occupied: 0,
    status: 'On Schedule'
  });
  const [settingsDraft, setSettingsDraft] = useState({ ...DEFAULT_ADMIN_SETTINGS });
  const [settingsSnapshot, setSettingsSnapshot] = useState({ ...DEFAULT_ADMIN_SETTINGS });
  const [settingsSavedAt, setSettingsSavedAt] = useState('Not saved yet');
  const [reportForms, setReportForms] = useState({
    executive: {
      period: 'This Term',
      output: 'PDF'
    },
    academic: {
      section: 'All',
      className: 'All',
      output: 'CSV',
      includeRanking: true
    },
    finance: {
      status: 'All',
      output: 'CSV',
      includeOverdueOnly: false
    }
  });
  const [reportAcademicYearFilter, setReportAcademicYearFilter] = useState(schoolProfile.currentSession || '2025/2026');
  const [generatedReports, setGeneratedReports] = useState([
    { id: 1, report: 'Executive Summary', format: 'PDF', scope: 'This Term', academicYear: '2025/2026', generatedAt: '2026-03-06' },
    { id: 2, report: 'Academic Performance', format: 'CSV', scope: 'All Sections', academicYear: '2024/2025', generatedAt: '2025-07-05' },
    { id: 3, report: 'Finance Reconciliation', format: 'CSV', scope: 'All Invoices', academicYear: '2023/2024', generatedAt: '2024-07-04' }
  ]);
  const [adminEnrollmentDraft, setAdminEnrollmentDraft] = useState({
    name: '',
    email: '',
    phone: '',
    section: 'English School',
    managedTabs: ['dashboard', 'users', 'students', 'reports']
  });
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
  const [showTeacherEnrollmentForm, setShowTeacherEnrollmentForm] = useState(false);
  const [teacherEnrollmentDraft, setTeacherEnrollmentDraft] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Sciences',
    section: 'English School',
    gender: 'Not Specified',
    allocatedClasses: [],
    allocatedSubjects: []
  });
  const [showStaffEnrollmentForm, setShowStaffEnrollmentForm] = useState(false);
  const [staffEnrollmentDraft, setStaffEnrollmentDraft] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Administration',
    section: 'English School',
    gender: 'Not Specified'
  });
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [studentEditDraft, setStudentEditDraft] = useState({
    name: '',
    className: '',
    section: '',
    gender: 'Not Specified',
    parent: '',
    attendance: 0,
    resultAverage: 0,
    feeStatus: 'Pending',
    platformFeePaid: false,
    status: 'Active'
  });
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [teacherEditDraft, setTeacherEditDraft] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Sciences',
    section: 'English School',
    gender: 'Not Specified',
    allocatedClasses: [],
    allocatedSubjects: [],
    status: 'Active'
  });
  const [classRegistrationDraft, setClassRegistrationDraft] = useState({
    name: '',
    section: 'English School',
    blockName: '',
    roomNumber: '',
    capacity: 40,
    status: 'Active'
  });
  const [editingClassId, setEditingClassId] = useState(null);
  const [classEditDraft, setClassEditDraft] = useState({
    name: '',
    section: 'English School',
    blockName: '',
    roomNumber: '',
    capacity: 40,
    status: 'Active'
  });
  const [subjectRegistrationDraft, setSubjectRegistrationDraft] = useState({
    name: '',
    department: 'Sciences',
    className: '',
    section: 'English School',
    weeklyPeriods: 5,
    teacher: '',
    status: 'Active'
  });
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [subjectEditDraft, setSubjectEditDraft] = useState({
    name: '',
    department: 'Sciences',
    className: '',
    section: 'English School',
    weeklyPeriods: 5,
    teacher: '',
    status: 'Active'
  });
  const [departmentDraft, setDepartmentDraft] = useState({
    name: '',
    head: 'Unassigned',
    section: 'English School',
    office: '',
    status: 'Active'
  });
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [departmentEditDraft, setDepartmentEditDraft] = useState({
    name: '',
    head: 'Unassigned',
    section: 'English School',
    office: '',
    status: 'Active'
  });
  const [timetableDraft, setTimetableDraft] = useState({
    audienceType: 'class',
    day: TIMETABLE_DAYS[0] || 'Monday',
    period: '08:00 - 09:00',
    className: '',
    section: 'English School',
    subject: '',
    teacher: 'Unassigned',
    staffName: '',
    staffRole: 'Teacher',
    activity: '',
    room: ''
  });
  const [editingTimetableId, setEditingTimetableId] = useState(null);
  const [timetableEditDraft, setTimetableEditDraft] = useState({
    audienceType: 'class',
    day: TIMETABLE_DAYS[0] || 'Monday',
    period: '08:00 - 09:00',
    className: '',
    section: 'English School',
    subject: '',
    teacher: 'Unassigned',
    staffName: '',
    staffRole: 'Teacher',
    activity: '',
    room: ''
  });
  const [examDraft, setExamDraft] = useState({
    title: '',
    className: '',
    subject: '',
    term: 'Term 1',
    sequence: 'Sequence 1',
    startDate: '',
    latestDate: ''
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

  useEffect(() => {
    const syncTimetable = () => {
      setTimetableEntries(getTimetableEntries());
    };

    window.addEventListener(TIMETABLE_UPDATED_EVENT, syncTimetable);
    window.addEventListener('storage', syncTimetable);

    return () => {
      window.removeEventListener(TIMETABLE_UPDATED_EVENT, syncTimetable);
      window.removeEventListener('storage', syncTimetable);
    };
  }, []);

  const teachers = useMemo(() => users.filter((item) => item.role === 'Teacher'), [users]);
  const parents = useMemo(() => users.filter((item) => item.role === 'Parent'), [users]);
  const staff = useMemo(() => users.filter((item) => item.role === 'Staff'), [users]);
  const managedAdmins = useMemo(() => users.filter((item) => item.role === 'Admin'), [users]);

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
      const queryMatch = !query || `${item.name} ${item.email} ${item.role} ${item.department} ${item.section || ''} ${(item.managedTabs || []).map((tab) => ADMIN_TAB_LABEL_LOOKUP[tab] || tab).join(' ')}`.toLowerCase().includes(query);
      return roleMatch && queryMatch;
    });
  }, [users, globalSearch, userRoleFilter]);

  const filteredStudents = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    return students.filter((item) => {
      const classMatch = studentClassFilter === 'All' || item.className === studentClassFilter;
      const sectionMatch = studentSectionFilter === 'All' || item.section === studentSectionFilter;
      const gender = item.gender || 'Not Specified';
      const genderMatch = studentGenderFilter === 'All' || gender === studentGenderFilter;
      const platformFeeMatch = studentPlatformFeeFilter === 'All'
        || (studentPlatformFeeFilter === 'Paid' && item.platformFeePaid)
        || (studentPlatformFeeFilter === 'Pending' && !item.platformFeePaid);
      const schoolFeeMatch = studentSchoolFeeFilter === 'All'
        || (studentSchoolFeeFilter === 'Unpaid School Fees' && item.feeStatus !== 'Cleared')
        || item.feeStatus === studentSchoolFeeFilter;
      const queryMatch = !query || `${item.matricule || ''} ${item.name} ${item.parent} ${item.className} ${item.feeStatus} ${item.section || ''} ${item.platformFeePaid ? 'paid' : 'pending'} ${gender}`.toLowerCase().includes(query);
      return classMatch && sectionMatch && genderMatch && platformFeeMatch && schoolFeeMatch && queryMatch;
    });
  }, [
    students,
    globalSearch,
    studentClassFilter,
    studentSectionFilter,
    studentGenderFilter,
    studentPlatformFeeFilter,
    studentSchoolFeeFilter
  ]);

  const filteredTeachers = useMemo(() => {
    const query = teacherSearchTerm.trim().toLowerCase();
    return teachers.filter((item) => {
      const departmentMatch = teacherDepartmentFilter === 'All' || item.department === teacherDepartmentFilter;
      const sectionMatch = teacherSectionFilter === 'All' || (item.section || 'Unassigned') === teacherSectionFilter;
      const statusMatch = teacherStatusFilter === 'All' || item.status === teacherStatusFilter;
      const classMatch = teacherClassFilter === 'All' || (item.allocatedClasses || []).includes(teacherClassFilter);
      const subjectMatch = teacherSubjectFilter === 'All' || (item.allocatedSubjects || []).includes(teacherSubjectFilter);
      const queryMatch = !query || `${item.name} ${item.email} ${item.department} ${item.section || ''} ${(item.allocatedClasses || []).join(' ')} ${(item.allocatedSubjects || []).join(' ')} ${item.status}`.toLowerCase().includes(query);
      return departmentMatch && sectionMatch && statusMatch && classMatch && subjectMatch && queryMatch;
    });
  }, [
    teachers,
    teacherSearchTerm,
    teacherDepartmentFilter,
    teacherSectionFilter,
    teacherStatusFilter,
    teacherClassFilter,
    teacherSubjectFilter
  ]);

  const filteredTeacherStats = useMemo(() => ({
    total: filteredTeachers.length,
    active: filteredTeachers.filter((item) => item.status === 'Active').length,
    subSchools: new Set(filteredTeachers.map((item) => item.section || 'Unassigned')).size || 1,
    departments: new Set(filteredTeachers.map((item) => item.department)).size || 1
  }), [filteredTeachers]);

  const filteredClasses = useMemo(() => {
    const query = classSearchTerm.trim().toLowerCase();
    return classes.filter((item) => {
      const sectionMatch = classSectionFilter === 'All' || (item.section || 'Unassigned') === classSectionFilter;
      const blockMatch = classBlockFilter === 'All' || (item.blockName || 'Unassigned Block') === classBlockFilter;
      const statusMatch = classStatusFilter === 'All' || (item.status || 'Active') === classStatusFilter;
      const queryMatch = !query || `${item.name} ${item.blockName || ''} ${item.roomNumber || ''} ${item.section || ''}`.toLowerCase().includes(query);
      return sectionMatch && blockMatch && statusMatch && queryMatch;
    });
  }, [classes, classSearchTerm, classSectionFilter, classBlockFilter, classStatusFilter]);

  const filteredSubjects = useMemo(() => {
    const query = subjectSearchTerm.trim().toLowerCase();
    return subjects.filter((item) => {
      const classMatch = subjectClassFilter === 'All' || item.className === subjectClassFilter;
      const sectionMatch = subjectSectionFilter === 'All' || (item.section || 'Unassigned') === subjectSectionFilter;
      const subjectSlot = `${item.className || ''} | ${item.section || 'Unassigned'}`;
      const slotMatch = subjectClassSlotFilter === 'All' || subjectSlot === subjectClassSlotFilter;
      const departmentMatch = subjectDepartmentFilter === 'All' || item.department === subjectDepartmentFilter;
      const statusMatch = subjectStatusFilter === 'All' || (item.status || 'Active') === subjectStatusFilter;
      const queryMatch = !query || `${item.name} ${item.className || ''} ${item.section || ''} ${item.department || ''} ${item.teacher || ''}`.toLowerCase().includes(query);
      return classMatch && sectionMatch && slotMatch && departmentMatch && statusMatch && queryMatch;
    });
  }, [subjects, subjectSearchTerm, subjectClassFilter, subjectSectionFilter, subjectClassSlotFilter, subjectDepartmentFilter, subjectStatusFilter]);

  const filteredDepartments = useMemo(() => {
    const query = departmentSearchTerm.trim().toLowerCase();
    return departments.filter((item) => {
      const sectionMatch = departmentSectionFilter === 'All' || (item.section || 'Unassigned') === departmentSectionFilter;
      const headMatch = departmentHeadFilter === 'All' || (item.head || 'Unassigned') === departmentHeadFilter;
      const statusMatch = departmentStatusFilter === 'All' || (item.status || 'Active') === departmentStatusFilter;
      const queryMatch = !query || `${item.name} ${item.head || ''} ${item.section || ''} ${item.office || ''}`.toLowerCase().includes(query);
      return sectionMatch && headMatch && statusMatch && queryMatch;
    });
  }, [departments, departmentSearchTerm, departmentSectionFilter, departmentHeadFilter, departmentStatusFilter]);

  const filteredTimetableEntries = useMemo(() => {
    return timetableEntries.filter((item) => {
      const audienceMatch = timetableAudienceFilter === 'All' || item.audienceType === timetableAudienceFilter;
      const dayMatch = timetableDayFilter === 'All' || item.day === timetableDayFilter;

      if (item.audienceType === 'class') {
        const classMatch = timetableClassFilter === 'All' || item.className === timetableClassFilter;
        const sectionMatch = timetableSectionFilter === 'All' || (item.section || 'Unassigned') === timetableSectionFilter;
        return audienceMatch && dayMatch && classMatch && sectionMatch;
      }

      const roleMatch = timetableStaffRoleFilter === 'All' || (item.staffRole || 'Staff') === timetableStaffRoleFilter;
      const staffMatch = timetableStaffFilter === 'All' || item.staffName === timetableStaffFilter;
      return audienceMatch && dayMatch && roleMatch && staffMatch;
    });
  }, [
    timetableEntries,
    timetableAudienceFilter,
    timetableDayFilter,
    timetableSectionFilter,
    timetableClassFilter,
    timetableStaffRoleFilter,
    timetableStaffFilter
  ]);

  const departmentMemberCounts = useMemo(() => {
    const counts = new Map();
    users.forEach((item) => {
      const key = `${item.department || 'Unassigned'}::${item.section || 'Unassigned'}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [users]);

  const studentCountByClassSection = useMemo(() => {
    const counts = new Map();
    students.forEach((item) => {
      const section = item.section || 'Unassigned';
      const key = `${item.className}::${section}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [students]);

  const filteredClassStats = useMemo(() => {
    const totalEnrolled = filteredClasses.reduce((sum, item) => {
      const key = `${item.name}::${item.section || 'Unassigned'}`;
      return sum + (studentCountByClassSection.get(key) || 0);
    }, 0);

    const nearCapacity = filteredClasses.filter((item) => {
      const key = `${item.name}::${item.section || 'Unassigned'}`;
      const enrolled = studentCountByClassSection.get(key) || 0;
      const capacity = Number(item.capacity) || 1;
      return capacity > 0 && enrolled / capacity >= 0.9;
    }).length;

    return {
      total: filteredClasses.length,
      active: filteredClasses.filter((item) => (item.status || 'Active') === 'Active').length,
      totalEnrolled,
      nearCapacity
    };
  }, [filteredClasses, studentCountByClassSection]);

  const filteredSubjectStats = useMemo(() => ({
    total: filteredSubjects.length,
    active: filteredSubjects.filter((item) => (item.status || 'Active') === 'Active').length,
    classes: new Set(filteredSubjects.map((item) => item.className).filter(Boolean)).size || 0,
    subSchools: new Set(filteredSubjects.map((item) => item.section || 'Unassigned')).size || 0
  }), [filteredSubjects]);

  const filteredDepartmentStats = useMemo(() => {
    const totalMembers = filteredDepartments.reduce((sum, item) => {
      const key = `${item.name || 'Unassigned'}::${item.section || 'Unassigned'}`;
      return sum + (departmentMemberCounts.get(key) || 0);
    }, 0);

    return {
      total: filteredDepartments.length,
      active: filteredDepartments.filter((item) => (item.status || 'Active') === 'Active').length,
      subSchools: new Set(filteredDepartments.map((item) => item.section || 'Unassigned')).size || 0,
      totalMembers
    };
  }, [filteredDepartments, departmentMemberCounts]);

  const filteredTimetableStats = useMemo(() => {
    const classRows = filteredTimetableEntries.filter((item) => item.audienceType === 'class');
    const personalRows = filteredTimetableEntries.filter((item) => item.audienceType === 'personal');

    return {
      total: filteredTimetableEntries.length,
      classRows: classRows.length,
      personalRows: personalRows.length,
      teachersLinked: new Set(personalRows.filter((item) => item.staffRole === 'Teacher').map((item) => item.staffName).filter(Boolean)).size,
      staffLinked: new Set(personalRows.filter((item) => item.staffRole !== 'Teacher').map((item) => item.staffName).filter(Boolean)).size
    };
  }, [filteredTimetableEntries]);

  const filteredStudentStats = useMemo(() => ({
    total: filteredStudents.length,
    girls: filteredStudents.filter((item) => (item.gender || 'Not Specified') === 'Female').length,
    boys: filteredStudents.filter((item) => (item.gender || 'Not Specified') === 'Male').length,
    atRisk: filteredStudents.filter((item) => item.status === 'At Risk').length,
    platformPaid: filteredStudents.filter((item) => item.platformFeePaid).length,
    platformPending: filteredStudents.filter((item) => !item.platformFeePaid).length,
    schoolFeesUnpaid: filteredStudents.filter((item) => item.feeStatus !== 'Cleared').length
  }), [filteredStudents]);

  const filteredInvoices = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    return invoices.filter((item) => {
      const statusMatch = invoiceStatusFilter === 'All' || item.status === invoiceStatusFilter;
      const queryMatch = !query || `${item.invoiceNo} ${item.student} ${item.className}`.toLowerCase().includes(query);
      return statusMatch && queryMatch;
    });
  }, [invoices, globalSearch, invoiceStatusFilter]);

  const filteredExams = useMemo(() => {
    const query = examSearchTerm.trim().toLowerCase();

    return exams.filter((item) => {
      const classMatch = examClassFilter === 'All' || item.className === examClassFilter;
      const termMatch = examTermFilter === 'All' || item.term === examTermFilter;
      const sequenceMatch = examSequenceFilter === 'All' || item.sequence === examSequenceFilter;
      const statusMatch = examStatusFilter === 'All' || item.status === examStatusFilter;
      const queryMatch = !query || `${item.title} ${item.className} ${item.subject} ${item.term} ${item.sequence}`.toLowerCase().includes(query);

      return classMatch && termMatch && sequenceMatch && statusMatch && queryMatch;
    });
  }, [exams, examSearchTerm, examClassFilter, examTermFilter, examSequenceFilter, examStatusFilter]);

  const platformAttendanceRows = useMemo(() => {
    const hashOffset = (value) => {
      const source = String(value || 'user');
      const total = source.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return (total % 9) - 4;
    };

    const roleBaseline = (role, status) => {
      const normalizedStatus = String(status || 'Active').toLowerCase();
      if (normalizedStatus.includes('leave')) return 74;
      if (normalizedStatus.includes('inactive')) return 52;
      if (normalizedStatus.includes('risk')) return 69;

      const normalizedRole = String(role || '').toLowerCase();
      if (normalizedRole === 'admin') return 96;
      if (normalizedRole === 'teacher') return 93;
      if (normalizedRole === 'staff') return 91;
      if (normalizedRole === 'parent') return 89;
      return 90;
    };

    const studentRows = students.map((item) => ({
      id: `student-${item.id}`,
      name: item.name,
      role: 'Student',
      section: item.section || 'Unassigned',
      attendancePercent: Math.max(0, Math.min(100, Number(item.attendance || 0)))
    }));

    const userRows = users.map((item) => {
      const baseline = roleBaseline(item.role, item.status);
      const percent = Math.max(0, Math.min(100, baseline + hashOffset(item.name)));
      return {
        id: `user-${item.id}`,
        name: item.name,
        role: item.role,
        section: item.section || 'Unassigned',
        attendancePercent: percent
      };
    });

    return [...studentRows, ...userRows].sort((left, right) => right.attendancePercent - left.attendancePercent);
  }, [students, users]);

  const attendanceSummary = useMemo(() => {
    const totalUsers = platformAttendanceRows.length;
    const totalPercent = platformAttendanceRows.reduce((sum, item) => sum + item.attendancePercent, 0);
    const rate = totalUsers ? Math.round(totalPercent / totalUsers) : 0;

    return {
      totalUsers,
      excellent: platformAttendanceRows.filter((item) => item.attendancePercent >= 90).length,
      good: platformAttendanceRows.filter((item) => item.attendancePercent >= 75 && item.attendancePercent < 90).length,
      atRisk: platformAttendanceRows.filter((item) => item.attendancePercent < 75).length,
      rate
    };
  }, [platformAttendanceRows]);

  const attendanceRoleOptions = useMemo(
    () => ['All', ...Array.from(new Set(platformAttendanceRows.map((item) => item.role).filter(Boolean)))],
    [platformAttendanceRows]
  );

  const attendanceSectionOptions = useMemo(
    () => ['All', ...Array.from(new Set(platformAttendanceRows.map((item) => item.section).filter(Boolean)))],
    [platformAttendanceRows]
  );

  const filteredPlatformAttendanceRows = useMemo(() => {
    const query = attendanceSearchTerm.trim().toLowerCase();

    const getBand = (percent) => {
      if (percent >= 90) return 'Excellent';
      if (percent >= 75) return 'Good';
      return 'At Risk';
    };

    const filtered = platformAttendanceRows.filter((item) => {
      const queryMatch = !query || `${item.name} ${item.role} ${item.section}`.toLowerCase().includes(query);
      const roleMatch = attendanceRoleFilter === 'All' || item.role === attendanceRoleFilter;
      const sectionMatch = attendanceSectionFilter === 'All' || item.section === attendanceSectionFilter;
      const bandMatch = attendanceBandFilter === 'All' || getBand(item.attendancePercent) === attendanceBandFilter;
      return queryMatch && roleMatch && sectionMatch && bandMatch;
    });

    const sorted = [...filtered];
    if (attendanceSortBy === 'Lowest') {
      sorted.sort((left, right) => left.attendancePercent - right.attendancePercent);
    } else if (attendanceSortBy === 'Name') {
      sorted.sort((left, right) => left.name.localeCompare(right.name));
    } else {
      sorted.sort((left, right) => right.attendancePercent - left.attendancePercent);
    }

    return sorted;
  }, [
    platformAttendanceRows,
    attendanceSearchTerm,
    attendanceRoleFilter,
    attendanceSectionFilter,
    attendanceBandFilter,
    attendanceSortBy
  ]);

  const filteredAttendanceSummary = useMemo(() => {
    const totalUsers = filteredPlatformAttendanceRows.length;
    const totalPercent = filteredPlatformAttendanceRows.reduce((sum, item) => sum + item.attendancePercent, 0);
    const rate = totalUsers ? Math.round(totalPercent / totalUsers) : 0;

    return {
      totalUsers,
      excellent: filteredPlatformAttendanceRows.filter((item) => item.attendancePercent >= 90).length,
      good: filteredPlatformAttendanceRows.filter((item) => item.attendancePercent >= 75 && item.attendancePercent < 90).length,
      atRisk: filteredPlatformAttendanceRows.filter((item) => item.attendancePercent < 75).length,
      rate
    };
  }, [filteredPlatformAttendanceRows]);

  const invoiceSummary = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter((item) => item.status === 'Paid').length,
    unpaid: invoices.filter((item) => item.status !== 'Paid').length,
    pendingAmount: invoices.filter((item) => item.status !== 'Paid').reduce((sum, item) => sum + item.amount, 0)
  }), [invoices]);

  const examSummary = useMemo(() => ({
    total: filteredExams.length,
    scheduled: filteredExams.filter((item) => item.status === 'Scheduled').length,
    published: filteredExams.filter((item) => item.status === 'Published').length,
    closed: filteredExams.filter((item) => item.status === 'Closed').length,
    classes: new Set(filteredExams.map((item) => item.className).filter(Boolean)).size
  }), [filteredExams]);

  const eventSummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: events.length,
      upcoming: events.filter((item) => String(item.date || '') >= today).length,
      categories: new Set(events.map((item) => item.category).filter(Boolean)).size,
      organizers: new Set(events.map((item) => item.organizer).filter(Boolean)).size
    };
  }, [events]);

  const transportSummary = useMemo(() => {
    const totalSeats = transportRoutes.reduce((sum, item) => sum + Number(item.seats || 0), 0);
    const totalOccupied = transportRoutes.reduce((sum, item) => sum + Number(item.occupied || 0), 0);
    return {
      routes: transportRoutes.length,
      onSchedule: transportRoutes.filter((item) => item.status === 'On Schedule').length,
      full: transportRoutes.filter((item) => item.status === 'Full').length,
      occupancyRate: totalSeats ? Math.round((totalOccupied / totalSeats) * 100) : 0
    };
  }, [transportRoutes]);

  const classTeacherLookup = useMemo(() => {
    const lookup = {};

    teachers.forEach((teacher) => {
      const teacherName = String(teacher.name || '').trim();
      if (!teacherName) {
        return;
      }

      (teacher.allocatedClasses || []).forEach((className) => {
        const safeClass = String(className || '').trim();
        if (!safeClass) {
          return;
        }

        const section = teacher.section || 'Unassigned';
        const exactKey = buildClassKey(safeClass, section);
        const genericKey = buildClassKey(safeClass, 'All');
        if (!lookup[exactKey]) {
          lookup[exactKey] = teacherName;
        }
        if (!lookup[genericKey]) {
          lookup[genericKey] = teacherName;
        }
      });
    });

    subjects.forEach((subject) => {
      const className = String(subject.className || '').trim();
      const teacherName = String(subject.teacher || '').trim();
      if (!className || !teacherName) {
        return;
      }

      const section = subject.section || 'Unassigned';
      const exactKey = buildClassKey(className, section);
      const genericKey = buildClassKey(className, 'All');
      if (!lookup[exactKey]) {
        lookup[exactKey] = teacherName;
      }
      if (!lookup[genericKey]) {
        lookup[genericKey] = teacherName;
      }
    });

    return lookup;
  }, [teachers, subjects]);

  const subjectCoefficientLookup = useMemo(() => {
    const lookup = {};

    subjects.forEach((subject) => {
      const className = String(subject.className || '').trim();
      const section = String(subject.section || '').trim() || 'Unassigned';
      const subjectName = String(subject.name || '').trim();
      const coefficient = Number(subject.weeklyPeriods || 0);

      if (!subjectName || coefficient <= 0) {
        return;
      }

      lookup[`${className}__${section}__${subjectName}`.toLowerCase()] = coefficient;
      lookup[`${className}__all__${subjectName}`.toLowerCase()] = coefficient;
      lookup[`all__all__${subjectName}`.toLowerCase()] = coefficient;
    });

    return lookup;
  }, [subjects]);

  const studentResultDetailsByName = useMemo(() => {
    return results.reduce((accumulator, item) => {
      const studentName = String(item.student || '').trim();
      if (!studentName) {
        return accumulator;
      }

      if (!accumulator[studentName]) {
        accumulator[studentName] = [];
      }

      accumulator[studentName].push({
        subject: item.subject || 'General Assessment',
        score: Number(item.score || 0),
        grade: item.grade || getGradeFromAverage(item.score)
      });
      return accumulator;
    }, {});
  }, [results]);

  const rankedStudentPerformanceRows = useMemo(() => {
    const groupedByClass = students.reduce((accumulator, student) => {
      const className = student.className || 'Unassigned';
      const section = student.section || 'Unassigned';
      const classKey = buildClassKey(className, section);
      const subjectRecords = studentResultDetailsByName[student.name] || [];
      const computedAverage = subjectRecords.length
        ? subjectRecords.reduce((sum, item) => sum + Number(item.score || 0), 0) / subjectRecords.length
        : Number(student.resultAverage || 0);
      const average = Number(computedAverage.toFixed(1));
      const classTeacher = classTeacherLookup[buildClassKey(className, section)]
        || classTeacherLookup[buildClassKey(className, 'All')]
        || 'Unassigned';

      if (!accumulator[classKey]) {
        accumulator[classKey] = [];
      }

      accumulator[classKey].push({
        id: student.id,
        matricule: student.matricule || `STD-${student.id}`,
        name: student.name,
        parent: student.parent || 'N/A',
        className,
        section,
        gender: student.gender || 'Not Specified',
        attendance: Number(student.attendance || 0),
        average,
        grade: getGradeFromAverage(average),
        band: getPerformanceBand(average),
        subjectCount: subjectRecords.length,
        classTeacher
      });
      return accumulator;
    }, {});

    return Object.values(groupedByClass).flatMap((classRows) => {
      const sorted = [...classRows].sort((left, right) => (
        right.average - left.average
        || left.name.localeCompare(right.name)
      ));

      return sorted.map((item, index) => ({
        ...item,
        rank: index + 1,
        classSize: sorted.length
      }));
    });
  }, [students, studentResultDetailsByName, classTeacherLookup]);

  const schoolPerformanceStats = useMemo(() => {
    if (!rankedStudentPerformanceRows.length) {
      return {
        students: 0,
        average: 0,
        passRate: 0,
        failedRate: 0,
        topStudent: '-',
        topAverage: 0,
        excellent: 0,
        atRisk: 0
      };
    }

    const totalAverage = rankedStudentPerformanceRows.reduce((sum, item) => sum + item.average, 0);
    const top = [...rankedStudentPerformanceRows].sort((left, right) => right.average - left.average)[0];
    const passCount = rankedStudentPerformanceRows.filter((item) => item.average >= 10).length;

    return {
      students: rankedStudentPerformanceRows.length,
      average: Number((totalAverage / rankedStudentPerformanceRows.length).toFixed(1)),
      passRate: Math.round((passCount / rankedStudentPerformanceRows.length) * 100),
      failedRate: Math.max(0, 100 - Math.round((passCount / rankedStudentPerformanceRows.length) * 100)),
      topStudent: top?.name || '-',
      topAverage: Number(top?.average || 0),
      excellent: rankedStudentPerformanceRows.filter((item) => item.average >= 16).length,
      atRisk: rankedStudentPerformanceRows.filter((item) => item.average < 10).length
    };
  }, [rankedStudentPerformanceRows]);

  const sectionPerformanceStats = useMemo(() => {
    const grouped = rankedStudentPerformanceRows.reduce((accumulator, item) => {
      if (!accumulator[item.section]) {
        accumulator[item.section] = [];
      }
      accumulator[item.section].push(item);
      return accumulator;
    }, {});

    return Object.entries(grouped).map(([section, items]) => {
      const top = [...items].sort((left, right) => right.average - left.average)[0];
      const passCount = items.filter((item) => item.average >= 10).length;
      return {
        section,
        students: items.length,
        classes: new Set(items.map((item) => item.className)).size,
        average: Number((items.reduce((sum, item) => sum + item.average, 0) / items.length).toFixed(1)),
        passRate: Math.round((passCount / items.length) * 100),
        failedRate: Math.max(0, 100 - Math.round((passCount / items.length) * 100)),
        topStudent: top?.name || '-'
      };
    }).sort((left, right) => left.section.localeCompare(right.section));
  }, [rankedStudentPerformanceRows]);

  const classPerformanceStats = useMemo(() => {
    const grouped = rankedStudentPerformanceRows.reduce((accumulator, item) => {
      const key = buildClassKey(item.className, item.section);
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(item);
      return accumulator;
    }, {});

    return Object.entries(grouped).map(([classKey, items]) => {
      const top = [...items].sort((left, right) => right.average - left.average)[0];
      const passCount = items.filter((item) => item.average >= 10).length;
      return {
        classKey,
        className: items[0].className,
        section: items[0].section,
        classTeacher: items[0].classTeacher,
        students: items.length,
        average: Number((items.reduce((sum, item) => sum + item.average, 0) / items.length).toFixed(1)),
        passRate: Math.round((passCount / items.length) * 100),
        failedRate: Math.max(0, 100 - Math.round((passCount / items.length) * 100)),
        topStudent: top?.name || '-'
      };
    }).sort((left, right) => (
      left.section.localeCompare(right.section)
      || left.className.localeCompare(right.className)
    ));
  }, [rankedStudentPerformanceRows]);

  const resultSectionOptions = useMemo(
    () => ['All', ...Array.from(new Set(rankedStudentPerformanceRows.map((item) => item.section).filter(Boolean)))],
    [rankedStudentPerformanceRows]
  );

  const resultClassOptions = useMemo(() => {
    const scopedRows = resultSectionFilter === 'All'
      ? rankedStudentPerformanceRows
      : rankedStudentPerformanceRows.filter((item) => item.section === resultSectionFilter);
    return ['All', ...Array.from(new Set(scopedRows.map((item) => item.className).filter(Boolean)))];
  }, [rankedStudentPerformanceRows, resultSectionFilter]);

  const filteredRankedStudentRows = useMemo(() => {
    const query = resultSearchTerm.trim().toLowerCase();

    return rankedStudentPerformanceRows.filter((item) => {
      const sectionMatch = resultSectionFilter === 'All' || item.section === resultSectionFilter;
      const classMatch = resultClassFilter === 'All' || item.className === resultClassFilter;
      const bandMatch = resultBandFilter === 'All' || item.band === resultBandFilter;
      const queryMatch = !query || `${item.name} ${item.matricule} ${item.className} ${item.section} ${item.parent}`.toLowerCase().includes(query);
      return sectionMatch && classMatch && bandMatch && queryMatch;
    }).sort((left, right) => (
      left.section.localeCompare(right.section)
      || left.className.localeCompare(right.className)
      || left.rank - right.rank
    ));
  }, [rankedStudentPerformanceRows, resultSearchTerm, resultSectionFilter, resultClassFilter, resultBandFilter]);

  const filteredResultSummary = useMemo(() => {
    if (!filteredRankedStudentRows.length) {
      return { students: 0, average: 0, passRate: 0, failedRate: 0, excellent: 0, atRisk: 0 };
    }

    const totalAverage = filteredRankedStudentRows.reduce((sum, item) => sum + item.average, 0);
    const passCount = filteredRankedStudentRows.filter((item) => item.average >= 10).length;
    return {
      students: filteredRankedStudentRows.length,
      average: Number((totalAverage / filteredRankedStudentRows.length).toFixed(1)),
      passRate: Math.round((passCount / filteredRankedStudentRows.length) * 100),
      failedRate: Math.max(0, 100 - Math.round((passCount / filteredRankedStudentRows.length) * 100)),
      excellent: filteredRankedStudentRows.filter((item) => item.average >= 16).length,
      atRisk: filteredRankedStudentRows.filter((item) => item.average < 10).length
    };
  }, [filteredRankedStudentRows]);

  const exportSchoolPerformancePdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);
    const green = [15, 118, 110];
    const blue = [29, 78, 216];

    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(margin, 12, contentWidth, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${schoolProfile.schoolName} - SCHOOL PERFORMANCE REPORT`, pageWidth / 2, 21, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10.5);
    doc.text(`Academic Session: ${reportAcademicYearFilter}`, margin, 34);
    doc.text(`Term: ${schoolProfile.currentTerm}`, margin + 72, 34);
    doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, margin + 125, 34);

    const cardsY = 40;
    const gap = 3;
    const cardWidth = (contentWidth - (gap * 3)) / 4;
    const cardHeight = 18;
    const cards = [
      { label: 'Students', value: String(schoolPerformanceStats.students), fill: [240, 249, 255] },
      { label: 'School Average', value: `${schoolPerformanceStats.average}/20`, fill: [236, 253, 245] },
      { label: 'Passed %', value: `${schoolPerformanceStats.passRate}%`, fill: [239, 246, 255] },
      { label: 'Failed %', value: `${schoolPerformanceStats.failedRate}%`, fill: [254, 242, 242] }
    ];

    cards.forEach((card, index) => {
      const x = margin + ((cardWidth + gap) * index);
      doc.setDrawColor(209, 213, 219);
      doc.setFillColor(card.fill[0], card.fill[1], card.fill[2]);
      doc.rect(x, cardsY, cardWidth, cardHeight, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(card.label, x + 3, cardsY + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(card.value, x + 3, cardsY + 13);
    });

    let y = 66;
    doc.setFillColor(blue[0], blue[1], blue[2]);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('SUB-SCHOOL PERFORMANCE SUMMARY', margin + 3, y + 5.5);
    y += 10;

    const sectionHeaders = ['Sub-School', 'Students', 'Classes', 'Average', 'Passed %', 'Failed %'];
    const sectionCols = [54, 22, 20, 24, 24, 24];
    const sectionWidth = sectionCols.reduce((sum, width) => sum + width, 0);
    const rowHeight = 7;

    doc.setFillColor(31, 41, 55);
    doc.rect(margin, y, sectionWidth, rowHeight, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    let x = margin;
    sectionHeaders.forEach((header, index) => {
      doc.text(header, x + (sectionCols[index] / 2), y + 4.7, { align: 'center' });
      x += sectionCols[index];
    });
    y += rowHeight;

    sectionPerformanceStats.forEach((item, index) => {
      if (y > pageHeight - 48) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
      doc.rect(margin, y, sectionWidth, rowHeight, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(margin, y, sectionWidth, rowHeight);
      const values = [item.section, item.students, item.classes, `${item.average}/20`, `${item.passRate}%`, `${item.failedRate}%`];
      let cx = margin;
      doc.setTextColor(17, 24, 39);
      values.forEach((value, valueIndex) => {
        const align = valueIndex === 0 ? 'left' : 'center';
        const tx = align === 'left' ? cx + 2 : cx + (sectionCols[valueIndex] / 2);
        doc.text(String(value), tx, y + 4.7, { align });
        cx += sectionCols[valueIndex];
      });
      y += rowHeight;
    });

    y += 8;
    doc.setFillColor(blue[0], blue[1], blue[2]);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('CLASS PERFORMANCE SUMMARY', margin + 3, y + 5.5);
    y += 10;

    const classHeaders = ['Class', 'Sub-School', 'Students', 'Average', 'Passed %', 'Failed %'];
    const classCols = [32, 45, 20, 24, 24, 24];
    const classWidth = classCols.reduce((sum, width) => sum + width, 0);

    doc.setFillColor(31, 41, 55);
    doc.rect(margin, y, classWidth, rowHeight, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    x = margin;
    classHeaders.forEach((header, index) => {
      doc.text(header, x + (classCols[index] / 2), y + 4.7, { align: 'center' });
      x += classCols[index];
    });
    y += rowHeight;

    classPerformanceStats.forEach((item, index) => {
      if (y > pageHeight - 14) {
        doc.addPage();
        y = 20;
        doc.setFillColor(31, 41, 55);
        doc.rect(margin, y, classWidth, rowHeight, 'F');
        doc.setTextColor(255, 255, 255);
        x = margin;
        classHeaders.forEach((header, headerIndex) => {
          doc.text(header, x + (classCols[headerIndex] / 2), y + 4.7, { align: 'center' });
          x += classCols[headerIndex];
        });
        y += rowHeight;
      }

      doc.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
      doc.rect(margin, y, classWidth, rowHeight, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(margin, y, classWidth, rowHeight);
      const values = [item.className, item.section, item.students, `${item.average}/20`, `${item.passRate}%`, `${item.failedRate}%`];
      let cx = margin;
      doc.setTextColor(17, 24, 39);
      values.forEach((value, valueIndex) => {
        const align = valueIndex <= 1 ? 'left' : 'center';
        const tx = align === 'left' ? cx + 2 : cx + (classCols[valueIndex] / 2);
        doc.text(String(value), tx, y + 4.7, { align });
        cx += classCols[valueIndex];
      });
      y += rowHeight;
    });

    const safeSection = resultSectionFilter === 'All'
      ? 'all-sections'
      : String(resultSectionFilter).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    doc.save(`school-performance-summary-${safeSection}.pdf`);
  };

  const filteredSectionPerformanceStats = useMemo(() => {
    return sectionPerformanceStats.filter((item) => (
      resultSectionFilter === 'All' || item.section === resultSectionFilter
    ));
  }, [sectionPerformanceStats, resultSectionFilter]);

  const filteredClassPerformanceStats = useMemo(() => {
    return classPerformanceStats.filter((item) => {
      const sectionMatch = resultSectionFilter === 'All' || item.section === resultSectionFilter;
      const classMatch = resultClassFilter === 'All' || item.className === resultClassFilter;
      return sectionMatch && classMatch;
    });
  }, [classPerformanceStats, resultSectionFilter, resultClassFilter]);

  const classScopeRankedRows = useMemo(() => {
    if (resultClassFilter === 'All') {
      return [];
    }

    return rankedStudentPerformanceRows.filter((item) => (
      item.className === resultClassFilter
      && (resultSectionFilter === 'All' || item.section === resultSectionFilter)
    )).sort((left, right) => (
      left.section.localeCompare(right.section)
      || left.rank - right.rank
    ));
  }, [rankedStudentPerformanceRows, resultClassFilter, resultSectionFilter]);

  const schoolRankedStudentRows = useMemo(() => {
    return [...rankedStudentPerformanceRows]
      .sort((left, right) => (
        right.average - left.average
        || left.name.localeCompare(right.name)
      ))
      .map((item, index) => ({
        ...item,
        schoolRank: index + 1
      }));
  }, [rankedStudentPerformanceRows]);

  const topSchoolStudentRows = useMemo(() => {
    const parsed = Number.parseInt(String(resultTopCountInput || '').trim(), 10);
    const safeTopCount = Number.isFinite(parsed) && parsed > 0 ? parsed : schoolRankedStudentRows.length;
    return schoolRankedStudentRows.slice(0, safeTopCount);
  }, [schoolRankedStudentRows, resultTopCountInput]);

  const schoolRankByStudentId = useMemo(() => {
    return schoolRankedStudentRows.reduce((accumulator, item) => {
      accumulator[item.id] = item.schoolRank;
      return accumulator;
    }, {});
  }, [schoolRankedStudentRows]);

  const filteredRankedStudentRowsWithSchoolRank = useMemo(() => {
    return filteredRankedStudentRows.map((item) => ({
      ...item,
      schoolRank: schoolRankByStudentId[item.id] || null
    }));
  }, [filteredRankedStudentRows, schoolRankByStudentId]);

  const resultSummary = useMemo(() => {
    return {
      average: schoolPerformanceStats.average,
      top: schoolPerformanceStats.topStudent,
      atRisk: schoolPerformanceStats.atRisk
    };
  }, [schoolPerformanceStats]);

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

  const reportAcademicYearOptions = useMemo(() => {
    const recentYears = getRecentAcademicYears(schoolProfile.currentSession, 5);
    const generatedYears = generatedReports.map((item) => item.academicYear).filter(Boolean);
    return Array.from(new Set([...recentYears, ...generatedYears]));
  }, [schoolProfile.currentSession, generatedReports]);

  const yearScopedFinanceInvoices = useMemo(() => {
    const fallbackSession = schoolProfile.currentSession || reportAcademicYearFilter || '2025/2026';
    return invoices.filter((item) => (
      getAcademicYearFromDate(item.dueDate, fallbackSession) === reportAcademicYearFilter
    ));
  }, [invoices, schoolProfile.currentSession, reportAcademicYearFilter]);

  const yearScopedAttendanceRows = useMemo(() => {
    const fallbackSession = schoolProfile.currentSession || reportAcademicYearFilter || '2025/2026';
    return attendance.filter((item) => (
      getAcademicYearFromDate(item.date, fallbackSession) === reportAcademicYearFilter
    ));
  }, [attendance, schoolProfile.currentSession, reportAcademicYearFilter]);

  const yearScopedReportData = useMemo(() => {
    const collections = yearScopedFinanceInvoices
      .filter((item) => item.status === 'Paid')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const billed = yearScopedFinanceInvoices
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const attendanceRate = yearScopedAttendanceRows.length
      ? Math.round(
        yearScopedAttendanceRows.reduce((sum, item) => {
          const present = Number(item.present || 0);
          const absent = Number(item.absent || 0);
          const late = Number(item.late || 0);
          const total = present + absent + late;
          return sum + (total ? ((present / total) * 100) : 0);
        }, 0) / yearScopedAttendanceRows.length
      )
      : 0;

    const resultAverage = reportAcademicYearFilter === (schoolProfile.currentSession || reportAcademicYearFilter)
      ? resultSummary.average
      : 0;

    return {
      usersByRole: reportData.usersByRole,
      billed,
      collections,
      outstanding: billed - collections,
      attendanceRate,
      resultAverage
    };
  }, [
    yearScopedFinanceInvoices,
    yearScopedAttendanceRows,
    reportAcademicYearFilter,
    schoolProfile.currentSession,
    resultSummary.average,
    reportData.usersByRole
  ]);

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

  const examClassOptions = useMemo(
    () => Array.from(new Set(classes.map((item) => item.name).filter(Boolean))),
    [classes]
  );

  const examTermOptions = useMemo(
    () => academicTermStructure.map((term) => term.name).filter(Boolean),
    [academicTermStructure]
  );

  const examSequenceOptions = useMemo(() => {
    const activeTerm = academicTermStructure.find((term) => term.name === examDraft.term) || academicTermStructure[0];
    return activeTerm?.sequences || [];
  }, [academicTermStructure, examDraft.term]);

  const sectionOptions = useMemo(() => {
    const normalized = normalizeSchoolConfig(schoolProfile);
    return normalized.sections || [];
  }, [schoolProfile]);

  useEffect(() => {
    if (resultClassFilter !== 'All' && !resultClassOptions.includes(resultClassFilter)) {
      setResultClassFilter('All');
    }
  }, [resultClassFilter, resultClassOptions]);

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
    if (!examClassOptions.length && !examTermOptions.length) {
      return;
    }

    setExamDraft((prev) => {
      const fallbackTerm = examTermOptions[0] || prev.term;
      const fallbackSequence = (academicTermStructure.find((term) => term.name === fallbackTerm)?.sequences || [])[0] || prev.sequence;

      return {
        ...prev,
        className: examClassOptions.includes(prev.className) ? prev.className : (examClassOptions[0] || ''),
        term: examTermOptions.includes(prev.term) ? prev.term : fallbackTerm,
        sequence: examSequenceOptions.includes(prev.sequence) ? prev.sequence : fallbackSequence
      };
    });
  }, [examClassOptions, examTermOptions, examSequenceOptions, academicTermStructure]);

  useEffect(() => {
    const registeredClassNames = Array.from(new Set(classes.map((item) => item.name))).filter(Boolean);
    const availableClassOptions = registeredClassNames.length
      ? registeredClassNames
      : Array.from(new Set(students.map((item) => item.className))).filter(Boolean);

    if (!availableClassOptions.length) {
      return;
    }

    setEnrollmentDraft((prev) => ({
      ...prev,
      className: availableClassOptions.includes(prev.className) ? prev.className : availableClassOptions[0]
    }));
  }, [classes, students]);

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
          gender: entry.gender || existing?.gender || 'Not Specified',
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
  const studentSectionOptions = useMemo(() => ['All', ...Array.from(new Set(students.map((item) => item.section).filter(Boolean)))], [students]);
  const idCardClassOptions = useMemo(() => {
    const classNames = Array.from(new Set(students.map((item) => item.className).filter(Boolean)));
    return ['All', ...classNames];
  }, [students]);
  const idCardSectionOptions = useMemo(() => {
    const scopedStudents = idCardClassFilter === 'All'
      ? students
      : students.filter((item) => item.className === idCardClassFilter);
    return ['All', ...Array.from(new Set(scopedStudents.map((item) => item.section).filter(Boolean)))];
  }, [students, idCardClassFilter]);
  const studentGenderOptions = useMemo(() => ['All', 'Male', 'Female', 'Not Specified'], []);
  const enrollmentClassOptions = useMemo(() => {
    const registeredClassNames = Array.from(new Set(classes.map((item) => item.name))).filter(Boolean);
    if (registeredClassNames.length) {
      return registeredClassNames;
    }
    return Array.from(new Set(students.map((item) => item.className))).filter(Boolean);
  }, [classes, students]);
  const teacherClassOptions = useMemo(() => Array.from(new Set(classes.map((item) => item.name))).filter(Boolean), [classes]);
  const teacherSubjectOptions = useMemo(() => Array.from(new Set(subjects.map((item) => item.name))).filter(Boolean), [subjects]);
  const teacherDepartmentOptions = useMemo(() => ['All', ...Array.from(new Set(teachers.map((item) => item.department).filter(Boolean)))], [teachers]);
  const teacherSectionOptions = useMemo(() => ['All', ...Array.from(new Set(teachers.map((item) => item.section || 'Unassigned').filter(Boolean)))], [teachers]);
  const teacherStatusOptions = useMemo(() => ['All', ...Array.from(new Set(teachers.map((item) => item.status).filter(Boolean)))], [teachers]);
  const classBlockOptions = useMemo(() => ['All', ...Array.from(new Set(classes.map((item) => item.blockName || 'Unassigned Block').filter(Boolean)))], [classes]);
  const classStatusOptions = useMemo(() => ['All', ...Array.from(new Set(classes.map((item) => item.status || 'Active').filter(Boolean)))], [classes]);
  const classSectionOptions = useMemo(() => ['All', ...Array.from(new Set(classes.map((item) => item.section || 'Unassigned').filter(Boolean)))], [classes]);
  const subjectClassOptions = useMemo(() => Array.from(new Set(classes.map((item) => item.name))).filter(Boolean), [classes]);
  const subjectSectionOptions = useMemo(() => ['All', ...Array.from(new Set(classes.map((item) => item.section || 'Unassigned').filter(Boolean)))], [classes]);
  const subjectClassSlotOptions = useMemo(
    () => ['All', ...classes.map((item) => `${item.name} | ${item.section || 'Unassigned'}`)],
    [classes]
  );
  const subjectDepartmentOptions = useMemo(() => ['All', ...Array.from(new Set(departments.map((item) => item.name).filter(Boolean)))], [departments]);
  const subjectStatusOptions = useMemo(() => ['All', ...Array.from(new Set(subjects.map((item) => item.status || 'Active').filter(Boolean)))], [subjects]);
  const subjectTeacherOptions = useMemo(() => ['Unassigned', ...Array.from(new Set(teachers.map((item) => item.name).filter(Boolean)))], [teachers]);
  const idCardEnrollmentLookup = useMemo(() => {
    const lookup = new Map();
    studentEnrollments.forEach((entry) => {
      const matriculeKey = String(entry.matricule || '').trim().toLowerCase();
      const nameKey = String(entry.name || '').trim().toLowerCase();

      if (matriculeKey) {
        lookup.set(matriculeKey, entry);
      }
      if (nameKey) {
        lookup.set(nameKey, entry);
      }
    });

    return lookup;
  }, [studentEnrollments]);
  const idCardRows = useMemo(() => {
    return students
      .filter((item) => (idCardClassFilter === 'All' || item.className === idCardClassFilter))
      .filter((item) => (idCardSectionFilter === 'All' || item.section === idCardSectionFilter))
      .sort((left, right) => (
        left.className.localeCompare(right.className)
        || left.section.localeCompare(right.section)
        || left.name.localeCompare(right.name)
      ))
      .map((student) => {
        const enrollment = idCardEnrollmentLookup.get(String(student.matricule || '').toLowerCase())
          || idCardEnrollmentLookup.get(String(student.name || '').toLowerCase())
          || {};
        const idNumber = student.matricule || `STD-${String(student.id || '').padStart(4, '0')}`;
        const qrPayload = [
          schoolProfile.schoolName,
          student.name,
          idNumber,
          student.className,
          student.section,
          schoolProfile.currentSession
        ].filter(Boolean).join(' | ');

        return {
          ...student,
          idNumber,
          dateOfBirth: enrollment.dateOfBirth || '',
          avatar: buildAvatar(student.name),
          qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`
        };
      });
  }, [students, idCardClassFilter, idCardSectionFilter, idCardEnrollmentLookup, schoolProfile]);

  useEffect(() => {
    if (idCardClassFilter !== 'All' && !idCardClassOptions.includes(idCardClassFilter)) {
      setIdCardClassFilter('All');
    }
  }, [idCardClassFilter, idCardClassOptions]);

  useEffect(() => {
    if (idCardSectionFilter !== 'All' && !idCardSectionOptions.includes(idCardSectionFilter)) {
      setIdCardSectionFilter('All');
    }
  }, [idCardSectionFilter, idCardSectionOptions]);

  const timetableDraftSubjectOptions = useMemo(() => {
    if (!timetableDraft.className || !timetableDraft.section) {
      return Array.from(new Set(subjects.map((item) => item.name).filter(Boolean)));
    }

    return Array.from(new Set(
      subjects
        .filter((item) => item.className === timetableDraft.className && (item.section || 'Unassigned') === timetableDraft.section)
        .map((item) => item.name)
        .filter(Boolean)
    ));
  }, [subjects, timetableDraft.className, timetableDraft.section]);

  const timetableEditSubjectOptions = useMemo(() => {
    if (!timetableEditDraft.className || !timetableEditDraft.section) {
      return Array.from(new Set(subjects.map((item) => item.name).filter(Boolean)));
    }

    return Array.from(new Set(
      subjects
        .filter((item) => item.className === timetableEditDraft.className && (item.section || 'Unassigned') === timetableEditDraft.section)
        .map((item) => item.name)
        .filter(Boolean)
    ));
  }, [subjects, timetableEditDraft.className, timetableEditDraft.section]);
  const timetableAudienceOptions = useMemo(() => ['All', 'class', 'personal'], []);
  const timetableClassOptions = useMemo(() => ['All', ...Array.from(new Set(classes.map((item) => item.name).filter(Boolean)))], [classes]);
  const timetableSectionOptions = useMemo(() => ['All', ...Array.from(new Set(sectionOptions.filter(Boolean)))], [sectionOptions]);
  const timetableStaffRoleOptions = useMemo(() => ['All', 'Teacher', 'Staff'], []);
  const timetableAssignableUsers = useMemo(
    () => users.filter((item) => item.role === 'Teacher' || item.role === 'Staff'),
    [users]
  );
  const timetableStaffOptions = useMemo(
    () => ['All', ...Array.from(new Set(timetableAssignableUsers.map((item) => item.name).filter(Boolean)))],
    [timetableAssignableUsers]
  );
  const departmentHeadOptions = useMemo(
    () => ['All', 'Unassigned', ...Array.from(new Set(users.filter((item) => item.role !== 'Parent').map((item) => item.name).filter(Boolean)))],
    [users]
  );
  const departmentSectionOptions = useMemo(() => ['All', ...Array.from(new Set(sectionOptions.filter(Boolean)))], [sectionOptions]);
  const departmentStatusOptions = useMemo(() => ['All', ...Array.from(new Set(departments.map((item) => item.status || 'Active').filter(Boolean)))], [departments]);

  const getPaginatedData = (key, items) => {
    const safeItems = Array.isArray(items) ? items : [];
    const totalPages = Math.max(1, Math.ceil(safeItems.length / ROWS_PER_PAGE));
    const requestedPage = Number(paginationState[key] || 1);
    const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
    const start = (currentPage - 1) * ROWS_PER_PAGE;

    return {
      currentPage,
      totalPages,
      pageItems: safeItems.slice(start, start + ROWS_PER_PAGE),
      totalItems: safeItems.length
    };
  };

  const goToPage = (key, page) => {
    setPaginationState((prev) => ({
      ...prev,
      [key]: Math.max(1, Number(page) || 1)
    }));
  };

  const renderPaginationControls = (key, pageData, label = 'records') => {
    if (!pageData || pageData.totalPages <= 1) {
      return null;
    }

    return (
      <div className="admin-pagination" role="navigation" aria-label={`${label} pagination`}>
        <button
          type="button"
          className="row-action"
          onClick={() => goToPage(key, pageData.currentPage - 1)}
          disabled={pageData.currentPage <= 1}
        >
          Back
        </button>
        <span>Page {pageData.currentPage} of {pageData.totalPages} • {pageData.totalItems} {label}</span>
        <button
          type="button"
          className="row-action"
          onClick={() => goToPage(key, pageData.currentPage + 1)}
          disabled={pageData.currentPage >= pageData.totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (!enrollmentClassOptions.length) {
      return;
    }
    setEnrollmentDraft((prev) => ({
      ...prev,
      className: enrollmentClassOptions.includes(prev.className) ? prev.className : enrollmentClassOptions[0]
    }));
  }, [enrollmentClassOptions]);

  useEffect(() => {
    const defaultSection = sectionOptions[0] || 'English School';
    const defaultClass = timetableClassOptions.find((item) => item !== 'All') || '';
    const defaultStaff = timetableStaffOptions.find((item) => item !== 'All') || '';

    setTimetableDraft((prev) => ({
      ...prev,
      section: sectionOptions.includes(prev.section) ? prev.section : defaultSection,
      className: prev.className || defaultClass,
      staffName: prev.staffName || defaultStaff
    }));
  }, [sectionOptions, timetableClassOptions, timetableStaffOptions]);

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
      const assignedClasses = (user.allocatedClasses && user.allocatedClasses.length)
        ? user.allocatedClasses.map((className) => ({ name: className, room: '-', students: '-' }))
        : classes.filter((item) => item.teacher === user.name);
      const assignedSubjects = (user.allocatedSubjects && user.allocatedSubjects.length)
        ? user.allocatedSubjects.map((subjectName) => ({ name: subjectName, weeklyPeriods: '-' }))
        : subjects.filter((item) => item.teacher === user.name);
      const scheduleRows = timetableEntries.filter((item) => (
        item.audienceType === 'personal' && item.staffName === user.name
      ));

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
              ? scheduleRows.map((item) => `${item.day} • ${item.period} • ${item.activity || '-'} (${item.room || 'No room'})`)
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
          title: 'Personal Timetable Records',
          items: timetableEntries
            .filter((item) => item.audienceType === 'personal' && item.staffName === user.name)
            .map((item) => `${item.day} • ${item.period} • ${item.activity || '-'}`)
            .slice(0, 6)
            .concat(
              timetableEntries.some((item) => item.audienceType === 'personal' && item.staffName === user.name)
                ? []
                : ['No personal timetable entry linked yet.']
            )
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
  }, [selectedProfileTarget, students, users, results, invoices, attendance, messages, classes, subjects, timetableEntries, schoolProfile, sectionOptions, studentEnrollments]);

  const enrollTimetableEntry = () => {
    const base = {
      audienceType: timetableDraft.audienceType,
      day: timetableDraft.day,
      period: timetableDraft.period.trim(),
      room: timetableDraft.room.trim()
    };

    if (!base.period) {
      alert('Please provide the period/time range.');
      return;
    }

    if (base.audienceType === 'class') {
      const payload = {
        ...base,
        className: timetableDraft.className,
        section: timetableDraft.section,
        subject: timetableDraft.subject.trim(),
        teacher: timetableDraft.teacher.trim() || 'Unassigned'
      };

      if (!payload.className || !payload.section || !payload.subject) {
        alert('Class timetable needs class, sub-school, and subject.');
        return;
      }

      const duplicate = timetableEntries.some((item) => (
        item.audienceType === 'class'
        && item.day === payload.day
        && item.period === payload.period
        && item.className === payload.className
        && (item.section || 'Unassigned') === payload.section
      ));

      if (duplicate) {
        alert('A class timetable entry already exists for this class slot and period.');
        return;
      }

      const entry = { id: Date.now(), ...payload };
      setTimetableEntries((prev) => saveTimetableEntries([entry, ...prev]));
      setTimetableDraft((prev) => ({ ...prev, subject: '', period: '08:00 - 09:00', room: '' }));
      setShowTimetableForm(false);
      setNotice(`Class timetable assigned for ${entry.className} (${entry.section}).`);
      return;
    }

    const payload = {
      ...base,
      staffName: timetableDraft.staffName,
      staffRole: timetableDraft.staffRole,
      activity: timetableDraft.activity.trim()
    };

    if (!payload.staffName || !payload.activity) {
      alert('Personal timetable needs staff name and activity details.');
      return;
    }

    const duplicate = timetableEntries.some((item) => (
      item.audienceType === 'personal'
      && item.day === payload.day
      && item.period === payload.period
      && item.staffName === payload.staffName
    ));

    if (duplicate) {
      alert('This staff member already has a timetable entry for the selected day and period.');
      return;
    }

    const entry = { id: Date.now(), ...payload };
    setTimetableEntries((prev) => saveTimetableEntries([entry, ...prev]));
    setTimetableDraft((prev) => ({ ...prev, activity: '', period: '08:00 - 09:00', room: '' }));
    setShowTimetableForm(false);
    setNotice(`Personal timetable assigned to ${entry.staffName}.`);
  };

  const openTimetableEdit = (item) => {
    setEditingTimetableId(item.id);
    setTimetableEditDraft({
      audienceType: item.audienceType || 'class',
      day: item.day || (TIMETABLE_DAYS[0] || 'Monday'),
      period: item.period || '08:00 - 09:00',
      className: item.className || '',
      section: item.section || sectionOptions[0] || 'English School',
      subject: item.subject || '',
      teacher: item.teacher || 'Unassigned',
      staffName: item.staffName || '',
      staffRole: item.staffRole || 'Teacher',
      activity: item.activity || '',
      room: item.room || ''
    });
  };

  const saveTimetableEdit = () => {
    if (!editingTimetableId) {
      return;
    }

    const period = timetableEditDraft.period.trim();
    if (!period) {
      alert('Period/time range is required.');
      return;
    }

    if (timetableEditDraft.audienceType === 'class') {
      const className = timetableEditDraft.className;
      const section = timetableEditDraft.section;
      const subject = timetableEditDraft.subject.trim();
      if (!className || !section || !subject) {
        alert('Class timetable edit needs class, sub-school and subject.');
        return;
      }
    } else {
      const staffName = timetableEditDraft.staffName;
      const activity = timetableEditDraft.activity.trim();
      if (!staffName || !activity) {
        alert('Personal timetable edit needs staff name and activity.');
        return;
      }
    }

    setTimetableEntries((prev) => saveTimetableEntries(prev.map((item) => {
      if (item.id !== editingTimetableId) {
        return item;
      }

      if (timetableEditDraft.audienceType === 'class') {
        return {
          ...item,
          audienceType: 'class',
          day: timetableEditDraft.day,
          period,
          className: timetableEditDraft.className,
          section: timetableEditDraft.section,
          subject: timetableEditDraft.subject.trim(),
          teacher: timetableEditDraft.teacher.trim() || 'Unassigned',
          room: timetableEditDraft.room.trim()
        };
      }

      return {
        ...item,
        audienceType: 'personal',
        day: timetableEditDraft.day,
        period,
        staffName: timetableEditDraft.staffName,
        staffRole: timetableEditDraft.staffRole,
        activity: timetableEditDraft.activity.trim(),
        room: timetableEditDraft.room.trim()
      };
    })));

    setEditingTimetableId(null);
    setNotice('Timetable entry updated successfully.');
  };

  const cancelTimetableEdit = () => {
    setEditingTimetableId(null);
  };

  const removeTimetableEntry = (id) => {
    setTimetableEntries((prev) => saveTimetableEntries(prev.filter((item) => item.id !== id)));
    setNotice('Timetable entry removed.');
  };

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

  const enrollAdminFromAdmin = () => {
    const safeName = String(adminEnrollmentDraft.name || '').trim();
    const safeEmail = String(adminEnrollmentDraft.email || '').trim();
    const safePhone = String(adminEnrollmentDraft.phone || '').trim();
    const safeTabs = (adminEnrollmentDraft.managedTabs || []).filter(Boolean);

    if (!safeName) {
      alert('Please provide admin full name.');
      return;
    }

    if (!safeTabs.length) {
      alert('Please allocate at least one manageable tab.');
      return;
    }

    const fallbackEmail = `${safeName.toLowerCase().replace(/\s+/g, '.')}@eduignite.edu`;
    const adminMatricule = `ADM-${safeName.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const nextAdmin = {
      id: Date.now(),
      matricule: adminMatricule,
      name: safeName,
      role: 'Admin',
      email: safeEmail || fallbackEmail,
      phone: safePhone,
      department: 'Administration',
      section: adminEnrollmentDraft.section || sectionOptions[0] || 'English School',
      managedTabs: safeTabs,
      status: 'Active'
    };

    setUsers((prev) => [nextAdmin, ...prev]);
    setAdminEnrollmentDraft((prev) => ({
      ...prev,
      name: '',
      email: '',
      phone: '',
      managedTabs: ['dashboard', 'users', 'students', 'reports']
    }));
    setNotice(`Admin enrolled successfully: ${nextAdmin.name}`);
  };

  const updateAdminManagedTabs = (id, managedTabs) => {
    const safeTabs = (managedTabs || []).filter(Boolean);
    if (!safeTabs.length) {
      alert('At least one tab must be assigned to an admin.');
      return;
    }

    setUsers((prev) => prev.map((item) => (
      item.id === id && item.role === 'Admin'
        ? { ...item, managedTabs: safeTabs }
        : item
    )));
    setNotice('Admin tab allocation updated successfully.');
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

  const downloadStudentEnrollmentPdf = (student) => {
    const enrollment = studentEnrollments.find((item) => item.matricule === student.matricule || item.name === student.name);
    const doc = new jsPDF('p', 'mm', 'a4');
    const resolveValue = (value) => {
      const normalized = String(value || '').trim();
      if (!normalized || normalized.toLowerCase() === 'not specified') {
        return 'N/A';
      }
      return normalized;
    };

    const rows = [
      { label: 'School', value: resolveValue(schoolProfile.schoolName || 'EduIgnite International School') },
      { label: 'School Code', value: resolveValue(schoolProfile.schoolCode || 'EIMS-MAIN') },
      { label: 'Student Name', value: resolveValue(student.name) },
      { label: 'Matricule', value: resolveValue(student.matricule) },
      { label: 'Sub-School', value: resolveValue(student.section || enrollment?.subSchool) },
      { label: 'Class', value: resolveValue(student.className || enrollment?.className) },
      { label: 'Parent/Guardian', value: resolveValue(student.parent || enrollment?.parent) },
      { label: 'Gender', value: resolveValue(enrollment?.gender || student.gender) },
      { label: 'Date of Birth', value: resolveValue(enrollment?.dateOfBirth || student.dateOfBirth) },
      { label: 'Guardian Phone', value: resolveValue(enrollment?.guardianPhone || student.guardianPhone) },
      { label: 'Address', value: resolveValue(enrollment?.address || student.address) },
      { label: 'Platform Fee Status', value: student.platformFeePaid ? 'Paid' : 'Pending' },
      { label: 'Enrolled At', value: resolveValue(enrollment?.enrolledAt || student.enrolledAt || new Date().toISOString().slice(0, 10)) }
    ];

    doc.setDrawColor(20, 84, 72);
    doc.setLineWidth(0.7);
    doc.rect(10, 10, 190, 277);
    doc.setLineWidth(0.25);
    doc.rect(13, 13, 184, 271);

    doc.setTextColor(20, 84, 72);
    doc.setFont('times', 'bold');
    doc.setFontSize(17);
    doc.text('STUDENT ENROLLMENT FORM', 105, 24, { align: 'center' });

    doc.setDrawColor(201, 172, 83);
    doc.setLineWidth(1);
    doc.line(24, 30, 186, 30);

    doc.setTextColor(35, 35, 35);
    doc.setFont('times', 'normal');
    doc.setFontSize(11.2);

    let y = 40;
    rows.forEach((row) => {
      doc.setFillColor(243, 246, 244);
      doc.rect(16, y - 6, 56, 9, 'F');
      doc.setDrawColor(215, 215, 215);
      doc.rect(16, y - 6, 176, 9);
      doc.setFont('times', 'bold');
      doc.text(`${row.label}:`, 19, y);
      doc.setFont('times', 'normal');
      doc.text(String(row.value), 74, y);
      y += 10;
    });

    doc.setTextColor(95, 95, 95);
    doc.setFontSize(10);
    doc.text('Generated by the school management enrollment workflow.', 16, 274);
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
        gender: created.gender || enrollmentDraft.gender,
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
      className: enrollmentClassOptions[0] || prev.className,
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

  const getMultiSelectValues = (event) => Array.from(event.target.selectedOptions || []).map((option) => option.value);

  const downloadTeacherEnrollmentPdf = (teacher) => {
    const doc = new jsPDF();
    const lines = [
      `School: ${schoolProfile.schoolName}`,
      `School Code: ${schoolProfile.schoolCode}`,
      `Teacher Name: ${teacher.name}`,
      `Email: ${teacher.email || 'N/A'}`,
      `Phone: ${teacher.phone || 'N/A'}`,
      `Department: ${teacher.department || 'N/A'}`,
      `Sub-School: ${teacher.section || 'N/A'}`,
      `Gender: ${teacher.gender || 'Not Specified'}`,
      `Allocated Classes: ${(teacher.allocatedClasses || []).join(', ') || 'None'}`,
      `Allocated Subjects: ${(teacher.allocatedSubjects || []).join(', ') || 'None'}`,
      `Status: ${teacher.status || 'Active'}`
    ];

    doc.setFontSize(16);
    doc.text('Teacher Enrollment Profile', 14, 20);
    doc.setFontSize(11);
    lines.forEach((line, index) => doc.text(line, 14, 35 + index * 8));
    doc.save(`${(teacher.name || 'teacher').replace(/\s+/g, '-')}-teacher-profile.pdf`);
  };

  const enrollTeacherFromAdmin = () => {
    const safeName = teacherEnrollmentDraft.name.trim();
    if (!safeName) {
      alert('Please provide teacher full name.');
      return;
    }

    const teacherMatricule = `TCH-${safeName.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const fallbackEmail = `${safeName.toLowerCase().replace(/\s+/g, '.')}@eduignite.edu`;

    const newTeacher = {
      id: Date.now(),
      name: safeName,
      matricule: teacherMatricule,
      role: 'Teacher',
      email: teacherEnrollmentDraft.email.trim() || fallbackEmail,
      phone: teacherEnrollmentDraft.phone.trim(),
      department: teacherEnrollmentDraft.department,
      section: teacherEnrollmentDraft.section,
      gender: teacherEnrollmentDraft.gender,
      allocatedClasses: teacherEnrollmentDraft.allocatedClasses,
      allocatedSubjects: teacherEnrollmentDraft.allocatedSubjects,
      status: 'Active'
    };

    setUsers((prev) => [newTeacher, ...prev]);
    setTeacherEnrollmentDraft((prev) => ({
      ...prev,
      name: '',
      email: '',
      phone: '',
      allocatedClasses: [],
      allocatedSubjects: []
    }));
    setShowTeacherEnrollmentForm(false);
    setNotice(`Teacher enrolled successfully: ${newTeacher.name}`);
    downloadTeacherEnrollmentPdf(newTeacher);
  };

  const downloadStaffEnrollmentPdf = (staffItem) => {
    const doc = new jsPDF();
    const lines = [
      `School: ${schoolProfile.schoolName}`,
      `School Code: ${schoolProfile.schoolCode}`,
      `Staff Name: ${staffItem.name}`,
      `Email: ${staffItem.email || 'N/A'}`,
      `Phone: ${staffItem.phone || 'N/A'}`,
      `Department: ${staffItem.department || 'N/A'}`,
      `Sub-School: ${staffItem.section || 'N/A'}`,
      `Gender: ${staffItem.gender || 'Not Specified'}`,
      `Status: ${staffItem.status || 'Active'}`
    ];

    doc.setFontSize(16);
    doc.text('Staff Enrollment Profile', 14, 20);
    doc.setFontSize(11);
    lines.forEach((line, index) => doc.text(line, 14, 35 + index * 8));
    doc.save(`${(staffItem.name || 'staff').replace(/\s+/g, '-')}-staff-profile.pdf`);
  };

  const enrollStaffFromAdmin = () => {
    const safeName = staffEnrollmentDraft.name.trim();
    if (!safeName) {
      alert('Please provide staff full name.');
      return;
    }

    const staffMatricule = `STF-${safeName.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const fallbackEmail = `${safeName.toLowerCase().replace(/\s+/g, '.')}@eduignite.edu`;

    const newStaff = {
      id: Date.now(),
      name: safeName,
      matricule: staffMatricule,
      role: 'Staff',
      email: staffEnrollmentDraft.email.trim() || fallbackEmail,
      phone: staffEnrollmentDraft.phone.trim(),
      department: staffEnrollmentDraft.department,
      section: staffEnrollmentDraft.section,
      gender: staffEnrollmentDraft.gender,
      status: 'Active'
    };

    setUsers((prev) => [newStaff, ...prev]);
    setStaffEnrollmentDraft((prev) => ({
      ...prev,
      name: '',
      email: '',
      phone: ''
    }));
    setShowStaffEnrollmentForm(false);
    setNotice(`Staff enrolled successfully: ${newStaff.name}`);
    downloadStaffEnrollmentPdf(newStaff);
  };

  const openStudentEdit = (student) => {
    setEditingStudentId(student.id);
    setStudentEditDraft({
      name: student.name || '',
      className: student.className || enrollmentClassOptions[0] || '',
      section: student.section || sectionOptions[0] || '',
      gender: student.gender || 'Not Specified',
      parent: student.parent || '',
      attendance: Number(student.attendance || 0),
      resultAverage: Number(student.resultAverage || 0),
      feeStatus: student.feeStatus || 'Pending',
      platformFeePaid: Boolean(student.platformFeePaid),
      status: student.status || 'Active'
    });
  };

  const saveStudentEdit = () => {
    if (!editingStudentId) {
      return;
    }

    let updatedStudent = null;

    setStudents((prev) => prev.map((item) => {
      if (item.id !== editingStudentId) {
        return item;
      }

      updatedStudent = {
        ...item,
        ...studentEditDraft,
        attendance: Math.max(0, Math.min(100, Number(studentEditDraft.attendance) || 0)),
        resultAverage: Math.max(0, Math.min(20, Number(studentEditDraft.resultAverage) || 0))
      };

      return updatedStudent;
    }));

    if (updatedStudent?.matricule) {
      updateStudentEnrollmentByMatricule(updatedStudent.matricule, {
        name: updatedStudent.name,
        className: updatedStudent.className,
        subSchool: updatedStudent.section,
        parent: updatedStudent.parent,
        gender: updatedStudent.gender,
        platformFeePaid: updatedStudent.platformFeePaid
      });
    }

    setEditingStudentId(null);
    setNotice('Student information updated successfully.');
  };

  const cancelStudentEdit = () => {
    setEditingStudentId(null);
  };

  const openTeacherEdit = (teacher) => {
    setEditingTeacherId(teacher.id);
    setTeacherEditDraft({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      department: teacher.department || departments[0]?.name || 'Sciences',
      section: teacher.section || sectionOptions[0] || '',
      gender: teacher.gender || 'Not Specified',
      allocatedClasses: teacher.allocatedClasses || [],
      allocatedSubjects: teacher.allocatedSubjects || [],
      status: teacher.status || 'Active'
    });
  };

  const saveTeacherEdit = () => {
    if (!editingTeacherId) {
      return;
    }

    setUsers((prev) => prev.map((item) => {
      if (item.id !== editingTeacherId) {
        return item;
      }

      return {
        ...item,
        ...teacherEditDraft
      };
    }));

    setEditingTeacherId(null);
    setNotice('Teacher information updated successfully.');
  };

  const cancelTeacherEdit = () => {
    setEditingTeacherId(null);
  };

  const enrollClassFromAdmin = () => {
    const safeName = classRegistrationDraft.name.trim();
    const safeBlockName = classRegistrationDraft.blockName.trim();
    const safeRoomNumber = classRegistrationDraft.roomNumber.trim();

    if (!safeName || !safeBlockName || !safeRoomNumber) {
      alert('Please provide class name, block name and room number.');
      return;
    }

    const alreadyExists = classes.some(
      (item) => item.name.toLowerCase() === safeName.toLowerCase()
        && (item.section || 'Unassigned') === classRegistrationDraft.section
    );

    if (alreadyExists) {
      alert('A class with this name already exists in the selected sub-school.');
      return;
    }

    const newClass = {
      id: Date.now(),
      name: safeName,
      section: classRegistrationDraft.section,
      blockName: safeBlockName,
      roomNumber: safeRoomNumber,
      capacity: Math.max(1, Number(classRegistrationDraft.capacity) || 1),
      status: classRegistrationDraft.status
    };

    setClasses((prev) => [newClass, ...prev]);
    setClassRegistrationDraft((prev) => ({
      ...prev,
      name: '',
      blockName: '',
      roomNumber: '',
      capacity: 40
    }));
    setShowClassRegistrationForm(false);
    setNotice(`Class ${newClass.name} registered successfully in ${newClass.section}.`);
  };

  const openClassEdit = (classItem) => {
    setEditingClassId(classItem.id);
    setClassEditDraft({
      name: classItem.name || '',
      section: classItem.section || sectionOptions[0] || 'English School',
      blockName: classItem.blockName || '',
      roomNumber: classItem.roomNumber || '',
      capacity: Number(classItem.capacity || 40),
      status: classItem.status || 'Active'
    });
  };

  const saveClassEdit = () => {
    if (!editingClassId) {
      return;
    }

    const safeName = classEditDraft.name.trim();
    const safeBlockName = classEditDraft.blockName.trim();
    const safeRoomNumber = classEditDraft.roomNumber.trim();
    if (!safeName || !safeBlockName || !safeRoomNumber) {
      alert('Class name, block name and room number are required.');
      return;
    }

    setClasses((prev) => prev.map((item) => {
      if (item.id !== editingClassId) {
        return item;
      }
      return {
        ...item,
        ...classEditDraft,
        name: safeName,
        blockName: safeBlockName,
        roomNumber: safeRoomNumber,
        capacity: Math.max(1, Number(classEditDraft.capacity) || 1)
      };
    }));

    setEditingClassId(null);
    setNotice('Class information updated successfully.');
  };

  const cancelClassEdit = () => {
    setEditingClassId(null);
  };

  const removeClass = (id) => {
    setClasses((prev) => prev.filter((item) => item.id !== id));
    setNotice('Class removed from registry.');
  };

  const toggleClassStatus = (id) => {
    setClasses((prev) => prev.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return {
        ...item,
        status: (item.status || 'Active') === 'Active' ? 'Inactive' : 'Active'
      };
    }));
    setNotice('Class status updated successfully.');
  };

  const enrollSubjectFromAdmin = () => {
    const safeName = subjectRegistrationDraft.name.trim();

    if (!safeName || !subjectRegistrationDraft.className || !subjectRegistrationDraft.section) {
      alert('Please provide subject name, class and sub-school.');
      return;
    }

    const duplicate = subjects.some((item) => (
      item.name.toLowerCase() === safeName.toLowerCase()
      && item.className === subjectRegistrationDraft.className
      && (item.section || 'Unassigned') === subjectRegistrationDraft.section
    ));

    if (duplicate) {
      alert('This subject is already registered for the selected class and sub-school.');
      return;
    }

    const newSubject = {
      id: Date.now(),
      name: safeName,
      department: subjectRegistrationDraft.department,
      className: subjectRegistrationDraft.className,
      section: subjectRegistrationDraft.section,
      weeklyPeriods: Math.max(1, Number(subjectRegistrationDraft.weeklyPeriods) || 1),
      teacher: subjectRegistrationDraft.teacher,
      status: subjectRegistrationDraft.status
    };

    setSubjects((prev) => [newSubject, ...prev]);
    setSubjectRegistrationDraft((prev) => ({
      ...prev,
      name: '',
      className: subjectClassOptions[0] || '',
      weeklyPeriods: 5,
      teacher: 'Unassigned'
    }));
    setShowSubjectRegistrationForm(false);
    setNotice(`Subject ${newSubject.name} registered for ${newSubject.className} (${newSubject.section}).`);
  };

  const openSubjectEdit = (subjectItem) => {
    setEditingSubjectId(subjectItem.id);
    setSubjectEditDraft({
      name: subjectItem.name || '',
      department: subjectItem.department || departments[0]?.name || 'Sciences',
      className: subjectItem.className || subjectClassOptions[0] || '',
      section: subjectItem.section || sectionOptions[0] || '',
      weeklyPeriods: Number(subjectItem.weeklyPeriods || 1),
      teacher: subjectItem.teacher || 'Unassigned',
      status: subjectItem.status || 'Active'
    });
  };

  const saveSubjectEdit = () => {
    if (!editingSubjectId) {
      return;
    }

    const safeName = subjectEditDraft.name.trim();
    if (!safeName || !subjectEditDraft.className || !subjectEditDraft.section) {
      alert('Subject name, class and sub-school are required.');
      return;
    }

    setSubjects((prev) => prev.map((item) => {
      if (item.id !== editingSubjectId) {
        return item;
      }
      return {
        ...item,
        ...subjectEditDraft,
        name: safeName,
        weeklyPeriods: Math.max(1, Number(subjectEditDraft.weeklyPeriods) || 1)
      };
    }));

    setEditingSubjectId(null);
    setNotice('Subject information updated successfully.');
  };

  const cancelSubjectEdit = () => {
    setEditingSubjectId(null);
  };

  const resetSubjectFilters = () => {
    setSubjectSearchTerm('');
    setSubjectClassFilter('All');
    setSubjectClassSlotFilter('All');
    setSubjectSectionFilter('All');
    setSubjectDepartmentFilter('All');
    setSubjectStatusFilter('All');
  };

  const resetAttendanceFilters = () => {
    setAttendanceSearchTerm('');
    setAttendanceRoleFilter('All');
    setAttendanceSectionFilter('All');
    setAttendanceBandFilter('All');
    setAttendanceSortBy('Highest');
  };

  const removeSubject = (id) => {
    setSubjects((prev) => prev.filter((item) => item.id !== id));
    setNotice('Subject removed from registry.');
  };

  const toggleSubjectStatus = (id) => {
    setSubjects((prev) => prev.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return {
        ...item,
        status: (item.status || 'Active') === 'Active' ? 'Inactive' : 'Active'
      };
    }));
    setNotice('Subject status updated successfully.');
  };

  const resetExamFilters = () => {
    setExamSearchTerm('');
    setExamClassFilter('All');
    setExamTermFilter('All');
    setExamSequenceFilter('All');
    setExamStatusFilter('All');
  };

  const scheduleExamFromAdmin = () => {
    const safeTitle = examDraft.title.trim();
    const safeSubject = examDraft.subject.trim();

    if (!safeTitle || !examDraft.className || !safeSubject || !examDraft.term || !examDraft.sequence || !examDraft.startDate || !examDraft.latestDate) {
      alert('Please complete title, class, subject, term, sequence, start date and latest date.');
      return;
    }

    if (String(examDraft.latestDate) < String(examDraft.startDate)) {
      alert('Latest date cannot be earlier than start date.');
      return;
    }

    const duplicate = exams.some((item) => (
      item.title.toLowerCase() === safeTitle.toLowerCase()
      && item.className === examDraft.className
      && item.term === examDraft.term
      && item.sequence === examDraft.sequence
    ));

    if (duplicate) {
      alert('This exam is already scheduled for the selected class, term and sequence.');
      return;
    }

    const newExam = {
      id: Date.now(),
      title: safeTitle,
      className: examDraft.className,
      subject: safeSubject,
      term: examDraft.term,
      sequence: examDraft.sequence,
      startDate: examDraft.startDate,
      latestDate: examDraft.latestDate,
      status: 'Scheduled',
      publishedAt: ''
    };

    setExams((prev) => [newExam, ...prev]);
    setExamDraft((prev) => ({
      ...prev,
      title: '',
      subject: '',
      startDate: '',
      latestDate: ''
    }));
    setShowExamForm(false);
    setNotice(`Exam scheduled for ${newExam.term} ${newExam.sequence}.`);
  };

  const publishExamById = (id) => {
    let publishedExamTitle = '';
    setExams((prev) => prev.map((item) => {
      if (item.id !== id) {
        return item;
      }
      publishedExamTitle = item.title;
      return {
        ...item,
        status: 'Published',
        publishedAt: new Date().toISOString().slice(0, 10)
      };
    }));

    if (publishedExamTitle) {
      setNotice(`Exam published: ${publishedExamTitle}.`);
    }
  };

  const closeExamById = (id) => {
    setExams((prev) => prev.map((item) => (
      item.id === id ? { ...item, status: 'Closed' } : item
    )));
    setNotice('Exam closed successfully.');
  };

  const enrollDepartmentFromAdmin = () => {
    const safeName = departmentDraft.name.trim();
    const safeOffice = departmentDraft.office.trim();

    if (!safeName || !departmentDraft.section) {
      alert('Please provide department name and sub-school.');
      return;
    }

    const duplicate = departments.some((item) => (
      item.name.toLowerCase() === safeName.toLowerCase()
      && (item.section || 'Unassigned') === departmentDraft.section
    ));

    if (duplicate) {
      alert('A department with this name already exists in the selected sub-school.');
      return;
    }

    const newDepartment = {
      id: Date.now(),
      name: safeName,
      head: departmentDraft.head,
      section: departmentDraft.section,
      office: safeOffice,
      status: departmentDraft.status
    };

    setDepartments((prev) => [newDepartment, ...prev]);
    setDepartmentDraft((prev) => ({
      ...prev,
      name: '',
      office: '',
      head: 'Unassigned'
    }));
    setShowDepartmentForm(false);
    setNotice(`Department ${newDepartment.name} registered for ${newDepartment.section}.`);
  };

  const openDepartmentEdit = (departmentItem) => {
    setEditingDepartmentId(departmentItem.id);
    setDepartmentEditDraft({
      name: departmentItem.name || '',
      head: departmentItem.head || 'Unassigned',
      section: departmentItem.section || sectionOptions[0] || 'English School',
      office: departmentItem.office || '',
      status: departmentItem.status || 'Active'
    });
  };

  const saveDepartmentEdit = () => {
    if (!editingDepartmentId) {
      return;
    }

    const existing = departments.find((item) => item.id === editingDepartmentId);
    if (!existing) {
      setEditingDepartmentId(null);
      return;
    }

    const safeName = departmentEditDraft.name.trim();
    if (!safeName || !departmentEditDraft.section) {
      alert('Department name and sub-school are required.');
      return;
    }

    const oldName = existing.name;
    const renamed = oldName !== safeName;

    setDepartments((prev) => prev.map((item) => {
      if (item.id !== editingDepartmentId) {
        return item;
      }
      return {
        ...item,
        ...departmentEditDraft,
        name: safeName,
        office: departmentEditDraft.office.trim()
      };
    }));

    if (renamed) {
      setUsers((prev) => prev.map((item) => (
        item.department === oldName ? { ...item, department: safeName } : item
      )));
      setSubjects((prev) => prev.map((item) => (
        item.department === oldName ? { ...item, department: safeName } : item
      )));
    }

    setEditingDepartmentId(null);
    setNotice('Department information updated successfully.');
  };

  const cancelDepartmentEdit = () => {
    setEditingDepartmentId(null);
  };

  const removeDepartment = (id) => {
    const departmentItem = departments.find((item) => item.id === id);
    if (!departmentItem) {
      return;
    }

    const fallbackDepartment = departments.find((item) => item.id !== id)?.name || 'Administration';

    setDepartments((prev) => prev.filter((item) => item.id !== id));
    setUsers((prev) => prev.map((item) => (
      item.department === departmentItem.name ? { ...item, department: fallbackDepartment } : item
    )));
    setSubjects((prev) => prev.map((item) => (
      item.department === departmentItem.name ? { ...item, department: fallbackDepartment } : item
    )));
    setNotice(`Department removed. Linked records moved to ${fallbackDepartment}.`);
  };

  const toggleDepartmentStatus = (id) => {
    setDepartments((prev) => prev.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return {
        ...item,
        status: (item.status || 'Active') === 'Active' ? 'Inactive' : 'Active'
      };
    }));
    setNotice('Department status updated successfully.');
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

  const addEvent = () => {
    const title = newEvent.title.trim();
    const date = String(newEvent.date || '').trim();

    if (!title || !date) {
      alert('Please enter event title and date.');
      return;
    }

    const eventItem = {
      id: Date.now(),
      title,
      date,
      category: newEvent.category,
      organizer: newEvent.organizer
    };

    setEvents((prev) => [eventItem, ...prev]);
    setPaginationState((prev) => ({ ...prev, events: 1 }));
    setNewEvent({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      category: 'Academic',
      organizer: 'Administration'
    });
    setNotice('Event added to school calendar successfully.');
  };

  const addTransportRoute = () => {
    const route = String(transportDraft.route || '').trim();
    const busNo = String(transportDraft.busNo || '').trim();
    const driver = String(transportDraft.driver || '').trim();
    const seats = Number(transportDraft.seats || 0);
    const occupied = Number(transportDraft.occupied || 0);

    if (!route || !busNo || !driver) {
      alert('Please provide route, bus number, and driver name.');
      return;
    }

    if (!Number.isFinite(seats) || seats <= 0) {
      alert('Seats must be greater than zero.');
      return;
    }

    if (!Number.isFinite(occupied) || occupied < 0 || occupied > seats) {
      alert('Occupied seats must be between 0 and total seats.');
      return;
    }

    const status = occupied >= seats ? 'Full' : transportDraft.status;
    const routeItem = {
      id: Date.now(),
      route,
      busNo,
      driver,
      seats,
      occupied,
      status
    };

    setTransportRoutes((prev) => [routeItem, ...prev]);
    setPaginationState((prev) => ({ ...prev, transport: 1 }));
    setTransportDraft({
      route: '',
      busNo: '',
      driver: '',
      seats: 40,
      occupied: 0,
      status: 'On Schedule'
    });
    setNotice('Transport route added successfully.');
  };

  const updateTransportOccupancy = (id, change) => {
    setTransportRoutes((prev) => prev.map((item) => {
      if (item.id !== id) {
        return item;
      }

      const seats = Number(item.seats || 0);
      const nextOccupied = Math.min(seats, Math.max(0, Number(item.occupied || 0) + Number(change || 0)));
      return {
        ...item,
        occupied: nextOccupied,
        status: nextOccupied >= seats ? 'Full' : item.status === 'Full' ? 'On Schedule' : item.status
      };
    }));
    setNotice('Transport occupancy updated.');
  };

  const updateTransportStatus = (id, status) => {
    setTransportRoutes((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    setNotice('Transport route status updated.');
  };

  const removeTransportRoute = (id) => {
    setTransportRoutes((prev) => prev.filter((item) => item.id !== id));
    setNotice('Transport route removed.');
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

  const updateReportForm = (formKey, field, value) => {
    setReportForms((prev) => ({
      ...prev,
      [formKey]: {
        ...prev[formKey],
        [field]: value
      }
    }));
  };

  const logGeneratedReport = (report, format, scope) => {
    setGeneratedReports((prev) => ([
      {
        id: Date.now(),
        report,
        format,
        scope,
        academicYear: reportAcademicYearFilter,
        generatedAt: new Date().toISOString().slice(0, 10)
      },
      ...prev
    ].slice(0, 10)));
  };

  const exportReportsPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);
    const green = [15, 118, 110];
    const blue = [29, 78, 216];
    const generatedAt = new Date().toISOString().slice(0, 10);

    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(margin, 12, contentWidth, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${schoolProfile.schoolName} - EXECUTIVE SUMMARY REPORT`, pageWidth / 2, 21, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(`Academic Session: ${reportAcademicYearFilter}`, margin, 34);
    doc.text(`Term: ${schoolProfile.currentTerm}`, margin + 74, 34);
    doc.text(`Period: ${reportForms.executive.period}`, margin, 40);
    doc.text(`Generated: ${generatedAt}`, margin + 124, 40);

    const cardsY = 46;
    const cardGap = 3;
    const cardWidth = (contentWidth - (cardGap * 3)) / 4;
    const cardHeight = 18;
    const cards = [
      { label: 'Attendance Rate', value: `${yearScopedReportData.attendanceRate}%`, fill: [240, 249, 255] },
      { label: 'Result Average', value: `${yearScopedReportData.resultAverage}/20`, fill: [236, 253, 245] },
      { label: 'Total Billed', value: formatCurrency(yearScopedReportData.billed), fill: [239, 246, 255] },
      { label: 'Outstanding', value: formatCurrency(yearScopedReportData.outstanding), fill: [254, 242, 242] }
    ];

    cards.forEach((card, index) => {
      const x = margin + ((cardWidth + cardGap) * index);
      doc.setDrawColor(209, 213, 219);
      doc.setFillColor(card.fill[0], card.fill[1], card.fill[2]);
      doc.rect(x, cardsY, cardWidth, cardHeight, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(card.label, x + 3, cardsY + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(String(card.value), x + 3, cardsY + 13);
    });

    let y = 70;
    doc.setFillColor(blue[0], blue[1], blue[2]);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('USERS BY ROLE', margin + 3, y + 5.5);
    y += 10;

    const userRows = Object.entries(yearScopedReportData.usersByRole).map(([role, count]) => ({ role, count }));
    const userHeaders = ['Role', 'Users'];
    const userCols = [110, 50];
    const rowHeight = 7;
    const tableWidth = userCols.reduce((sum, width) => sum + width, 0);

    doc.setFillColor(31, 41, 55);
    doc.rect(margin, y, tableWidth, rowHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let x = margin;
    userHeaders.forEach((header, index) => {
      doc.text(header, x + 2, y + 4.8);
      x += userCols[index];
    });
    y += rowHeight;

    userRows.forEach((item, index) => {
      const fill = index % 2 === 0 ? 248 : 255;
      doc.setFillColor(fill, fill, fill);
      doc.setDrawColor(220, 224, 230);
      doc.rect(margin, y, tableWidth, rowHeight, 'FD');
      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.role), margin + 2, y + 4.8);
      doc.text(String(item.count), margin + userCols[0] + 2, y + 4.8);
      y += rowHeight;
    });

    y += 6;
    doc.setFillColor(blue[0], blue[1], blue[2]);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('FINANCIAL SNAPSHOT', margin + 3, y + 5.5);
    y += 11;

    const financeSnapshot = [
      `Total Billed: ${formatCurrency(yearScopedReportData.billed)}`,
      `Collections: ${formatCurrency(yearScopedReportData.collections)}`,
      `Outstanding Balance: ${formatCurrency(yearScopedReportData.outstanding)}`,
      `Collection Rate: ${yearScopedReportData.billed ? Math.round((yearScopedReportData.collections / yearScopedReportData.billed) * 100) : 0}%`
    ];

    doc.setDrawColor(209, 213, 219);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 30, 'FD');
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    financeSnapshot.forEach((line, index) => {
      doc.text(line, margin + 4, y + 6 + (index * 6));
    });

    doc.setFontSize(8.5);
    doc.setTextColor(71, 84, 103);
    doc.text(`Generated by ${profileForEdit.name} on ${generatedAt}`, pageWidth / 2, 286, { align: 'center' });
    doc.save('admin-executive-summary.pdf');
  };

  const exportFinanceReportPdf = () => {
    const filteredInvoices = yearScopedFinanceInvoices.filter((item) => {
      const statusMatch = reportForms.finance.status === 'All' || item.status === reportForms.finance.status;
      const overdueMatch = !reportForms.finance.includeOverdueOnly
        || (item.status !== 'Paid' && String(item.dueDate || '') < new Date().toISOString().slice(0, 10));
      return statusMatch && overdueMatch;
    });

    if (!filteredInvoices.length) {
      alert('No finance rows found for the selected filters.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);
    const green = [15, 118, 110];
    const blue = [29, 78, 216];
    const generatedAt = new Date().toISOString().slice(0, 10);

    const totalAmount = filteredInvoices.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paidCount = filteredInvoices.filter((item) => item.status === 'Paid').length;
    const unpaidCount = filteredInvoices.length - paidCount;
    const overdueCount = filteredInvoices.filter((item) => item.status !== 'Paid' && String(item.dueDate || '') < generatedAt).length;

    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(margin, 12, contentWidth, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`${schoolProfile.schoolName} - FINANCE RECONCILIATION REPORT`, pageWidth / 2, 21, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(`Academic Session: ${reportAcademicYearFilter}`, margin, 34);
    doc.text(`Term: ${schoolProfile.currentTerm}`, margin + 74, 34);
    doc.text(`Status Filter: ${reportForms.finance.status}`, margin, 40);
    doc.text(`Scope: ${reportForms.finance.includeOverdueOnly ? 'Overdue Only' : 'All Matched Invoices'}`, margin + 74, 40);
    doc.text(`Generated: ${generatedAt}`, margin + 148, 40);

    const cardsY = 46;
    const cardGap = 3;
    const cardWidth = (contentWidth - (cardGap * 3)) / 4;
    const cardHeight = 18;
    const cards = [
      { label: 'Invoices', value: String(filteredInvoices.length), fill: [240, 249, 255] },
      { label: 'Total Amount', value: formatCurrency(totalAmount), fill: [236, 253, 245] },
      { label: 'Paid / Unpaid', value: `${paidCount} / ${unpaidCount}`, fill: [239, 246, 255] },
      { label: 'Overdue', value: String(overdueCount), fill: [254, 242, 242] }
    ];

    cards.forEach((card, index) => {
      const x = margin + ((cardWidth + cardGap) * index);
      doc.setDrawColor(209, 213, 219);
      doc.setFillColor(card.fill[0], card.fill[1], card.fill[2]);
      doc.rect(x, cardsY, cardWidth, cardHeight, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.2);
      doc.text(card.label, x + 3, cardsY + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(String(card.value), x + 3, cardsY + 13);
    });

    let y = 70;
    doc.setFillColor(blue[0], blue[1], blue[2]);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('INVOICE RECONCILIATION DETAILS', margin + 3, y + 5.5);
    y += 10;

    const headers = ['Invoice', 'Student', 'Class', 'Amount', 'Due Date', 'Status'];
    const cols = [26, 44, 28, 26, 28, 24];
    const tableWidth = cols.reduce((sum, width) => sum + width, 0);
    const rowHeight = 7;

    const drawTableHeader = () => {
      doc.setFillColor(31, 41, 55);
      doc.rect(margin, y, tableWidth, rowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      let x = margin;
      headers.forEach((header, index) => {
        doc.text(header, x + 1.5, y + 4.6);
        x += cols[index];
      });
      y += rowHeight;
    };

    drawTableHeader();

    filteredInvoices.forEach((item, index) => {
      if (y > pageHeight - 18) {
        doc.addPage();
        y = 16;
        drawTableHeader();
      }

      const fill = index % 2 === 0 ? 248 : 255;
      doc.setFillColor(fill, fill, fill);
      doc.setDrawColor(220, 224, 230);
      doc.rect(margin, y, tableWidth, rowHeight, 'FD');
      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.4);

      const rowValues = [
        String(item.invoiceNo || '-').slice(0, 14),
        String(item.student || '-').slice(0, 24),
        String(item.className || '-').slice(0, 14),
        formatCurrency(item.amount),
        String(item.dueDate || '-'),
        String(item.status || '-')
      ];

      let x = margin;
      rowValues.forEach((value, valueIndex) => {
        doc.text(value, x + 1.5, y + 4.7);
        x += cols[valueIndex];
      });

      y += rowHeight;
    });

    doc.setFontSize(8.5);
    doc.setTextColor(71, 84, 103);
    doc.text(`Generated by ${profileForEdit.name} on ${generatedAt}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.save('admin-finance-reconciliation.pdf');
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

  const renderStudentReportCardPage = (doc, studentRow) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 8;
    const cardWidth = pageWidth - (margin * 2);
    const classKey = buildClassKey(studentRow.className, studentRow.section);
    const classStats = classPerformanceStats.find((item) => item.classKey === classKey);
    const classRows = rankedStudentPerformanceRows
      .filter((item) => item.className === studentRow.className && item.section === studentRow.section)
      .sort((left, right) => left.rank - right.rank);

    const subjectRows = (studentResultDetailsByName[studentRow.name] || [
      {
        subject: 'Overall Average',
        score: studentRow.average,
        grade: studentRow.grade
      }
    ]).map((item) => {
      const classSubjectKey = `${studentRow.className}__${studentRow.section}__${item.subject}`.toLowerCase();
      const allSectionSubjectKey = `${studentRow.className}__all__${item.subject}`.toLowerCase();
      const globalSubjectKey = `all__all__${item.subject}`.toLowerCase();
      const coefficient = Number(
        subjectCoefficientLookup[classSubjectKey]
        || subjectCoefficientLookup[allSectionSubjectKey]
        || subjectCoefficientLookup[globalSubjectKey]
        || 1
      );

      const classSubjectScores = classRows
        .map((row) => {
          const detail = (studentResultDetailsByName[row.name] || []).find((entry) => entry.subject === item.subject);
          return detail ? Number(detail.score || 0) : null;
        })
        .filter((score) => score !== null);

      const classAverage = classSubjectScores.length
        ? Number((classSubjectScores.reduce((sum, score) => sum + score, 0) / classSubjectScores.length).toFixed(1))
        : 0;

      const subjectRank = classSubjectScores.length
        ? 1 + classSubjectScores.filter((score) => score > Number(item.score || 0)).length
        : 1;

      return {
        subject: item.subject || 'General Assessment',
        score: Number(item.score || 0),
        grade: item.grade || getGradeFromAverage(item.score),
        coefficient,
        weighted: Number((Number(item.score || 0) * coefficient).toFixed(1)),
        classAverage,
        subjectRank
      };
    });

    const totalWeighted = subjectRows.reduce((sum, item) => sum + item.weighted, 0);
    const totalCoefficient = subjectRows.reduce((sum, item) => sum + item.coefficient, 0);
    const weightedAverage = totalCoefficient ? Number((totalWeighted / totalCoefficient).toFixed(1)) : Number(studentRow.average || 0);
    const classRankLabel = `${getOrdinalRank(studentRow.rank)} / ${studentRow.classSize}`;

    const conduct = weightedAverage >= 14 ? 'Very Good' : weightedAverage >= 11 ? 'Good' : weightedAverage >= 10 ? 'Fair' : 'Needs Support';
    const punctuality = Number(studentRow.attendance || 0) >= 92 ? 'Very Good' : Number(studentRow.attendance || 0) >= 85 ? 'Good' : 'Needs Support';
    const decision = weightedAverage >= 10 ? 'PROMOTED' : 'REPEAT';
    const classMasterRemark = weightedAverage >= 14
      ? 'Hardworking and disciplined.'
      : weightedAverage >= 10
        ? 'Steady progress; keep improving.'
        : 'Needs closer academic support.';
    const principalRemark = weightedAverage >= 14
      ? 'Strong performance. Keep it up.'
      : weightedAverage >= 10
        ? 'Satisfactory performance.'
        : 'Immediate intervention recommended.';

    const green = [0, 101, 68];
    const yellow = [232, 194, 68];
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setDrawColor(190, 190, 190);
    doc.rect(margin, margin, cardWidth, pageHeight - (margin * 2));

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('REPUBLIC OF CAMEROON', pageWidth / 2, 16, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Peace - Work - Fatherland', pageWidth / 2, 22, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(green[0], green[1], green[2]);
    doc.setFontSize(12);
    doc.text('MINISTRY OF SECONDARY EDUCATION', pageWidth / 2, 28, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(String(schoolProfile.schoolName || 'GOVERNMENT BILINGUAL HIGH SCHOOL').toUpperCase(), pageWidth / 2, 35, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(String(schoolProfile.location || 'Douala - Cameroon'), pageWidth / 2, 40, { align: 'center' });

    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(14, 45, pageWidth - 28, 11, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('BULLETIN DE NOTES / REPORT CARD', pageWidth / 2, 52, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    doc.setFillColor(250, 250, 250);
    doc.rect(14, 57, pageWidth - 28, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Academic Year: ${schoolProfile.currentSession}`, 18, 63);
    doc.setFillColor(yellow[0], yellow[1], yellow[2]);
    doc.rect(pageWidth - 94, 58.5, 22, 6.5, 'F');
    doc.text(String(schoolProfile.currentTerm || 'First Term'), pageWidth - 83, 63, { align: 'center' });

    const infoLeftX = 14;
    const infoRightX = pageWidth - 62;
    const infoWidth = infoRightX - infoLeftX;
    const infoMidX = infoLeftX + (infoWidth / 2);

    const photoPanelX = pageWidth - 58;
    const photoPanelY = 68;
    const photoPanelWidth = 44;
    const photoPanelHeight = 47;
    doc.setDrawColor(180, 180, 180);
    doc.rect(photoPanelX, photoPanelY, photoPanelWidth, photoPanelHeight);
    doc.setFillColor(245, 247, 250);
    doc.rect(photoPanelX + 1, photoPanelY + 1, photoPanelWidth - 2, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT PHOTO', photoPanelX + (photoPanelWidth / 2), photoPanelY + 6.2, { align: 'center' });
    doc.setDrawColor(220, 220, 220);
    doc.rect(photoPanelX + 4, photoPanelY + 11, photoPanelWidth - 8, photoPanelHeight - 15);

    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(infoLeftX, 68, infoWidth, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('STUDENT INFORMATION', infoLeftX + (infoWidth / 2), 74, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    doc.setDrawColor(190, 190, 190);
    doc.rect(infoLeftX, 77, infoWidth, 38);
    doc.line(infoMidX, 77, infoMidX, 115);
    doc.line(infoLeftX, 86.5, infoRightX, 86.5);
    doc.line(infoLeftX, 96, infoRightX, 96);
    doc.line(infoLeftX, 105.5, infoRightX, 105.5);

    const leftX = 16;
    const rightX = infoMidX + 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`Name: ${studentRow.name}`, leftX, 83);
    doc.text(`Matricule: ${studentRow.matricule}`, rightX, 83);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sex: ${studentRow.gender}`, leftX, 92.5);
    doc.text(`Class: ${studentRow.className}`, rightX, 92.5);
    doc.text(`Date of Birth: ${studentRow.dateOfBirth || '-'}`, leftX, 102);
    doc.text(`Sub-School: ${studentRow.section}`, rightX, 102);
    doc.setFont('helvetica', 'bold');
    doc.text(`Class Master: ${studentRow.classTeacher}`, leftX, 111.5);
    doc.text(`Enrollment: ${studentRow.classSize} Students`, rightX, 111.5);

    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(14, 118, pageWidth - 28, 8.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('SUBJECTS & RESULTS', pageWidth / 2, 123.8, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    const tableX = 14;
    const tableY = 126.5;
    const rowHeight = 7;
    const columns = [10, 46, 20, 15, 25, 19, 18];
    const tableWidth = columns.reduce((sum, width) => sum + width, 0);

    doc.setFillColor(229, 234, 229);
    doc.rect(tableX, tableY, tableWidth, rowHeight, 'F');
    doc.setDrawColor(180, 180, 180);
    doc.rect(tableX, tableY, tableWidth, rowHeight);

    const headers = ['#', 'Subject', 'Mark /20', 'Coef', 'Mark x Coef', 'Rank', 'Class Avg'];
    let currentX = tableX;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    headers.forEach((header, index) => {
      doc.text(header, currentX + (columns[index] / 2), tableY + 4.8, { align: 'center' });
      currentX += columns[index];
      if (index < columns.length - 1) {
        doc.line(currentX, tableY, currentX, tableY + rowHeight + (subjectRows.length + 1) * rowHeight);
      }
    });

    let rowY = tableY + rowHeight;
    subjectRows.slice(0, 12).forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(tableX, rowY, tableWidth, rowHeight, 'F');
      }

      doc.rect(tableX, rowY, tableWidth, rowHeight);
      let x = tableX;
      const values = [
        String(index + 1),
        String(item.subject),
        Number(item.score).toFixed(1),
        String(item.coefficient),
        Number(item.weighted).toFixed(1),
        getOrdinalRank(item.subjectRank),
        Number(item.classAverage).toFixed(1)
      ];

      values.forEach((value, valueIndex) => {
        const align = valueIndex === 1 ? 'left' : 'center';
        const textX = align === 'left' ? x + 2 : x + (columns[valueIndex] / 2);
        doc.setFont('helvetica', valueIndex === 4 ? 'bold' : 'normal');
        if (valueIndex === 4) {
          doc.setTextColor(180, 28, 28);
        } else {
          doc.setTextColor(0, 0, 0);
        }
        doc.text(value, textX, rowY + 4.8, { align });
        x += columns[valueIndex];
      });

      rowY += rowHeight;
    });

    doc.setFillColor(245, 236, 203);
    doc.rect(tableX, rowY, tableWidth, rowHeight, 'F');
    doc.rect(tableX, rowY, tableWidth, rowHeight);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TOTAL', tableX + (columns[0] + columns[1]) / 2, rowY + 4.8, { align: 'center' });
    doc.setTextColor(green[0], green[1], green[2]);
    doc.text(String(totalCoefficient), tableX + columns[0] + columns[1] + columns[2] + (columns[3] / 2), rowY + 4.8, { align: 'center' });
    doc.setTextColor(160, 30, 30);
    doc.text(Number(totalWeighted).toFixed(1), tableX + columns[0] + columns[1] + columns[2] + columns[3] + (columns[4] / 2), rowY + 4.8, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    const panelY = rowY + 10;
    const summaryWidth = 90;
    const conductWidth = 84;

    doc.setDrawColor(185, 185, 185);
    doc.rect(14, panelY, summaryWidth, 38);
    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(14, panelY, summaryWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('SUMMARY', 14 + (summaryWidth / 2), panelY + 5.6, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10.5);
    doc.text(`Total (Mark x Coef): ${Number(totalWeighted).toFixed(1)}`, 17, panelY + 15);
    doc.text(`Average: ${Number(weightedAverage).toFixed(1)} / 20`, 17, panelY + 22);
    doc.text(`Class Rank: ${classRankLabel}`, 17, panelY + 29);
    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(56, panelY + 31.5, 43, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(decision, 77.5, panelY + 35.8, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.rect(112, panelY, conductWidth, 38);
    doc.setFillColor(yellow[0], yellow[1], yellow[2]);
    doc.rect(112, panelY, conductWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('CONDUCT & ATTENDANCE', 112 + (conductWidth / 2), panelY + 5.6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Conduct: ${conduct}`, 116, panelY + 15);
    doc.text(`Attendance: ${studentRow.attendance}%`, 116, panelY + 22);
    doc.text(`Punctuality: ${punctuality}`, 116, panelY + 29);
    doc.text(`Class Pass Rate: ${classStats?.passRate ?? 0}%`, 116, panelY + 36);

    const remarksY = panelY + 43;
    doc.rect(14, remarksY, pageWidth - 28, 24);
    doc.setFillColor(yellow[0], yellow[1], yellow[2]);
    doc.rect(pageWidth / 2 - 18, remarksY - 4.5, 36, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('REMARKS', pageWidth / 2, remarksY, { align: 'center' });
    doc.line(pageWidth / 2, remarksY, pageWidth / 2, remarksY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Class Master: ${classMasterRemark}`, 17, remarksY + 9);
    doc.text(`Principal: ${principalRemark}`, pageWidth / 2 + 3, remarksY + 9);
    doc.text(`Class Master: ${studentRow.classTeacher}`, 17, remarksY + 18);
    doc.text(`Principal: ${schoolProfile.principal || profileForEdit.name}`, pageWidth / 2 + 3, remarksY + 18);

    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text(`Generated on ${new Date().toISOString().slice(0, 10)} | Automated school report card output`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

  const printStudentReportCard = (studentRow) => {
    if (!studentRow) {
      return;
    }
    const doc = new jsPDF();
    renderStudentReportCardPage(doc, studentRow);
    const safeName = String(studentRow.name || 'student').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    doc.save(`report-card-${safeName}.pdf`);
  };

  const printClassReportCards = () => {
    if (resultClassFilter === 'All') {
      alert('Please select a class in the Results filters before printing report cards.');
      return;
    }

    if (!classScopeRankedRows.length) {
      alert('No students available for the selected class filters.');
      return;
    }

    const doc = new jsPDF();
    classScopeRankedRows.forEach((studentRow, index) => {
      if (index > 0) {
        doc.addPage();
      }
      renderStudentReportCardPage(doc, studentRow);
    });

    const safeClass = String(resultClassFilter).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const safeSection = resultSectionFilter === 'All'
      ? 'all-sections'
      : String(resultSectionFilter).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    doc.save(`class-report-cards-${safeClass}-${safeSection}.pdf`);
  };

  const printIdCards = () => {
    if (idCardClassFilter === 'All') {
      alert('Please select a class in the ID card filters before printing full-class cards.');
      return;
    }

    if (!idCardRows.length) {
      alert('No students found for the selected ID card filters.');
      return;
    }

    const popup = window.open('', '_blank', 'width=1300,height=900');
    if (!popup) {
      alert('Unable to open print window. Please allow pop-ups and try again.');
      return;
    }

    const escapeHtml = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const schoolName = escapeHtml(String(schoolProfile.schoolName || 'SUCCESS ACADEMY').toUpperCase());
    const logoUrl = escapeHtml(schoolProfile.logoUrl || '');
    const session = escapeHtml(schoolProfile.currentSession || '2025/2026');
    const contactPhone = escapeHtml(schoolProfile.contactPhone || '+237 677000000');
    const contactEmail = escapeHtml(schoolProfile.contactEmail || 'info@school.edu');
    const address = escapeHtml(schoolProfile.address || 'P.O. BOX 123');
    const city = escapeHtml(schoolProfile.city || 'Bamenda');

    const cardsMarkup = idCardRows.map((student) => {
      const studentName = escapeHtml(student.name);
      const studentClass = escapeHtml(student.className || '-');
      const idNumber = escapeHtml(student.idNumber || '-');
      const subSchool = escapeHtml(student.section || '-');
      const dob = escapeHtml(formatDisplayDate(student.dateOfBirth, '-'));
      const avatar = escapeHtml(student.avatar || '');
      const qrUrl = escapeHtml(student.qrUrl || '');

      return `
        <article class="id-print-pair">
          <div class="id-card id-front">
            <div class="id-head">
              <img src="${logoUrl}" alt="School logo" />
              <strong>${schoolName}</strong>
            </div>
            <div class="id-front-body">
              <img class="id-photo" src="${avatar}" alt="${studentName}" />
              <div class="id-meta">
                <h4>${studentName}</h4>
                <p><span>Matricule:</span> ${idNumber}</p>
                <p><span>Class:</span> ${studentClass}</p>
                <p><span>Sub-School:</span> ${subSchool}</p>
                <p><span>Date of Birth:</span> ${dob}</p>
                <p><span>Academic Year:</span> ${session}</p>
              </div>
            </div>
            <div class="id-signature">
              <small>Student Signature</small>
              <div class="line"></div>
            </div>
          </div>

          <div class="id-card id-back">
            <img class="id-watermark" src="${logoUrl}" alt="" />
            <div class="id-back-top">
              <img class="id-qr" src="${qrUrl}" alt="${studentName} QR" />
              <p>Scan to Verify Student ID</p>
            </div>
            <h3>ID: ${idNumber}</h3>
            <div class="id-contact">
              <strong>${schoolName}</strong>
              <p>${address}</p>
              <p>${city}</p>
              <p>Tel: ${contactPhone}</p>
              <p>Email: ${contactEmail}</p>
            </div>
          </div>
        </article>
      `;
    }).join('');

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>ID Cards - ${schoolName}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 14px; background: #f4f5f7; font-family: Arial, Helvetica, sans-serif; color: #1f2937; }
            .id-print-wrap { display: grid; grid-template-columns: repeat(auto-fill, minmax(720px, 1fr)); gap: 12px; }
            .id-print-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; break-inside: avoid; }
            .id-card { position: relative; border: 1px solid #d6dbe8; border-radius: 14px; background: #fff; min-height: 236px; overflow: hidden; }
            .id-head { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-bottom: 6px solid #1e3a8a; }
            .id-head img { width: 46px; height: 46px; object-fit: contain; }
            .id-head strong { font-size: 20px; color: #102a56; letter-spacing: .3px; }
            .id-front-body { display: grid; grid-template-columns: 104px 1fr; gap: 10px; padding: 10px; }
            .id-photo { width: 100%; height: 124px; object-fit: cover; border: 1px solid #cfd7e7; border-radius: 6px; background: #f4f8ff; }
            .id-meta h4 { margin: 2px 0 7px; font-size: 27px; color: #1f2937; }
            .id-meta p { margin: 0; padding: 3px 0; border-bottom: 1px solid #edf1f8; font-size: 13px; }
            .id-meta span { font-weight: 700; color: #111827; margin-right: 5px; }
            .id-signature { padding: 0 10px 10px; display: grid; gap: 5px; }
            .id-signature small { color: #6b7280; font-style: italic; }
            .id-signature .line { height: 1px; background: #c8cfdd; }
            .id-back { padding: 10px; }
            .id-watermark { position: absolute; right: 10px; top: 18px; width: 164px; opacity: .08; }
            .id-back-top { display: grid; justify-items: start; gap: 6px; }
            .id-qr { width: 92px; height: 92px; border: 1px solid #d9e1ee; border-radius: 4px; }
            .id-back-top p { margin: 0; font-size: 13px; color: #374151; }
            .id-back h3 { margin: 8px 0 10px; font-size: 42px; color: #17366c; letter-spacing: .7px; }
            .id-contact strong { display: block; font-size: 24px; margin-bottom: 6px; color: #172554; }
            .id-contact p { margin: 3px 0; font-size: 14px; color: #374151; }
            @media print {
              body { background: #fff; padding: 0; }
              .id-print-wrap { grid-template-columns: 1fr; gap: 6mm; }
              .id-print-pair { page-break-inside: avoid; }
              .id-card { border-color: #ccd5e4; }
            }
          </style>
        </head>
        <body>
          <div class="id-print-wrap">${cardsMarkup}</div>
        </body>
      </html>
    `);

    popup.document.close();
    popup.focus();
    window.setTimeout(() => {
      popup.print();
    }, 350);
  };

  const publishReportCardsToPortal = (rows = []) => {
    if (!Array.isArray(rows) || !rows.length) {
      alert('No students available to publish report cards for the current results filter.');
      return;
    }

    const term = String(schoolProfile.currentTerm || 'Term 1');
    const sequence = 'Sequence 1';
    const academicYear = String(schoolProfile.currentSession || '2025/2026');
    const publishedAt = new Date().toISOString().slice(0, 10);

    const payload = rows.map((studentRow) => {
      const subjectRows = (studentResultDetailsByName[studentRow.name] || []).map((subjectRow) => {
        const classSubjectKey = `${studentRow.className}__${studentRow.section}__${subjectRow.subject}`.toLowerCase();
        const allSectionSubjectKey = `${studentRow.className}__all__${subjectRow.subject}`.toLowerCase();
        const globalSubjectKey = `all__all__${subjectRow.subject}`.toLowerCase();
        const coefficient = Number(
          subjectCoefficientLookup[classSubjectKey]
          || subjectCoefficientLookup[allSectionSubjectKey]
          || subjectCoefficientLookup[globalSubjectKey]
          || 1
        );

        return {
          subject: subjectRow.subject,
          score: Number(subjectRow.score || 0),
          grade: subjectRow.grade || getGradeFromAverage(subjectRow.score),
          coefficient
        };
      });

      return {
        id: Date.now() + studentRow.id,
        studentId: studentRow.id,
        studentName: studentRow.name,
        matricule: studentRow.matricule,
        parentName: studentRow.parent,
        className: studentRow.className,
        section: studentRow.section,
        academicYear,
        term,
        sequence,
        average: Number(studentRow.average || 0),
        grade: studentRow.grade,
        band: studentRow.band,
        rank: Number(studentRow.rank || 0),
        classSize: Number(studentRow.classSize || 0),
        attendance: Number(studentRow.attendance || 0),
        classTeacher: studentRow.classTeacher,
        publishedAt,
        publishedBy: profileForEdit.name,
        subjects: subjectRows
      };
    });

    publishReportCards(payload);
    setNotice(`Published ${payload.length} report card${payload.length > 1 ? 's' : ''} to student and parent portals (view-only).`);
  };

  const exportClassPerformancePdf = () => {
    if (resultClassFilter === 'All') {
      alert('Please select a class in the Results filters before exporting class performance PDF.');
      return;
    }

    if (!classScopeRankedRows.length) {
      alert('No ranked class data available for this filter combination.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);
    const green = [15, 118, 110];
    const blue = [29, 78, 216];

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(margin, 12, contentWidth, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`${schoolProfile.schoolName} - CLASS PERFORMANCE STATISTICS`, pageWidth / 2, 21, { align: 'center' });

    doc.setDrawColor(220, 224, 230);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, 29, contentWidth, 24, 'FD');
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`Academic Session: ${schoolProfile.currentSession}`, margin + 4, 36);
    doc.text(`Term: ${schoolProfile.currentTerm}`, margin + 4, 42);
    doc.text(`Class Filter: ${resultClassFilter}`, margin + 4, 48);
    doc.text(`Sub-School Filter: ${resultSectionFilter}`, margin + 90, 48);

    const groupedByClass = classScopeRankedRows.reduce((accumulator, item) => {
      const key = buildClassKey(item.className, item.section);
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(item);
      return accumulator;
    }, {});

    let y = 58;
    Object.values(groupedByClass).forEach((classRows) => {
      const first = classRows[0];
      const average = Number((classRows.reduce((sum, item) => sum + item.average, 0) / classRows.length).toFixed(1));
      const passRate = Math.round((classRows.filter((item) => item.average >= 10).length / classRows.length) * 100);
      const failedRate = Math.max(0, 100 - passRate);
      const top = classRows[0];

      if (y > pageHeight - 95) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y, contentWidth, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11.5);
      doc.text(`${first.className} - ${first.section}`, margin + 4, y + 6.7);
      y += 13;

      const cardGap = 3;
      const cardWidth = (contentWidth - (cardGap * 2)) / 3;
      doc.setDrawColor(209, 213, 219);
      doc.setTextColor(17, 24, 39);

      doc.setFillColor(240, 249, 255);
      doc.rect(margin, y, cardWidth, 18, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('Class Teacher', margin + 3, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(first.classTeacher, margin + 3, y + 13.5);

      doc.setFillColor(236, 253, 245);
      doc.rect(margin + cardWidth + cardGap, y, cardWidth, 18, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.text('Students / Pass-Fail', margin + cardWidth + cardGap + 3, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(`${classRows.length} Students • ${passRate}% / ${failedRate}%`, margin + cardWidth + cardGap + 3, y + 13.5);

      doc.setFillColor(239, 246, 255);
      doc.rect(margin + ((cardWidth + cardGap) * 2), y, cardWidth, 18, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.text('Average / Top Student', margin + ((cardWidth + cardGap) * 2) + 3, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(`${average}/20 • ${top.name}`, margin + ((cardWidth + cardGap) * 2) + 3, y + 13.5);

      y += 23;

      const tableCols = [12, 56, 26, 18, 42];
      const tableX = margin;
      const tableWidth = tableCols.reduce((sum, width) => sum + width, 0);
      const rowHeight = 7;

      doc.setFillColor(blue[0], blue[1], blue[2]);
      doc.rect(tableX, y, tableWidth, rowHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9.5);
      const headers = ['#', 'Student', 'Average', 'Grade', 'Band'];
      let headerX = tableX;
      headers.forEach((header, headerIndex) => {
        doc.text(header, headerX + (tableCols[headerIndex] / 2), y + 4.8, { align: 'center' });
        headerX += tableCols[headerIndex];
      });
      y += rowHeight;

      classRows.forEach((studentRow, index) => {
        if (y > pageHeight - 14) {
          doc.addPage();
          y = 20;
          doc.setFillColor(blue[0], blue[1], blue[2]);
          doc.rect(tableX, y, tableWidth, rowHeight, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          headerX = tableX;
          headers.forEach((header, headerIndex) => {
            doc.text(header, headerX + (tableCols[headerIndex] / 2), y + 4.8, { align: 'center' });
            headerX += tableCols[headerIndex];
          });
          y += rowHeight;
        }

        doc.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
        doc.rect(tableX, y, tableWidth, rowHeight, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.rect(tableX, y, tableWidth, rowHeight);

        let colX = tableX;
        const values = [
          String(studentRow.rank),
          studentRow.name,
          `${studentRow.average.toFixed(1)}/20`,
          studentRow.grade,
          studentRow.band
        ];

        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'normal');
        values.forEach((value, valueIndex) => {
          const align = valueIndex === 1 ? 'left' : 'center';
          const textX = align === 'left' ? colX + 2 : colX + (tableCols[valueIndex] / 2);
          doc.text(String(value), textX, y + 4.8, { align });
          colX += tableCols[valueIndex];
          if (valueIndex < tableCols.length - 1) {
            doc.line(colX, y, colX, y + rowHeight);
          }
        });

        y += rowHeight;
      });

      y += 8;
    });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(8.5);
    doc.text(`Generated on ${new Date().toISOString().slice(0, 10)} • EduIgnite Performance Analytics`, pageWidth / 2, pageHeight - 8, { align: 'center' });

    const safeClass = String(resultClassFilter).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const safeSection = resultSectionFilter === 'All'
      ? 'all-sections'
      : String(resultSectionFilter).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    doc.save(`class-performance-${safeClass}-${safeSection}.pdf`);
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
      {(() => {
        const usersPageData = getPaginatedData('users', filteredUsers);
        return (
          <>
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

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Admin Enrollment & Tab Allocation</h3>
          <p>Enroll multiple admins and assign the exact tabs they are allowed to manage.</p>
        </div>

        <div className="admin-control-grid">
          <label>
            Admin Full Name
            <input
              type="text"
              value={adminEnrollmentDraft.name}
              onChange={(event) => setAdminEnrollmentDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="e.g. Miriam Neba"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={adminEnrollmentDraft.email}
              onChange={(event) => setAdminEnrollmentDraft((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="admin@school.edu"
            />
          </label>
          <label>
            Phone
            <input
              type="text"
              value={adminEnrollmentDraft.phone}
              onChange={(event) => setAdminEnrollmentDraft((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="677000123"
            />
          </label>
          <label>
            Sub-School
            <select
              value={adminEnrollmentDraft.section}
              onChange={(event) => setAdminEnrollmentDraft((prev) => ({ ...prev, section: event.target.value }))}
            >
              {sectionOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="admin-field-span">
            Manageable Tabs (Ctrl/Cmd + Click for multiple)
            <select
              multiple
              value={adminEnrollmentDraft.managedTabs}
              onChange={(event) => setAdminEnrollmentDraft((prev) => ({ ...prev, managedTabs: getMultiSelectValues(event) }))}
            >
              {ADMIN_TAB_ACCESS_OPTIONS.map((tab) => (
                <option key={tab.key} value={tab.key}>{tab.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-actions">
          <button type="button" onClick={enrollAdminFromAdmin}>Enroll Admin</button>
        </div>

        <div className="admin-table-wrap" style={{ marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Admin</th>
                <th>Email</th>
                <th>Sub-School</th>
                <th>Managed Tabs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {managedAdmins.map((item) => {
                const assignedTabs = (item.managedTabs && item.managedTabs.length)
                  ? item.managedTabs
                  : ADMIN_TAB_ACCESS_OPTIONS.map((tab) => tab.key);
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.section || 'Unassigned'}</td>
                    <td>
                      <select
                        multiple
                        value={assignedTabs}
                        onChange={(event) => updateAdminManagedTabs(item.id, getMultiSelectValues(event))}
                      >
                        {ADMIN_TAB_ACCESS_OPTIONS.map((tab) => (
                          <option key={tab.key} value={tab.key}>{tab.label}</option>
                        ))}
                      </select>
                    </td>
                    <td><span className={`admin-badge ${String(item.status || 'active').toLowerCase().replace(' ', '-')}`}>{item.status || 'Active'}</span></td>
                  </tr>
                );
              })}
              {!managedAdmins.length && (
                <tr>
                  <td colSpan="5" className="attendance-empty">No admin accounts enrolled yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

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
            {usersPageData.pageItems.map((item) => (
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
      {renderPaginationControls('users', usersPageData, 'users')}
          </>
        );
      })()}
    </section>
  );

  const renderStudents = () => (
    <section className="admin-panel">
      {(() => {
        const studentsPageData = getPaginatedData('students', filteredStudents);
        return (
          <>
      <div className="section-header">
        <h2>Students</h2>
        <p>Enroll students, generate matricules, track platform fee payment and control academic records.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total</span><strong>{filteredStudentStats.total}</strong></article>
        <article><span>Girls</span><strong>{filteredStudentStats.girls}</strong></article>
        <article><span>Boys</span><strong>{filteredStudentStats.boys}</strong></article>
        <article><span>At Risk</span><strong>{filteredStudentStats.atRisk}</strong></article>
        <article><span>Platform Paid</span><strong>{filteredStudentStats.platformPaid}</strong></article>
        <article><span>Platform Pending</span><strong>{filteredStudentStats.platformPending}</strong></article>
        <article><span>School Fees Unpaid</span><strong>{filteredStudentStats.schoolFeesUnpaid}</strong></article>
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
                <select
                  value={enrollmentDraft.className}
                  onChange={(event) => setEnrollmentDraft((prev) => ({ ...prev, className: event.target.value }))}
                >
                  {enrollmentClassOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
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

      <div className="admin-control-grid">
        <label>
          Sub-School
          <select value={studentSectionFilter} onChange={(event) => setStudentSectionFilter(event.target.value)}>
            {studentSectionOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Gender
          <select value={studentGenderFilter} onChange={(event) => setStudentGenderFilter(event.target.value)}>
            {studentGenderOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Platform Fee Status
          <select value={studentPlatformFeeFilter} onChange={(event) => setStudentPlatformFeeFilter(event.target.value)}>
            <option>All</option>
            <option>Paid</option>
            <option>Pending</option>
          </select>
        </label>
        <label>
          School Fee Status
          <select value={studentSchoolFeeFilter} onChange={(event) => setStudentSchoolFeeFilter(event.target.value)}>
            <option>All</option>
            <option>Unpaid School Fees</option>
            <option>Cleared</option>
            <option>Partial</option>
            <option>Outstanding</option>
            <option>Pending</option>
          </select>
        </label>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Student</th>
              <th>Gender</th>
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
            {studentsPageData.pageItems.map((item) => (
              <React.Fragment key={item.id}>
                <tr>
                  <td>{item.matricule || '-'}</td>
                  <td>{item.name}</td>
                  <td>{item.gender || 'Not Specified'}</td>
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
                      <button type="button" className="row-action" onClick={() => openStudentEdit(item)}>
                        Edit Info
                      </button>
                      <button type="button" className="row-action" onClick={() => downloadStudentEnrollmentPdf(item)}>
                        PDF Form
                      </button>
                      <button type="button" className="row-action" onClick={() => toggleStudentPlatformFee(item)}>
                        {item.platformFeePaid ? 'Mark Unpaid' : 'Confirm Paid'}
                      </button>
                    </div>
                    {!item.platformFeePaid && <small className="admin-cell-note">Academic updates locked until platform fee is paid.</small>}
                  </td>
                </tr>
                {renderInlineProfileRow('student', item.id, 11)}
              </React.Fragment>
            ))}
            {!filteredStudents.length && (
              <tr>
                <td colSpan="11" className="attendance-empty">No students match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls('students', studentsPageData, 'students')}

      {editingStudentId && (
        <article className="admin-card admin-chart-section">
          <div className="section-header compact">
            <h3>Edit Student Information</h3>
          </div>
          <div className="admin-control-grid">
            <label>
              Full Name
              <input type="text" value={studentEditDraft.name} onChange={(event) => setStudentEditDraft((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label>
              Class
              <select value={studentEditDraft.className} onChange={(event) => setStudentEditDraft((prev) => ({ ...prev, className: event.target.value }))}>
                {enrollmentClassOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Sub-School
              <select value={studentEditDraft.section} onChange={(event) => setStudentEditDraft((prev) => ({ ...prev, section: event.target.value }))}>
                {sectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Gender
              <select value={studentEditDraft.gender} onChange={(event) => setStudentEditDraft((prev) => ({ ...prev, gender: event.target.value }))}>
                <option>Not Specified</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </label>
            <label>
              Parent / Guardian
              <input type="text" value={studentEditDraft.parent} onChange={(event) => setStudentEditDraft((prev) => ({ ...prev, parent: event.target.value }))} />
            </label>
            <label>
              Attendance (%)
              <input type="number" min="0" max="100" value={studentEditDraft.attendance} onChange={(event) => setStudentEditDraft((prev) => ({ ...prev, attendance: event.target.value }))} />
            </label>
            <label>
              Result Average (/20)
              <input type="number" min="0" max="20" step="0.1" value={studentEditDraft.resultAverage} onChange={(event) => setStudentEditDraft((prev) => ({ ...prev, resultAverage: event.target.value }))} />
            </label>
            <label>
              School Fee Status
              <select value={studentEditDraft.feeStatus} onChange={(event) => setStudentEditDraft((prev) => ({ ...prev, feeStatus: event.target.value }))}>
                <option>Pending</option>
                <option>Outstanding</option>
                <option>Partial</option>
                <option>Cleared</option>
              </select>
            </label>
            <label>
              Student Status
              <select value={studentEditDraft.status} onChange={(event) => setStudentEditDraft((prev) => ({ ...prev, status: event.target.value }))}>
                <option>Active</option>
                <option>At Risk</option>
                <option>Platform Fee Pending</option>
              </select>
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={studentEditDraft.platformFeePaid}
                onChange={(event) => setStudentEditDraft((prev) => ({ ...prev, platformFeePaid: event.target.checked }))}
              />
              Platform Fee Paid
            </label>
          </div>
          <div className="admin-actions">
            <button type="button" onClick={saveStudentEdit}>Save Student Info</button>
            <button type="button" className="row-action" onClick={cancelStudentEdit}>Cancel</button>
          </div>
        </article>
      )}
          </>
        );
      })()}
    </section>
  );

  const renderSimpleRoleTable = (title, subtitle, rows, role) => {
    const rolePageKey = `role-${role.toLowerCase()}`;
    const rolePageData = getPaginatedData(rolePageKey, rows);

    return (
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
            {rolePageData.pageItems.map((item) => (
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
      {renderPaginationControls(rolePageKey, rolePageData, title.toLowerCase())}
    </section>
    );
  };

  const renderTeachers = () => {
    const teachersPageData = getPaginatedData('teachers', filteredTeachers);

    return (
      <section className="admin-panel">
        <div className="section-header">
          <h2>Teachers</h2>
          <p>Enroll teachers and allocate registered classes, subjects, and sub-schools.</p>
        </div>

        <div className="admin-kpi-row compact">
          <article><span>Total Teachers</span><strong>{filteredTeacherStats.total}</strong></article>
          <article><span>Active</span><strong>{filteredTeacherStats.active}</strong></article>
          <article><span>Sub-Schools</span><strong>{filteredTeacherStats.subSchools}</strong></article>
          <article><span>Departments</span><strong>{filteredTeacherStats.departments}</strong></article>
        </div>

        <div className="admin-control-grid">
          <label>
            Search
            <input
              type="text"
              value={teacherSearchTerm}
              onChange={(event) => setTeacherSearchTerm(event.target.value)}
              placeholder="Search by name, email, class, or subject"
            />
          </label>
          <label>
            Department
            <select value={teacherDepartmentFilter} onChange={(event) => setTeacherDepartmentFilter(event.target.value)}>
              {teacherDepartmentOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Sub-School
            <select value={teacherSectionFilter} onChange={(event) => setTeacherSectionFilter(event.target.value)}>
              {teacherSectionOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <div className="admin-control-grid">
          <label>
            Status
            <select value={teacherStatusFilter} onChange={(event) => setTeacherStatusFilter(event.target.value)}>
              {teacherStatusOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Allocated Class
            <select value={teacherClassFilter} onChange={(event) => setTeacherClassFilter(event.target.value)}>
              <option>All</option>
              {teacherClassOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Allocated Subject
            <select value={teacherSubjectFilter} onChange={(event) => setTeacherSubjectFilter(event.target.value)}>
              <option>All</option>
              {teacherSubjectOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <article className="admin-card admin-chart-section">
          <div className="section-header compact">
            <h3>Enroll Teacher</h3>
            <p>Create teacher profile and assign classes/subjects from registered data.</p>
          </div>

          {!showTeacherEnrollmentForm && (
            <div className="admin-actions">
              <button type="button" onClick={() => setShowTeacherEnrollmentForm(true)}>Enroll Teacher</button>
            </div>
          )}

          {showTeacherEnrollmentForm && (
            <>
              <div className="admin-control-grid">
                <label>
                  Teacher Full Name
                  <input
                    type="text"
                    value={teacherEnrollmentDraft.name}
                    onChange={(event) => setTeacherEnrollmentDraft((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="e.g. Brenda Nji"
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={teacherEnrollmentDraft.email}
                    onChange={(event) => setTeacherEnrollmentDraft((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="e.g. brenda.nji@eduignite.edu"
                  />
                </label>
                <label>
                  Phone
                  <input
                    type="text"
                    value={teacherEnrollmentDraft.phone}
                    onChange={(event) => setTeacherEnrollmentDraft((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="e.g. 677123000"
                  />
                </label>
                <label>
                  Department
                  <select
                    value={teacherEnrollmentDraft.department}
                    onChange={(event) => setTeacherEnrollmentDraft((prev) => ({ ...prev, department: event.target.value }))}
                  >
                    {departments.map((dept) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                  </select>
                </label>
                <label>
                  Sub-School
                  <select
                    value={teacherEnrollmentDraft.section}
                    onChange={(event) => setTeacherEnrollmentDraft((prev) => ({ ...prev, section: event.target.value }))}
                  >
                    {sectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  Gender
                  <select
                    value={teacherEnrollmentDraft.gender}
                    onChange={(event) => setTeacherEnrollmentDraft((prev) => ({ ...prev, gender: event.target.value }))}
                  >
                    <option>Not Specified</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </label>
                <label className="admin-field-span">
                  Allocate Classes (Ctrl/Cmd + Click for multiple)
                  <select
                    multiple
                    value={teacherEnrollmentDraft.allocatedClasses}
                    onChange={(event) => setTeacherEnrollmentDraft((prev) => ({ ...prev, allocatedClasses: getMultiSelectValues(event) }))}
                  >
                    {teacherClassOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="admin-field-span">
                  Allocate Subjects (Ctrl/Cmd + Click for multiple)
                  <select
                    multiple
                    value={teacherEnrollmentDraft.allocatedSubjects}
                    onChange={(event) => setTeacherEnrollmentDraft((prev) => ({ ...prev, allocatedSubjects: getMultiSelectValues(event) }))}
                  >
                    {teacherSubjectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              </div>

              <div className="admin-actions">
                <button type="button" onClick={enrollTeacherFromAdmin}>Enroll Teacher + Download PDF Profile</button>
                <button type="button" className="row-action" onClick={() => setShowTeacherEnrollmentForm(false)}>Hide Form</button>
              </div>
            </>
          )}
        </article>

        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Sub-School</th>
                <th>Classes</th>
                <th>Subjects</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachersPageData.pageItems.map((item) => (
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
                    <td>{(item.allocatedClasses || []).join(', ') || '—'}</td>
                    <td>{(item.allocatedSubjects || []).join(', ') || '—'}</td>
                    <td><span className={`admin-badge ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
                    <td>
                      <div className="admin-row-actions">
                        <button type="button" className="row-action" onClick={() => openUserDetails(item.id)}>View Profile</button>
                        <button type="button" className="row-action" onClick={() => openTeacherEdit(item)}>Edit Info</button>
                        <button type="button" className="row-action" onClick={() => downloadTeacherEnrollmentPdf(item)}>PDF Profile</button>
                        <button type="button" className="row-action" onClick={() => toggleUserStatus(item.id)}>
                          {item.status === 'Active' ? 'Suspend Teacher' : 'Activate Teacher'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {renderInlineProfileRow('user', item.id, 8)}
                </React.Fragment>
              ))}
              {!filteredTeachers.length && (
                <tr>
                  <td colSpan="8" className="attendance-empty">No teacher records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPaginationControls('teachers', teachersPageData, 'teachers')}

        {editingTeacherId && (
          <article className="admin-card admin-chart-section">
            <div className="section-header compact">
              <h3>Edit Teacher Information</h3>
            </div>
            <div className="admin-control-grid">
              <label>
                Full Name
                <input type="text" value={teacherEditDraft.name} onChange={(event) => setTeacherEditDraft((prev) => ({ ...prev, name: event.target.value }))} />
              </label>
              <label>
                Email
                <input type="email" value={teacherEditDraft.email} onChange={(event) => setTeacherEditDraft((prev) => ({ ...prev, email: event.target.value }))} />
              </label>
              <label>
                Phone
                <input type="text" value={teacherEditDraft.phone} onChange={(event) => setTeacherEditDraft((prev) => ({ ...prev, phone: event.target.value }))} />
              </label>
              <label>
                Department
                <select value={teacherEditDraft.department} onChange={(event) => setTeacherEditDraft((prev) => ({ ...prev, department: event.target.value }))}>
                  {departments.map((dept) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                </select>
              </label>
              <label>
                Sub-School
                <select value={teacherEditDraft.section} onChange={(event) => setTeacherEditDraft((prev) => ({ ...prev, section: event.target.value }))}>
                  {sectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Gender
                <select value={teacherEditDraft.gender} onChange={(event) => setTeacherEditDraft((prev) => ({ ...prev, gender: event.target.value }))}>
                  <option>Not Specified</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </label>
              <label>
                Status
                <select value={teacherEditDraft.status} onChange={(event) => setTeacherEditDraft((prev) => ({ ...prev, status: event.target.value }))}>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>On Leave</option>
                </select>
              </label>
              <label className="admin-field-span">
                Allocated Classes (Ctrl/Cmd + Click for multiple)
                <select
                  multiple
                  value={teacherEditDraft.allocatedClasses}
                  onChange={(event) => setTeacherEditDraft((prev) => ({ ...prev, allocatedClasses: getMultiSelectValues(event) }))}
                >
                  {teacherClassOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="admin-field-span">
                Allocated Subjects (Ctrl/Cmd + Click for multiple)
                <select
                  multiple
                  value={teacherEditDraft.allocatedSubjects}
                  onChange={(event) => setTeacherEditDraft((prev) => ({ ...prev, allocatedSubjects: getMultiSelectValues(event) }))}
                >
                  {teacherSubjectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <div className="admin-actions">
              <button type="button" onClick={saveTeacherEdit}>Save Teacher Info</button>
              <button type="button" className="row-action" onClick={cancelTeacherEdit}>Cancel</button>
            </div>
          </article>
        )}
      </section>
    );
  };

  const renderStaff = () => {
    const staffPageData = getPaginatedData('staff', staff);

    return (
      <section className="admin-panel">
        <div className="section-header">
          <h2>Staff</h2>
          <p>Enroll and manage non-teaching staff accounts and sub-school assignments.</p>
        </div>

        <div className="admin-kpi-row compact">
          <article><span>Total Staff</span><strong>{staff.length}</strong></article>
          <article><span>Active</span><strong>{staff.filter((item) => item.status === 'Active').length}</strong></article>
          <article><span>Departments</span><strong>{new Set(staff.map((item) => item.department)).size || 1}</strong></article>
          <article><span>Sub-Schools</span><strong>{new Set(staff.map((item) => item.section || sectionOptions[0])).size || 1}</strong></article>
        </div>

        <article className="admin-card admin-chart-section">
          <div className="section-header compact">
            <h3>Enroll Staff</h3>
            <p>Create a staff profile and assign department plus sub-school.</p>
          </div>

          {!showStaffEnrollmentForm && (
            <div className="admin-actions">
              <button type="button" onClick={() => setShowStaffEnrollmentForm(true)}>Enroll Staff</button>
            </div>
          )}

          {showStaffEnrollmentForm && (
            <>
              <div className="admin-control-grid">
                <label>
                  Staff Full Name
                  <input
                    type="text"
                    value={staffEnrollmentDraft.name}
                    onChange={(event) => setStaffEnrollmentDraft((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="e.g. Grace Librarian"
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={staffEnrollmentDraft.email}
                    onChange={(event) => setStaffEnrollmentDraft((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="e.g. grace@eduignite.edu"
                  />
                </label>
                <label>
                  Phone
                  <input
                    type="text"
                    value={staffEnrollmentDraft.phone}
                    onChange={(event) => setStaffEnrollmentDraft((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="e.g. 677123999"
                  />
                </label>
                <label>
                  Department
                  <select
                    value={staffEnrollmentDraft.department}
                    onChange={(event) => setStaffEnrollmentDraft((prev) => ({ ...prev, department: event.target.value }))}
                  >
                    {departments.map((dept) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                  </select>
                </label>
                <label>
                  Sub-School
                  <select
                    value={staffEnrollmentDraft.section}
                    onChange={(event) => setStaffEnrollmentDraft((prev) => ({ ...prev, section: event.target.value }))}
                  >
                    {sectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  Gender
                  <select
                    value={staffEnrollmentDraft.gender}
                    onChange={(event) => setStaffEnrollmentDraft((prev) => ({ ...prev, gender: event.target.value }))}
                  >
                    <option>Not Specified</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </label>
              </div>

              <div className="admin-actions">
                <button type="button" onClick={enrollStaffFromAdmin}>Enroll Staff + Download PDF Profile</button>
                <button type="button" className="row-action" onClick={() => setShowStaffEnrollmentForm(false)}>Hide Form</button>
              </div>
            </>
          )}
        </article>

        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Sub-School</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffPageData.pageItems.map((item) => (
                <React.Fragment key={item.id}>
                  <tr>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.phone || '—'}</td>
                    <td>{item.department}</td>
                    <td>
                      <select value={item.section || sectionOptions[0] || ''} onChange={(event) => assignUserSection(item.id, event.target.value)}>
                        {sectionOptions.map((section) => <option key={section}>{section}</option>)}
                      </select>
                    </td>
                    <td><span className={`admin-badge ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
                    <td>
                      <div className="admin-row-actions">
                        <button type="button" className="row-action" onClick={() => openUserDetails(item.id)}>View Profile</button>
                        <button type="button" className="row-action" onClick={() => downloadStaffEnrollmentPdf(item)}>PDF Profile</button>
                        <button type="button" className="row-action" onClick={() => toggleUserStatus(item.id)}>
                          {item.status === 'Active' ? 'Suspend Staff' : 'Activate Staff'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {renderInlineProfileRow('user', item.id, 7)}
                </React.Fragment>
              ))}
              {!staff.length && (
                <tr>
                  <td colSpan="7" className="attendance-empty">No staff records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {renderPaginationControls('staff', staffPageData, 'staff')}
      </section>
    );
  };

  const renderClasses = () => {
    const classesPageData = getPaginatedData('classes', filteredClasses);
    return (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Classes</h2>
        <p>Register classes, assign rooms and sub-schools, and manage class operations at scale.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total Classes</span><strong>{filteredClassStats.total}</strong></article>
        <article><span>Active</span><strong>{filteredClassStats.active}</strong></article>
        <article><span>Enrolled Students</span><strong>{filteredClassStats.totalEnrolled}</strong></article>
        <article><span>Near Capacity</span><strong>{filteredClassStats.nearCapacity}</strong></article>
      </div>

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Register Class</h3>
          <p>Create a class and assign block name, room number and sub-school.</p>
        </div>

        {!showClassRegistrationForm && (
          <div className="admin-actions">
            <button type="button" onClick={() => setShowClassRegistrationForm(true)}>Register Class</button>
          </div>
        )}

        {showClassRegistrationForm && (
          <>
            <div className="admin-control-grid">
              <label>
                Class Name
                <input
                  type="text"
                  value={classRegistrationDraft.name}
                  onChange={(event) => setClassRegistrationDraft((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Grade 7"
                />
              </label>
              <label>
                Block Name
                <input
                  type="text"
                  value={classRegistrationDraft.blockName}
                  onChange={(event) => setClassRegistrationDraft((prev) => ({ ...prev, blockName: event.target.value }))}
                  placeholder="e.g. Primary Block A"
                />
              </label>
              <label>
                Sub-School
                <select
                  value={classRegistrationDraft.section}
                  onChange={(event) => setClassRegistrationDraft((prev) => ({ ...prev, section: event.target.value }))}
                >
                  {sectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Room Number
                <input
                  type="text"
                  value={classRegistrationDraft.roomNumber}
                  onChange={(event) => setClassRegistrationDraft((prev) => ({ ...prev, roomNumber: event.target.value }))}
                  placeholder="e.g. 14"
                />
              </label>
              <label>
                Capacity
                <input
                  type="number"
                  min="1"
                  value={classRegistrationDraft.capacity}
                  onChange={(event) => setClassRegistrationDraft((prev) => ({ ...prev, capacity: event.target.value }))}
                />
              </label>
              <label>
                Status
                <select
                  value={classRegistrationDraft.status}
                  onChange={(event) => setClassRegistrationDraft((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>

            <div className="admin-actions">
              <button type="button" onClick={enrollClassFromAdmin}>Register Class</button>
              <button type="button" className="row-action" onClick={() => setShowClassRegistrationForm(false)}>Hide Form</button>
            </div>
          </>
        )}
      </article>

      <div className="admin-control-grid">
        <label>
          Search
          <input
            type="text"
            value={classSearchTerm}
            onChange={(event) => setClassSearchTerm(event.target.value)}
            placeholder="Search class, block or room number"
          />
        </label>
        <label>
          Sub-School
          <select value={classSectionFilter} onChange={(event) => setClassSectionFilter(event.target.value)}>
            {classSectionOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Block
          <select value={classBlockFilter} onChange={(event) => setClassBlockFilter(event.target.value)}>
            {classBlockOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={classStatusFilter} onChange={(event) => setClassStatusFilter(event.target.value)}>
            {classStatusOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Class</th>
              <th>Sub-School</th>
              <th>Block</th>
              <th>Room Number</th>
              <th>Enrolled</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classesPageData.pageItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <select
                    value={item.section || sectionOptions[0] || ''}
                    onChange={(event) => setClasses((prev) => prev.map((classItem) => (
                      classItem.id === item.id ? { ...classItem, section: event.target.value } : classItem
                    )))}
                  >
                    {sectionOptions.map((section) => <option key={section}>{section}</option>)}
                  </select>
                </td>
                <td>{item.blockName || 'Unassigned Block'}</td>
                <td>{item.roomNumber || '-'}</td>
                <td>{studentCountByClassSection.get(`${item.name}::${item.section || 'Unassigned'}`) || 0}</td>
                <td>{item.capacity || 0}</td>
                <td><span className={`admin-badge ${(item.status || 'Active').toLowerCase().replace(' ', '-')}`}>{item.status || 'Active'}</span></td>
                <td>
                  <div className="admin-row-actions">
                    <button type="button" className="row-action" onClick={() => openClassEdit(item)}>Edit</button>
                    <button type="button" className="row-action" onClick={() => toggleClassStatus(item.id)}>
                      {(item.status || 'Active') === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className="row-action" onClick={() => removeClass(item.id)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredClasses.length && (
              <tr>
                <td colSpan="8" className="attendance-empty">No class records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls('classes', classesPageData, 'classes')}

      {editingClassId && (
        <article className="admin-card admin-chart-section">
          <div className="section-header compact">
            <h3>Edit Class</h3>
          </div>
          <div className="admin-control-grid">
            <label>
              Class Name
              <input
                type="text"
                value={classEditDraft.name}
                onChange={(event) => setClassEditDraft((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>
            <label>
              Sub-School
              <select value={classEditDraft.section} onChange={(event) => setClassEditDraft((prev) => ({ ...prev, section: event.target.value }))}>
                {sectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Block Name
              <input
                type="text"
                value={classEditDraft.blockName}
                onChange={(event) => setClassEditDraft((prev) => ({ ...prev, blockName: event.target.value }))}
              />
            </label>
            <label>
              Room Number
              <input
                type="text"
                value={classEditDraft.roomNumber}
                onChange={(event) => setClassEditDraft((prev) => ({ ...prev, roomNumber: event.target.value }))}
              />
            </label>
            <label>
              Capacity
              <input
                type="number"
                min="1"
                value={classEditDraft.capacity}
                onChange={(event) => setClassEditDraft((prev) => ({ ...prev, capacity: event.target.value }))}
              />
            </label>
            <label>
              Status
              <select value={classEditDraft.status} onChange={(event) => setClassEditDraft((prev) => ({ ...prev, status: event.target.value }))}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </div>
          <div className="admin-actions">
            <button type="button" onClick={saveClassEdit}>Save Class</button>
            <button type="button" className="row-action" onClick={cancelClassEdit}>Cancel</button>
          </div>
        </article>
      )}
    </section>
    );
  };

  const renderSubjects = () => {
    const subjectsPageData = getPaginatedData('subjects', filteredSubjects);
    return (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Subjects</h2>
        <p>Register subjects for each class and sub-school combination already available in your system.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total Subjects</span><strong>{filteredSubjectStats.total}</strong></article>
        <article><span>Active</span><strong>{filteredSubjectStats.active}</strong></article>
        <article><span>Classes Covered</span><strong>{filteredSubjectStats.classes}</strong></article>
        <article><span>Sub-Schools</span><strong>{filteredSubjectStats.subSchools}</strong></article>
      </div>

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Register Subject</h3>
          <p>Assign a subject to a registered class and sub-school.</p>
        </div>

        {!showSubjectRegistrationForm && (
          <div className="admin-actions">
            <button type="button" onClick={() => setShowSubjectRegistrationForm(true)}>Register Subject</button>
          </div>
        )}

        {showSubjectRegistrationForm && (
          <>
            <div className="admin-control-grid">
              <label>
                Subject Name
                <input
                  type="text"
                  value={subjectRegistrationDraft.name}
                  onChange={(event) => setSubjectRegistrationDraft((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Civic Education"
                />
              </label>
              <label>
                Department
                <select
                  value={subjectRegistrationDraft.department}
                  onChange={(event) => setSubjectRegistrationDraft((prev) => ({ ...prev, department: event.target.value }))}
                >
                  {subjectDepartmentOptions.filter((item) => item !== 'All').map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Class
                <select
                  value={subjectRegistrationDraft.className}
                  onChange={(event) => setSubjectRegistrationDraft((prev) => ({ ...prev, className: event.target.value }))}
                >
                  <option value="">Select Class</option>
                  {subjectClassOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Sub-School
                <select
                  value={subjectRegistrationDraft.section}
                  onChange={(event) => setSubjectRegistrationDraft((prev) => ({ ...prev, section: event.target.value }))}
                >
                  {sectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Weekly Periods
                <input
                  type="number"
                  min="1"
                  value={subjectRegistrationDraft.weeklyPeriods}
                  onChange={(event) => setSubjectRegistrationDraft((prev) => ({ ...prev, weeklyPeriods: event.target.value }))}
                />
              </label>
              <label>
                Teacher
                <select
                  value={subjectRegistrationDraft.teacher}
                  onChange={(event) => setSubjectRegistrationDraft((prev) => ({ ...prev, teacher: event.target.value }))}
                >
                  {subjectTeacherOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Status
                <select
                  value={subjectRegistrationDraft.status}
                  onChange={(event) => setSubjectRegistrationDraft((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>

            <div className="admin-actions">
              <button type="button" onClick={enrollSubjectFromAdmin}>Register Subject</button>
              <button type="button" className="row-action" onClick={() => setShowSubjectRegistrationForm(false)}>Hide Form</button>
            </div>
          </>
        )}
      </article>

      <div className="admin-control-grid">
        <label>
          Search
          <input
            type="text"
            value={subjectSearchTerm}
            onChange={(event) => setSubjectSearchTerm(event.target.value)}
            placeholder="Search subject, class, teacher or sub-school"
          />
        </label>
        <label>
          Class
          <select value={subjectClassFilter} onChange={(event) => setSubjectClassFilter(event.target.value)}>
            <option>All</option>
            {subjectClassOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Registered Class Slot
          <select value={subjectClassSlotFilter} onChange={(event) => setSubjectClassSlotFilter(event.target.value)}>
            {subjectClassSlotOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Sub-School
          <select value={subjectSectionFilter} onChange={(event) => setSubjectSectionFilter(event.target.value)}>
            {subjectSectionOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Department
          <select value={subjectDepartmentFilter} onChange={(event) => setSubjectDepartmentFilter(event.target.value)}>
            {subjectDepartmentOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={subjectStatusFilter} onChange={(event) => setSubjectStatusFilter(event.target.value)}>
            {subjectStatusOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="admin-actions" style={{ marginBottom: 10 }}>
        <button type="button" className="row-action" onClick={resetSubjectFilters}>Clear Subject Filters</button>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Class</th>
              <th>Sub-School</th>
              <th>Department</th>
              <th>Teacher</th>
              <th>Weekly Periods</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjectsPageData.pageItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.className || '—'}</td>
                <td>{item.section || '—'}</td>
                <td>{item.department}</td>
                <td>{item.teacher || 'Unassigned'}</td>
                <td>{item.weeklyPeriods}</td>
                <td><span className={`admin-badge ${(item.status || 'Active').toLowerCase().replace(' ', '-')}`}>{item.status || 'Active'}</span></td>
                <td>
                  <div className="admin-row-actions">
                    <button type="button" className="row-action" onClick={() => openSubjectEdit(item)}>Edit</button>
                    <button type="button" className="row-action" onClick={() => toggleSubjectStatus(item.id)}>
                      {(item.status || 'Active') === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className="row-action" onClick={() => removeSubject(item.id)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredSubjects.length && (
              <tr>
                <td colSpan="8" className="attendance-empty">No subject records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls('subjects', subjectsPageData, 'subjects')}

      {editingSubjectId && (
        <article className="admin-card admin-chart-section">
          <div className="section-header compact">
            <h3>Edit Subject</h3>
          </div>
          <div className="admin-control-grid">
            <label>
              Subject Name
              <input type="text" value={subjectEditDraft.name} onChange={(event) => setSubjectEditDraft((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label>
              Department
              <select value={subjectEditDraft.department} onChange={(event) => setSubjectEditDraft((prev) => ({ ...prev, department: event.target.value }))}>
                {subjectDepartmentOptions.filter((item) => item !== 'All').map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Class
              <select value={subjectEditDraft.className} onChange={(event) => setSubjectEditDraft((prev) => ({ ...prev, className: event.target.value }))}>
                {subjectClassOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Sub-School
              <select value={subjectEditDraft.section} onChange={(event) => setSubjectEditDraft((prev) => ({ ...prev, section: event.target.value }))}>
                {sectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Weekly Periods
              <input type="number" min="1" value={subjectEditDraft.weeklyPeriods} onChange={(event) => setSubjectEditDraft((prev) => ({ ...prev, weeklyPeriods: event.target.value }))} />
            </label>
            <label>
              Teacher
              <select value={subjectEditDraft.teacher} onChange={(event) => setSubjectEditDraft((prev) => ({ ...prev, teacher: event.target.value }))}>
                {subjectTeacherOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Status
              <select value={subjectEditDraft.status} onChange={(event) => setSubjectEditDraft((prev) => ({ ...prev, status: event.target.value }))}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </div>
          <div className="admin-actions">
            <button type="button" onClick={saveSubjectEdit}>Save Subject</button>
            <button type="button" className="row-action" onClick={cancelSubjectEdit}>Cancel</button>
          </div>
        </article>
      )}
    </section>
    );
  };

  const renderDepartments = () => {
    const departmentsPageData = getPaginatedData('departments', filteredDepartments);
    return (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Departments</h2>
        <p>Register departments, assign heads, and manage department structure across sub-schools.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total Departments</span><strong>{filteredDepartmentStats.total}</strong></article>
        <article><span>Active</span><strong>{filteredDepartmentStats.active}</strong></article>
        <article><span>Sub-Schools</span><strong>{filteredDepartmentStats.subSchools}</strong></article>
        <article><span>Assigned Members</span><strong>{filteredDepartmentStats.totalMembers}</strong></article>
      </div>

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Register Department</h3>
          <p>Create department profiles and assign heads of department.</p>
        </div>

        {!showDepartmentForm && (
          <div className="admin-actions">
            <button type="button" onClick={() => setShowDepartmentForm(true)}>Register Department</button>
          </div>
        )}

        {showDepartmentForm && (
          <>
            <div className="admin-control-grid">
              <label>
                Department Name
                <input
                  type="text"
                  value={departmentDraft.name}
                  onChange={(event) => setDepartmentDraft((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. ICT & Innovation"
                />
              </label>
              <label>
                Head of Department
                <select value={departmentDraft.head} onChange={(event) => setDepartmentDraft((prev) => ({ ...prev, head: event.target.value }))}>
                  {departmentHeadOptions.filter((item) => item !== 'All').map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Sub-School
                <select value={departmentDraft.section} onChange={(event) => setDepartmentDraft((prev) => ({ ...prev, section: event.target.value }))}>
                  {sectionOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Office Location
                <input
                  type="text"
                  value={departmentDraft.office}
                  onChange={(event) => setDepartmentDraft((prev) => ({ ...prev, office: event.target.value }))}
                  placeholder="e.g. Block C • Room 02"
                />
              </label>
              <label>
                Status
                <select value={departmentDraft.status} onChange={(event) => setDepartmentDraft((prev) => ({ ...prev, status: event.target.value }))}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>

            <div className="admin-actions">
              <button type="button" onClick={enrollDepartmentFromAdmin}>Register Department</button>
              <button type="button" className="row-action" onClick={() => setShowDepartmentForm(false)}>Hide Form</button>
            </div>
          </>
        )}
      </article>

      <div className="admin-control-grid">
        <label>
          Search
          <input
            type="text"
            value={departmentSearchTerm}
            onChange={(event) => setDepartmentSearchTerm(event.target.value)}
            placeholder="Search department, head, sub-school or office"
          />
        </label>
        <label>
          Sub-School
          <select value={departmentSectionFilter} onChange={(event) => setDepartmentSectionFilter(event.target.value)}>
            {departmentSectionOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Head of Department
          <select value={departmentHeadFilter} onChange={(event) => setDepartmentHeadFilter(event.target.value)}>
            {departmentHeadOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={departmentStatusFilter} onChange={(event) => setDepartmentStatusFilter(event.target.value)}>
            {departmentStatusOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Head of Department</th>
              <th>Sub-School</th>
              <th>Office</th>
              <th>Members</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departmentsPageData.pageItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <select
                    value={item.head || 'Unassigned'}
                    onChange={(event) => setDepartments((prev) => prev.map((row) => (
                      row.id === item.id ? { ...row, head: event.target.value } : row
                    )))}
                  >
                    {departmentHeadOptions.filter((option) => option !== 'All').map((option) => <option key={option}>{option}</option>)}
                  </select>
                </td>
                <td>
                  <select
                    value={item.section || sectionOptions[0] || ''}
                    onChange={(event) => setDepartments((prev) => prev.map((row) => (
                      row.id === item.id ? { ...row, section: event.target.value } : row
                    )))}
                  >
                    {sectionOptions.map((section) => <option key={section}>{section}</option>)}
                  </select>
                </td>
                <td>{item.office || '—'}</td>
                <td>{departmentMemberCounts.get(`${item.name || 'Unassigned'}::${item.section || 'Unassigned'}`) || 0}</td>
                <td><span className={`admin-badge ${(item.status || 'Active').toLowerCase()}`}>{item.status || 'Active'}</span></td>
                <td>
                  <div className="admin-row-actions">
                    <button type="button" className="row-action" onClick={() => openDepartmentEdit(item)}>Edit</button>
                    <button type="button" className="row-action" onClick={() => toggleDepartmentStatus(item.id)}>
                      {(item.status || 'Active') === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className="row-action" onClick={() => removeDepartment(item.id)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredDepartments.length && (
              <tr>
                <td colSpan="7" className="attendance-empty">No departments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls('departments', departmentsPageData, 'departments')}

      {editingDepartmentId && (
        <article className="admin-card admin-chart-section">
          <div className="section-header compact">
            <h3>Edit Department</h3>
          </div>
          <div className="admin-control-grid">
            <label>
              Department Name
              <input type="text" value={departmentEditDraft.name} onChange={(event) => setDepartmentEditDraft((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label>
              Head of Department
              <select value={departmentEditDraft.head} onChange={(event) => setDepartmentEditDraft((prev) => ({ ...prev, head: event.target.value }))}>
                {departmentHeadOptions.filter((item) => item !== 'All').map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Sub-School
              <select value={departmentEditDraft.section} onChange={(event) => setDepartmentEditDraft((prev) => ({ ...prev, section: event.target.value }))}>
                {sectionOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Office Location
              <input type="text" value={departmentEditDraft.office} onChange={(event) => setDepartmentEditDraft((prev) => ({ ...prev, office: event.target.value }))} />
            </label>
            <label>
              Status
              <select value={departmentEditDraft.status} onChange={(event) => setDepartmentEditDraft((prev) => ({ ...prev, status: event.target.value }))}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </div>
          <div className="admin-actions">
            <button type="button" onClick={saveDepartmentEdit}>Save Department</button>
            <button type="button" className="row-action" onClick={cancelDepartmentEdit}>Cancel</button>
          </div>
        </article>
      )}
    </section>
    );
  };

  const renderTimetable = () => {
    const timetablePageData = getPaginatedData('timetable', filteredTimetableEntries);
    return (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Timetable</h2>
        <p>Assign class timetables for students and separate personal schedules for teachers/staff.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total Entries</span><strong>{filteredTimetableStats.total}</strong></article>
        <article><span>Class Timetables</span><strong>{filteredTimetableStats.classRows}</strong></article>
        <article><span>Personal Timetables</span><strong>{filteredTimetableStats.personalRows}</strong></article>
        <article><span>Linked People</span><strong>{filteredTimetableStats.teachersLinked + filteredTimetableStats.staffLinked}</strong></article>
      </div>

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Timetable Assignment</h3>
          <p>Create a class timetable or a personal timetable record.</p>
        </div>
        <div className="admin-actions">
          {!showTimetableForm ? (
            <button type="button" onClick={() => setShowTimetableForm(true)}>Assign Timetable</button>
          ) : (
            <button type="button" className="row-action" onClick={() => setShowTimetableForm(false)}>Close Form</button>
          )}
        </div>

        {showTimetableForm && (
          <>
            <div className="admin-control-grid">
              <label>
                Audience
                <select
                  value={timetableDraft.audienceType}
                  onChange={(event) => setTimetableDraft((prev) => ({ ...prev, audienceType: event.target.value }))}
                >
                  <option value="class">Class Timetable (Students)</option>
                  <option value="personal">Personal Timetable (Teacher/Staff)</option>
                </select>
              </label>

              <label>
                Day
                <select
                  value={timetableDraft.day}
                  onChange={(event) => setTimetableDraft((prev) => ({ ...prev, day: event.target.value }))}
                >
                  {TIMETABLE_DAYS.map((day) => <option key={day}>{day}</option>)}
                </select>
              </label>

              <label>
                Period
                <input
                  type="text"
                  value={timetableDraft.period}
                  onChange={(event) => setTimetableDraft((prev) => ({ ...prev, period: event.target.value }))}
                  placeholder="08:00 - 09:00"
                />
              </label>

              <label>
                Room / Location
                <input
                  type="text"
                  value={timetableDraft.room}
                  onChange={(event) => setTimetableDraft((prev) => ({ ...prev, room: event.target.value }))}
                  placeholder="Block • Room"
                />
              </label>

              {timetableDraft.audienceType === 'class' ? (
                <>
                  <label>
                    Class
                    <select
                      value={timetableDraft.className}
                      onChange={(event) => setTimetableDraft((prev) => ({ ...prev, className: event.target.value }))}
                    >
                      {timetableClassOptions.filter((item) => item !== 'All').map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>

                  <label>
                    Sub-School
                    <select
                      value={timetableDraft.section}
                      onChange={(event) => setTimetableDraft((prev) => ({ ...prev, section: event.target.value }))}
                    >
                      {sectionOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>

                  <label>
                    Subject
                    <select
                      value={timetableDraft.subject}
                      onChange={(event) => setTimetableDraft((prev) => ({ ...prev, subject: event.target.value }))}
                    >
                      <option value="">Select Registered Subject</option>
                      {timetableDraftSubjectOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>

                  <label>
                    Teacher
                    <select
                      value={timetableDraft.teacher}
                      onChange={(event) => setTimetableDraft((prev) => ({ ...prev, teacher: event.target.value }))}
                    >
                      {subjectTeacherOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Staff Role
                    <select
                      value={timetableDraft.staffRole}
                      onChange={(event) => setTimetableDraft((prev) => ({ ...prev, staffRole: event.target.value }))}
                    >
                      <option>Teacher</option>
                      <option>Staff</option>
                    </select>
                  </label>

                  <label>
                    Staff Name
                    <select
                      value={timetableDraft.staffName}
                      onChange={(event) => setTimetableDraft((prev) => ({ ...prev, staffName: event.target.value }))}
                    >
                      {timetableStaffOptions.filter((item) => item !== 'All').map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>

                  <label className="span-2">
                    Activity / Task
                    <input
                      type="text"
                      value={timetableDraft.activity}
                      onChange={(event) => setTimetableDraft((prev) => ({ ...prev, activity: event.target.value }))}
                      placeholder="Library Supervision"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="admin-actions">
              <button type="button" onClick={enrollTimetableEntry}>Save Timetable Assignment</button>
            </div>
          </>
        )}
      </article>

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Filters</h3>
        </div>
        <div className="admin-inline-controls">
          <label>
            Audience
            <select value={timetableAudienceFilter} onChange={(event) => setTimetableAudienceFilter(event.target.value)}>
              {timetableAudienceOptions.map((option) => <option key={option}>{option === 'class' ? 'Class' : option === 'personal' ? 'Personal' : option}</option>)}
            </select>
          </label>
          <label>
            Day
            <select value={timetableDayFilter} onChange={(event) => setTimetableDayFilter(event.target.value)}>
              <option>All</option>
              {TIMETABLE_DAYS.map((day) => <option key={day}>{day}</option>)}
            </select>
          </label>
          <label>
            Class
            <select value={timetableClassFilter} onChange={(event) => setTimetableClassFilter(event.target.value)}>
              {timetableClassOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Sub-School
            <select value={timetableSectionFilter} onChange={(event) => setTimetableSectionFilter(event.target.value)}>
              {timetableSectionOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Staff Role
            <select value={timetableStaffRoleFilter} onChange={(event) => setTimetableStaffRoleFilter(event.target.value)}>
              {timetableStaffRoleOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Staff Name
            <select value={timetableStaffFilter} onChange={(event) => setTimetableStaffFilter(event.target.value)}>
              {timetableStaffOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </article>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Audience</th>
              <th>Day</th>
              <th>Period</th>
              <th>Target</th>
              <th>Details</th>
              <th>Room</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {timetablePageData.pageItems.map((item) => (
              <tr key={item.id}>
                <td>{item.audienceType === 'class' ? 'Class' : 'Personal'}</td>
                <td>{item.day}</td>
                <td>{item.period}</td>
                <td>
                  {item.audienceType === 'class'
                    ? `${item.className} • ${item.section || 'Unassigned'}`
                    : `${item.staffName} • ${item.staffRole || 'Staff'}`}
                </td>
                <td>
                  {item.audienceType === 'class'
                    ? `${item.subject} • ${item.teacher || 'Unassigned'}`
                    : item.activity}
                </td>
                <td>{item.room || '-'}</td>
                <td>
                  <div className="admin-row-actions">
                    <button type="button" className="row-action" onClick={() => openTimetableEdit(item)}>Edit</button>
                    <button type="button" className="row-action danger" onClick={() => removeTimetableEntry(item.id)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {!timetablePageData.pageItems.length && (
              <tr>
                <td colSpan="7" className="attendance-empty">No timetable records found for the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls('timetable', timetablePageData, 'timetable records')}

      {editingTimetableId && (
        <article className="admin-card admin-chart-section">
          <div className="section-header compact">
            <h3>Edit Timetable Entry</h3>
          </div>
          <div className="admin-control-grid">
            <label>
              Audience
              <select value={timetableEditDraft.audienceType} onChange={(event) => setTimetableEditDraft((prev) => ({ ...prev, audienceType: event.target.value }))}>
                <option value="class">Class Timetable</option>
                <option value="personal">Personal Timetable</option>
              </select>
            </label>
            <label>
              Day
              <select value={timetableEditDraft.day} onChange={(event) => setTimetableEditDraft((prev) => ({ ...prev, day: event.target.value }))}>
                {TIMETABLE_DAYS.map((day) => <option key={day}>{day}</option>)}
              </select>
            </label>
            <label>
              Period
              <input type="text" value={timetableEditDraft.period} onChange={(event) => setTimetableEditDraft((prev) => ({ ...prev, period: event.target.value }))} />
            </label>
            <label>
              Room / Location
              <input type="text" value={timetableEditDraft.room} onChange={(event) => setTimetableEditDraft((prev) => ({ ...prev, room: event.target.value }))} />
            </label>

            {timetableEditDraft.audienceType === 'class' ? (
              <>
                <label>
                  Class
                  <select value={timetableEditDraft.className} onChange={(event) => setTimetableEditDraft((prev) => ({ ...prev, className: event.target.value }))}>
                    {timetableClassOptions.filter((item) => item !== 'All').map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  Sub-School
                  <select value={timetableEditDraft.section} onChange={(event) => setTimetableEditDraft((prev) => ({ ...prev, section: event.target.value }))}>
                    {sectionOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  Subject
                  <select value={timetableEditDraft.subject} onChange={(event) => setTimetableEditDraft((prev) => ({ ...prev, subject: event.target.value }))}>
                    <option value="">Select Registered Subject</option>
                    {timetableEditSubjectOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  Teacher
                  <select value={timetableEditDraft.teacher} onChange={(event) => setTimetableEditDraft((prev) => ({ ...prev, teacher: event.target.value }))}>
                    {subjectTeacherOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
              </>
            ) : (
              <>
                <label>
                  Staff Role
                  <select value={timetableEditDraft.staffRole} onChange={(event) => setTimetableEditDraft((prev) => ({ ...prev, staffRole: event.target.value }))}>
                    <option>Teacher</option>
                    <option>Staff</option>
                  </select>
                </label>
                <label>
                  Staff Name
                  <select value={timetableEditDraft.staffName} onChange={(event) => setTimetableEditDraft((prev) => ({ ...prev, staffName: event.target.value }))}>
                    {timetableStaffOptions.filter((item) => item !== 'All').map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="span-2">
                  Activity / Task
                  <input type="text" value={timetableEditDraft.activity} onChange={(event) => setTimetableEditDraft((prev) => ({ ...prev, activity: event.target.value }))} />
                </label>
              </>
            )}
          </div>
          <div className="admin-actions">
            <button type="button" onClick={saveTimetableEdit}>Save Timetable</button>
            <button type="button" className="row-action" onClick={cancelTimetableEdit}>Cancel</button>
          </div>
        </article>
      )}
    </section>
    );
  };

  const renderAttendance = () => {
    const attendancePageData = getPaginatedData('attendance', filteredPlatformAttendanceRows);
    return (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Attendance</h2>
        <p>Percentage attendance overview for all users currently on the platform.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total Users</span><strong>{filteredAttendanceSummary.totalUsers}</strong></article>
        <article><span>Excellent (≥90%)</span><strong>{filteredAttendanceSummary.excellent}</strong></article>
        <article><span>Good (75%-89%)</span><strong>{filteredAttendanceSummary.good}</strong></article>
        <article><span>Overall Rate</span><strong>{filteredAttendanceSummary.rate}%</strong></article>
      </div>

      <div className="admin-control-grid">
        <label>
          Search
          <input
            type="text"
            value={attendanceSearchTerm}
            onChange={(event) => setAttendanceSearchTerm(event.target.value)}
            placeholder="Search user, role or sub-school"
          />
        </label>
        <label>
          Role
          <select value={attendanceRoleFilter} onChange={(event) => setAttendanceRoleFilter(event.target.value)}>
            {attendanceRoleOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Sub-School
          <select value={attendanceSectionFilter} onChange={(event) => setAttendanceSectionFilter(event.target.value)}>
            {attendanceSectionOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Attendance Band
          <select value={attendanceBandFilter} onChange={(event) => setAttendanceBandFilter(event.target.value)}>
            <option>All</option>
            <option>Excellent</option>
            <option>Good</option>
            <option>At Risk</option>
          </select>
        </label>
        <label>
          Sort By
          <select value={attendanceSortBy} onChange={(event) => setAttendanceSortBy(event.target.value)}>
            <option>Highest</option>
            <option>Lowest</option>
            <option>Name</option>
          </select>
        </label>
      </div>

      <div className="admin-actions" style={{ marginBottom: 10 }}>
        <button type="button" className="row-action" onClick={resetAttendanceFilters}>Clear Attendance Filters</button>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Sub-School</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {attendancePageData.pageItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.role}</td>
                <td>{item.section}</td>
                <td>{item.attendancePercent}%</td>
              </tr>
            ))}
            {!attendancePageData.pageItems.length && (
              <tr>
                <td colSpan="4" className="attendance-empty">No user attendance percentages available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls('attendance', attendancePageData, 'attendance records')}
    </section>
    );
  };

  const renderExams = () => {
    const examsPageData = getPaginatedData('exams', filteredExams);
    const allSequenceOptions = Array.from(new Set([
      ...academicTermStructure.flatMap((term) => term.sequences || []),
      ...exams.map((item) => item.sequence).filter(Boolean)
    ]));

    return (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Exams</h2>
        <p>Schedule and publish exams by term and sequence with controlled start and latest dates.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total</span><strong>{examSummary.total}</strong></article>
        <article><span>Scheduled</span><strong>{examSummary.scheduled}</strong></article>
        <article><span>Published</span><strong>{examSummary.published}</strong></article>
        <article><span>Closed</span><strong>{examSummary.closed}</strong></article>
      </div>

      <article className="admin-card admin-chart-section">
        <div className="section-header compact">
          <h3>Schedule Exam</h3>
          <p>Create exams only by class, term and sequence, then publish when ready.</p>
        </div>

        {!showExamForm ? (
          <div className="admin-actions">
            <button type="button" onClick={() => setShowExamForm(true)}>Schedule Exam</button>
          </div>
        ) : (
          <>
            <div className="admin-control-grid">
              <label>
                Exam Title
                <input
                  type="text"
                  value={examDraft.title}
                  onChange={(event) => setExamDraft((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g. Term 2 Sequence 1 Mathematics"
                />
              </label>
              <label>
                Class
                <select value={examDraft.className} onChange={(event) => setExamDraft((prev) => ({ ...prev, className: event.target.value }))}>
                  {examClassOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Subject
                <input
                  type="text"
                  value={examDraft.subject}
                  onChange={(event) => setExamDraft((prev) => ({ ...prev, subject: event.target.value }))}
                  placeholder="Subject name"
                />
              </label>
              <label>
                Term
                <select
                  value={examDraft.term}
                  onChange={(event) => setExamDraft((prev) => ({
                    ...prev,
                    term: event.target.value,
                    sequence: (academicTermStructure.find((term) => term.name === event.target.value)?.sequences || [])[0] || prev.sequence
                  }))}
                >
                  {examTermOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Sequence
                <select value={examDraft.sequence} onChange={(event) => setExamDraft((prev) => ({ ...prev, sequence: event.target.value }))}>
                  {examSequenceOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                Start Date
                <input type="date" value={examDraft.startDate} onChange={(event) => setExamDraft((prev) => ({ ...prev, startDate: event.target.value }))} />
              </label>
              <label>
                Latest Date
                <input type="date" value={examDraft.latestDate} onChange={(event) => setExamDraft((prev) => ({ ...prev, latestDate: event.target.value }))} />
              </label>
            </div>
            <div className="admin-actions">
              <button type="button" onClick={scheduleExamFromAdmin}>Save Schedule</button>
              <button type="button" className="row-action" onClick={() => setShowExamForm(false)}>Hide Form</button>
            </div>
          </>
        )}
      </article>

      <div className="admin-control-grid">
        <label>
          Search
          <input
            type="text"
            value={examSearchTerm}
            onChange={(event) => setExamSearchTerm(event.target.value)}
            placeholder="Search title, class, subject, term or sequence"
          />
        </label>
        <label>
          Class
          <select value={examClassFilter} onChange={(event) => setExamClassFilter(event.target.value)}>
            <option>All</option>
            {examClassOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Term
          <select value={examTermFilter} onChange={(event) => setExamTermFilter(event.target.value)}>
            <option>All</option>
            {examTermOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Sequence
          <select value={examSequenceFilter} onChange={(event) => setExamSequenceFilter(event.target.value)}>
            <option>All</option>
            {allSequenceOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={examStatusFilter} onChange={(event) => setExamStatusFilter(event.target.value)}>
            <option>All</option>
            <option>Scheduled</option>
            <option>Published</option>
            <option>Closed</option>
          </select>
        </label>
      </div>

      <div className="admin-actions" style={{ marginBottom: 10 }}>
        <button type="button" className="row-action" onClick={resetExamFilters}>Clear Exam Filters</button>
        <button type="button" className="row-action" onClick={() => exportCsv(filteredExams, 'admin-exams.csv')}>Export Exams CSV</button>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Term</th>
              <th>Sequence</th>
              <th>Start Date</th>
              <th>Latest Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {examsPageData.pageItems.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.className}</td>
                <td>{item.subject}</td>
                <td>{item.term || '-'}</td>
                <td>{item.sequence || '-'}</td>
                <td>{item.startDate || '-'}</td>
                <td>{item.latestDate || '-'}</td>
                <td><span className={`admin-badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="row-action"
                      onClick={() => publishExamById(item.id)}
                      disabled={item.status === 'Published' || item.status === 'Closed'}
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      className="row-action"
                      onClick={() => closeExamById(item.id)}
                      disabled={item.status === 'Closed'}
                    >
                      Close
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!examsPageData.pageItems.length && (
              <tr>
                <td colSpan="9" className="attendance-empty">No exam records available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls('exams', examsPageData, 'exams')}
    </section>
    );
  };

  const renderResults = () => {
    const parsedTopCount = Number.parseInt(String(resultTopCountInput || '').trim(), 10);
    const hasTopFilter = Number.isFinite(parsedTopCount) && parsedTopCount > 0;
    const rankedStudentsSource = hasTopFilter ? topSchoolStudentRows : filteredRankedStudentRowsWithSchoolRank;
    const resultsPageData = getPaginatedData('results-ranked', rankedStudentsSource);

    return (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Results</h2>
        <p>Track whole-school performance, subschool and class outcomes, then generate ranked report cards automatically.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Whole School Average</span><strong>{schoolPerformanceStats.average}/20</strong></article>
        <article><span>Pass Rate</span><strong>{schoolPerformanceStats.passRate}%</strong></article>
        <article><span>Failed Rate</span><strong>{schoolPerformanceStats.failedRate}%</strong></article>
        <article><span>Top Performer</span><strong>{schoolPerformanceStats.topStudent}</strong></article>
      </div>

      <div className="admin-card results-control-card">
        <div className="section-header compact">
          <h3>Performance Filters & Actions</h3>
          <p>Filter by sub-school, class and band. Top-student input shows top N students in the entire school.</p>
        </div>
        <div className="admin-control-grid">
        <label>
          Sub-School
          <select value={resultSectionFilter} onChange={(event) => setResultSectionFilter(event.target.value)}>
            {resultSectionOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Class
          <select value={resultClassFilter} onChange={(event) => setResultClassFilter(event.target.value)}>
            {resultClassOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Performance Band
          <select value={resultBandFilter} onChange={(event) => setResultBandFilter(event.target.value)}>
            <option>All</option>
            <option>Excellent</option>
            <option>Good</option>
            <option>Average</option>
            <option>At Risk</option>
          </select>
        </label>
        <label>
          Search Student
          <input
            type="text"
            value={resultSearchTerm}
            onChange={(event) => setResultSearchTerm(event.target.value)}
            placeholder="Search by name, matricule, class or parent"
          />
        </label>
        <label>
          Top Students (Entire School)
          <input
            type="number"
            min="1"
            max="500"
            value={resultTopCountInput}
            onChange={(event) => setResultTopCountInput(event.target.value)}
            placeholder="Enter number e.g. 20"
          />
        </label>
        <button type="button" className="results-print-btn" onClick={printClassReportCards}>Print Class Report Cards</button>
        <button type="button" className="results-print-btn" onClick={() => publishReportCardsToPortal(rankedStudentsSource)}>Publish Report Cards</button>
        <button type="button" className="results-download-btn" onClick={exportClassPerformancePdf}>Download Class Performance PDF</button>
        <button type="button" className="results-download-btn" onClick={exportSchoolPerformancePdf}>Download School Performance Report</button>
        <button
          type="button"
          className="row-action"
          onClick={() => {
            setResultSectionFilter('All');
            setResultClassFilter('All');
            setResultBandFilter('All');
            setResultSearchTerm('');
            setResultTopCountInput('');
          }}
        >
          Reset Filters
        </button>
        </div>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Filtered Students</span><strong>{filteredResultSummary.students}</strong></article>
        <article><span>Filtered Average</span><strong>{filteredResultSummary.average}/20</strong></article>
        <article><span>Filtered Pass Rate</span><strong>{filteredResultSummary.passRate}%</strong></article>
        <article><span>Filtered Failed Rate</span><strong>{filteredResultSummary.failedRate}%</strong></article>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sub-School</th>
              <th>Students</th>
              <th>Classes</th>
              <th>Average</th>
              <th>Pass Rate</th>
              <th>Failed Rate</th>
              <th>Top Student</th>
            </tr>
          </thead>
          <tbody>
            {filteredSectionPerformanceStats.map((item) => (
              <tr key={item.section}>
                <td>{item.section}</td>
                <td>{item.students}</td>
                <td>{item.classes}</td>
                <td>{item.average}/20</td>
                <td>{item.passRate}%</td>
                <td>{item.failedRate}%</td>
                <td>{item.topStudent}</td>
              </tr>
            ))}
            {!filteredSectionPerformanceStats.length && (
              <tr>
                <td colSpan="7" className="attendance-empty">No subschool performance records available for this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Class</th>
              <th>Sub-School</th>
              <th>Class Teacher</th>
              <th>Students</th>
              <th>Average</th>
              <th>Pass Rate</th>
              <th>Failed Rate</th>
              <th>Top Student</th>
            </tr>
          </thead>
          <tbody>
            {filteredClassPerformanceStats.map((item) => (
              <tr key={item.classKey}>
                <td>{item.className}</td>
                <td>{item.section}</td>
                <td>{item.classTeacher}</td>
                <td>{item.students}</td>
                <td>{item.average}/20</td>
                <td>{item.passRate}%</td>
                <td>{item.failedRate}%</td>
                <td>{item.topStudent}</td>
              </tr>
            ))}
            {!filteredClassPerformanceStats.length && (
              <tr>
                <td colSpan="8" className="attendance-empty">No class performance records available for this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>School Rank</th>
              <th>Class Rank</th>
              <th>Student</th>
              <th>Matricule</th>
              <th>Class</th>
              <th>Sub-School</th>
              <th>Average</th>
              <th>Grade</th>
              <th>Band</th>
              <th>Class Teacher</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {resultsPageData.pageItems.map((item) => (
              <tr key={item.id}>
                <td>{item.schoolRank ? `#${item.schoolRank}` : '-'}</td>
                <td>{item.rank}</td>
                <td>{item.name}</td>
                <td>{item.matricule}</td>
                <td>{item.className}</td>
                <td>{item.section}</td>
                <td>{item.average.toFixed(1)}/20</td>
                <td>{item.grade}</td>
                <td>{item.band}</td>
                <td>{item.classTeacher}</td>
                <td>
                  <button type="button" className="row-action results-print-row-btn" onClick={() => printStudentReportCard(item)}>
                    Print Report Card
                  </button>
                </td>
              </tr>
            ))}
            {!resultsPageData.pageItems.length && (
              <tr>
                <td colSpan="11" className="attendance-empty">No ranked student performance found for this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls('results-ranked', resultsPageData, 'ranked students')}
    </section>
    );
  };

  const renderInvoices = () => {
    const invoicesPageData = getPaginatedData('invoices', filteredInvoices);
    return (
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
            {invoicesPageData.pageItems.map((item) => (
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
      {renderPaginationControls('invoices', invoicesPageData, 'invoices')}
    </section>
    );
  };

  const renderAnnouncements = () => {
    const announcementsPageData = getPaginatedData('announcements', announcements);
    const today = new Date().toISOString().slice(0, 10);
    const announcementSummary = {
      total: announcements.length,
      today: announcements.filter((item) => String(item.date || '') === today).length,
      urgent: announcements.filter((item) => String(item.type || '').toLowerCase() === 'emergency').length,
      audiences: new Set(announcements.map((item) => item.audience).filter(Boolean)).size
    };

    return (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Announcements</h2>
        <p>Broadcast policy updates and critical notices to all school actors.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total Announcements</span><strong>{announcementSummary.total}</strong></article>
        <article><span>Posted Today</span><strong>{announcementSummary.today}</strong></article>
        <article><span>Emergency</span><strong>{announcementSummary.urgent}</strong></article>
        <article><span>Audience Groups</span><strong>{announcementSummary.audiences}</strong></article>
      </div>

      <div className="admin-actions" style={{ marginBottom: 10 }}>
        <button type="button" className="row-action" onClick={() => exportCsv(announcements, 'admin-announcements.csv')}>Export Announcements CSV</button>
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

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Audience</th>
              <th>Date</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {announcementsPageData.pageItems.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.type}</td>
                <td>{item.audience}</td>
                <td>{item.date}</td>
                <td>{item.message}</td>
              </tr>
            ))}
            {!announcementsPageData.pageItems.length && (
              <tr>
                <td colSpan="5" className="attendance-empty">No announcements available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls('announcements', announcementsPageData, 'announcements')}
    </section>
    );
  };

  const renderEvents = () => {
    const eventsPageData = getPaginatedData('events', events);
    return (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Events & Calendar</h2>
        <p>Publish school events, monitor scheduling conflicts and organizer ownership.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Total Events</span><strong>{eventSummary.total}</strong></article>
        <article><span>Upcoming</span><strong>{eventSummary.upcoming}</strong></article>
        <article><span>Categories</span><strong>{eventSummary.categories}</strong></article>
        <article><span>Organizers</span><strong>{eventSummary.organizers}</strong></article>
      </div>

      <div className="admin-actions" style={{ marginBottom: 10 }}>
        <button type="button" className="row-action" onClick={() => exportCsv(events, 'admin-events.csv')}>Export Events CSV</button>
      </div>

      <div className="admin-compose-grid compact">
        <label>
          Event Title
          <input
            type="text"
            value={newEvent.title}
            onChange={(event) => setNewEvent((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="e.g. Mid-Term PTA Meeting"
          />
        </label>
        <label>
          Date
          <input
            type="date"
            value={newEvent.date}
            onChange={(event) => setNewEvent((prev) => ({ ...prev, date: event.target.value }))}
          />
        </label>
        <label>
          Category
          <select
            value={newEvent.category}
            onChange={(event) => setNewEvent((prev) => ({ ...prev, category: event.target.value }))}
          >
            <option>Academic</option>
            <option>Community</option>
            <option>Guidance</option>
            <option>Sports</option>
            <option>Cultural</option>
          </select>
        </label>
        <label>
          Organizer
          <input
            type="text"
            value={newEvent.organizer}
            onChange={(event) => setNewEvent((prev) => ({ ...prev, organizer: event.target.value }))}
            placeholder="Administration"
          />
        </label>
        <button type="button" onClick={addEvent}>Add Event</button>
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
            {eventsPageData.pageItems.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.date}</td>
                <td>{item.category}</td>
                <td>{item.organizer}</td>
              </tr>
            ))}
            {!eventsPageData.pageItems.length && (
              <tr>
                <td colSpan="4" className="attendance-empty">No event records available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls('events', eventsPageData, 'events')}
    </section>
    );
  };

  const renderMessages = () => {
    return <Messages />;
  };

  const renderIdCards = () => {
    const selectedClassCount = idCardClassFilter === 'All'
      ? new Set(idCardRows.map((item) => item.className).filter(Boolean)).size
      : 1;
    const selectedSectionCount = idCardSectionFilter === 'All'
      ? new Set(idCardRows.map((item) => item.section).filter(Boolean)).size
      : 1;

    return (
      <section className="admin-panel">
        <div className="section-header">
          <h2>ID Cards</h2>
          <p>Generate professional front-and-back student ID cards and print full class batches at once.</p>
        </div>

        <div className="admin-kpi-row compact">
          <article><span>Cards in Preview</span><strong>{idCardRows.length}</strong></article>
          <article><span>Class Scope</span><strong>{selectedClassCount}</strong></article>
          <article><span>Sub-School Scope</span><strong>{selectedSectionCount}</strong></article>
          <article><span>Academic Year</span><strong>{schoolProfile.currentSession}</strong></article>
        </div>

        <div className="admin-control-grid">
          <label>
            Class
            <select value={idCardClassFilter} onChange={(event) => setIdCardClassFilter(event.target.value)}>
              {idCardClassOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Sub-School
            <select value={idCardSectionFilter} onChange={(event) => setIdCardSectionFilter(event.target.value)}>
              {idCardSectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <div className="admin-actions" style={{ marginBottom: 12 }}>
          <button type="button" className="results-print-btn" onClick={printIdCards}>Print Full Class ID Cards</button>
        </div>

        {idCardClassFilter === 'All' && (
          <p className="attendance-empty" style={{ marginBottom: 12 }}>
            Select a class first to enable full-class batch printing.
          </p>
        )}

        <div className="admin-id-preview-grid">
          {idCardRows.map((student) => (
            <article key={student.id} className="admin-id-card-pair">
              <div className="admin-id-card admin-id-front">
                <div className="admin-id-header">
                  <img src={schoolProfile.logoUrl} alt="School logo" />
                  <strong>{String(schoolProfile.schoolName || 'SUCCESS ACADEMY').toUpperCase()}</strong>
                </div>
                <div className="admin-id-body">
                  <img className="admin-id-photo" src={student.avatar} alt={student.name} />
                  <div className="admin-id-meta">
                    <h4>{student.name}</h4>
                    <p><span>Matricule:</span> {student.idNumber}</p>
                    <p><span>Class:</span> {student.className}</p>
                    <p><span>Sub-School:</span> {student.section}</p>
                    <p><span>Date of Birth:</span> {formatDisplayDate(student.dateOfBirth, '-')}</p>
                    <p><span>Academic Year:</span> {schoolProfile.currentSession}</p>
                  </div>
                </div>
                <div className="admin-id-signature">
                  <small>Student Signature</small>
                  <div className="line" />
                </div>
              </div>

              <div className="admin-id-card admin-id-back">
                <img className="admin-id-watermark" src={schoolProfile.logoUrl} alt="" />
                <div className="admin-id-back-top">
                  <img className="admin-id-qr" src={student.qrUrl} alt={`${student.name} QR`} />
                  <p>Scan to Verify Student ID</p>
                </div>
                <h3>ID: {student.idNumber}</h3>
                <div className="admin-id-contact">
                  <strong>{String(schoolProfile.schoolName || 'SUCCESS ACADEMY').toUpperCase()}</strong>
                  <p>{schoolProfile.address || 'P.O. BOX 123'}</p>
                  <p>{schoolProfile.city || 'Bamenda'}</p>
                  <p>Tel: {schoolProfile.contactPhone || '+237 677000000'}</p>
                  <p>Email: {schoolProfile.contactEmail || 'info@school.edu'}</p>
                </div>
              </div>
            </article>
          ))}

          {!idCardRows.length && (
            <article className="admin-card">
              <p className="attendance-empty" style={{ margin: 0 }}>
                No students found for the selected class/sub-school filters.
              </p>
            </article>
          )}
        </div>
      </section>
    );
  };

  const renderNotifications = () => {
    const notificationsPageData = getPaginatedData('notifications', notifications);
    return (
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
        {notificationsPageData.pageItems.map((item) => (
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
      {renderPaginationControls('notifications', notificationsPageData, 'notifications')}
    </section>
    );
  };

  const renderReports = () => {
    const isCurrentAcademicYear = reportAcademicYearFilter === (schoolProfile.currentSession || reportAcademicYearFilter);
    const academicRows = filteredRankedStudentRowsWithSchoolRank
      .filter(() => isCurrentAcademicYear)
      .filter((item) => {
        const sectionMatch = reportForms.academic.section === 'All' || item.section === reportForms.academic.section;
        const classMatch = reportForms.academic.className === 'All' || item.className === reportForms.academic.className;
        return sectionMatch && classMatch;
      })
      .map((item) => ({
        AcademicYear: reportAcademicYearFilter,
        Student: item.name,
        Matricule: item.matricule,
        Class: item.className,
        Section: item.section,
        Average: Number(item.average || 0).toFixed(1),
        Grade: item.grade,
        Rank: reportForms.academic.includeRanking ? item.rank : ''
      }));

    const financeRows = yearScopedFinanceInvoices
      .filter((item) => {
        const statusMatch = reportForms.finance.status === 'All' || item.status === reportForms.finance.status;
        const overdueMatch = !reportForms.finance.includeOverdueOnly || (item.status !== 'Paid' && String(item.dueDate || '') < new Date().toISOString().slice(0, 10));
        return statusMatch && overdueMatch;
      })
      .map((item) => ({
        AcademicYear: reportAcademicYearFilter,
        Invoice: item.invoiceNo,
        Student: item.student,
        Class: item.className,
        Amount: item.amount,
        DueDate: item.dueDate,
        Status: item.status
      }));

    const filteredGeneratedReports = generatedReports.filter((item) => (
      item.academicYear === reportAcademicYearFilter
    ));

    return (
      <section className="admin-panel">
        <div className="section-header">
          <h2>Reports</h2>
          <p>Generate school-wide operational, academic and financial executive reports.</p>
        </div>

        <div className="admin-kpi-row">
          <article><span>Attendance Rate</span><strong>{yearScopedReportData.attendanceRate}%</strong></article>
          <article><span>Result Average</span><strong>{yearScopedReportData.resultAverage}/20</strong></article>
          <article><span>Total Billed</span><strong>{formatCurrency(yearScopedReportData.billed)}</strong></article>
          <article><span>Outstanding</span><strong>{formatCurrency(yearScopedReportData.outstanding)}</strong></article>
        </div>

        <div className="admin-control-grid" style={{ marginBottom: 12 }}>
          <label>
            Academic Year
            <select
              value={reportAcademicYearFilter}
              onChange={(event) => setReportAcademicYearFilter(event.target.value)}
            >
              {reportAcademicYearOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-report-forms">
          <article className="admin-report-card">
            <div className="section-header compact">
              <h3>Executive Summary Form</h3>
              <p>Produce leadership-ready snapshots for oversight meetings.</p>
            </div>
            <div className="admin-control-grid">
              <label>
                Report Period
                <select
                  value={reportForms.executive.period}
                  onChange={(event) => updateReportForm('executive', 'period', event.target.value)}
                >
                  <option>This Week</option>
                  <option>This Term</option>
                  <option>This Academic Year</option>
                </select>
              </label>
              <label>
                Output Format
                <select
                  value={reportForms.executive.output}
                  onChange={(event) => updateReportForm('executive', 'output', event.target.value)}
                >
                  <option>PDF</option>
                  <option>CSV</option>
                </select>
              </label>
            </div>
            <div className="admin-actions">
              <button
                type="button"
                onClick={() => {
                  if (reportForms.executive.output === 'PDF') {
                    exportReportsPdf();
                  } else {
                    exportCsv(
                      [{
                        academicYear: reportAcademicYearFilter,
                        period: reportForms.executive.period,
                        attendanceRate: `${yearScopedReportData.attendanceRate}%`,
                        resultAverage: yearScopedReportData.resultAverage,
                        billed: yearScopedReportData.billed,
                        collections: yearScopedReportData.collections,
                        outstanding: yearScopedReportData.outstanding
                      }],
                      'admin-executive-summary.csv'
                    );
                  }
                  logGeneratedReport('Executive Summary', reportForms.executive.output, `${reportForms.executive.period} • ${reportAcademicYearFilter}`);
                  setNotice(`Executive summary ${reportForms.executive.output} generated successfully.`);
                }}
              >
                Generate Executive Report
              </button>
            </div>
          </article>

          <article className="admin-report-card">
            <div className="section-header compact">
              <h3>Academic Performance Form</h3>
              <p>Prepare class and section result performance reports.</p>
            </div>
            {!isCurrentAcademicYear && (
              <p className="attendance-empty" style={{ marginBottom: 10 }}>
                Academic score archive is only available for {schoolProfile.currentSession}. Select it to generate full academic performance rows.
              </p>
            )}
            <div className="admin-control-grid">
              <label>
                Section
                <select
                  value={reportForms.academic.section}
                  onChange={(event) => updateReportForm('academic', 'section', event.target.value)}
                >
                  {sectionOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                Class
                <select
                  value={reportForms.academic.className}
                  onChange={(event) => updateReportForm('academic', 'className', event.target.value)}
                >
                  {classOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                Output Format
                <select
                  value={reportForms.academic.output}
                  onChange={(event) => updateReportForm('academic', 'output', event.target.value)}
                >
                  <option>CSV</option>
                  <option>PDF</option>
                </select>
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={reportForms.academic.includeRanking}
                  onChange={(event) => updateReportForm('academic', 'includeRanking', event.target.checked)}
                />
                Include ranking fields
              </label>
            </div>
            <div className="admin-actions">
              <button
                type="button"
                onClick={() => {
                  if (!academicRows.length) {
                    alert('No academic rows found for the selected filters.');
                    return;
                  }
                  if (reportForms.academic.output === 'PDF') {
                    exportSchoolPerformancePdf();
                  } else {
                    exportCsv(academicRows, 'admin-academic-performance.csv');
                  }
                  const scope = `${reportForms.academic.section} • ${reportForms.academic.className} • ${reportAcademicYearFilter}`;
                  logGeneratedReport('Academic Performance', reportForms.academic.output, scope);
                  setNotice(`Academic report ${reportForms.academic.output} generated for ${scope}.`);
                }}
              >
                Generate Academic Report
              </button>
            </div>
          </article>

          <article className="admin-report-card">
            <div className="section-header compact">
              <h3>Finance Reconciliation Form</h3>
              <p>Compile billing, paid, and overdue invoice records.</p>
            </div>
            <div className="admin-control-grid">
              <label>
                Invoice Status
                <select
                  value={reportForms.finance.status}
                  onChange={(event) => updateReportForm('finance', 'status', event.target.value)}
                >
                  <option>All</option>
                  <option>Paid</option>
                  <option>Unpaid</option>
                </select>
              </label>
              <label>
                Output Format
                <select
                  value={reportForms.finance.output}
                  onChange={(event) => updateReportForm('finance', 'output', event.target.value)}
                >
                  <option>CSV</option>
                  <option>PDF</option>
                </select>
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={reportForms.finance.includeOverdueOnly}
                  onChange={(event) => updateReportForm('finance', 'includeOverdueOnly', event.target.checked)}
                />
                Include overdue invoices only
              </label>
            </div>
            <div className="admin-actions">
              <button
                type="button"
                onClick={() => {
                  if (!financeRows.length) {
                    alert('No finance rows found for the selected filters.');
                    return;
                  }
                  if (reportForms.finance.output === 'PDF') {
                    exportFinanceReportPdf();
                  } else {
                    exportCsv(financeRows, 'admin-finance-reconciliation.csv');
                  }
                  const scope = reportForms.finance.includeOverdueOnly
                    ? `Overdue Only • ${reportAcademicYearFilter}`
                    : `${reportForms.finance.status} Invoices • ${reportAcademicYearFilter}`;
                  logGeneratedReport('Finance Reconciliation', reportForms.finance.output, scope);
                  setNotice(`Finance report ${reportForms.finance.output} generated (${scope}).`);
                }}
              >
                Generate Finance Report
              </button>
            </div>
          </article>
        </div>

        <div className="admin-chart-grid">
          {Object.entries(yearScopedReportData.usersByRole).map(([key, value]) => (
            <article key={key}>
              <span>{key}</span>
              <div><i style={{ height: `${Math.max(24, value * 14)}px` }} /></div>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        <div className="admin-table-wrap admin-report-history">
          <table>
            <thead>
              <tr>
                <th>Report</th>
                <th>Format</th>
                <th>Academic Year</th>
                <th>Scope</th>
                <th>Generated On</th>
              </tr>
            </thead>
            <tbody>
              {filteredGeneratedReports.map((item) => (
                <tr key={item.id}>
                  <td>{item.report}</td>
                  <td>{item.format}</td>
                  <td>{item.academicYear || '-'}</td>
                  <td>{item.scope}</td>
                  <td>{item.generatedAt}</td>
                </tr>
              ))}
              {!filteredGeneratedReports.length && (
                <tr>
                  <td colSpan="5" className="attendance-empty">No report generated for the selected academic year.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderLibrary = () => {
    return <Library />;
  };

  const renderTransport = () => {
    const transportPageData = getPaginatedData('transport', transportRoutes);
    return (
    <section className="admin-panel">
      <div className="section-header">
        <h2>Transport</h2>
        <p>Additional control tab for route, capacity and transport punctuality governance.</p>
      </div>

      <div className="admin-kpi-row compact">
        <article><span>Routes</span><strong>{transportSummary.routes}</strong></article>
        <article><span>On Schedule</span><strong>{transportSummary.onSchedule}</strong></article>
        <article><span>Full Routes</span><strong>{transportSummary.full}</strong></article>
        <article><span>Occupancy</span><strong>{transportSummary.occupancyRate}%</strong></article>
      </div>

      <div className="admin-actions" style={{ marginBottom: 10 }}>
        <button type="button" className="row-action" onClick={() => exportCsv(transportRoutes, 'admin-transport.csv')}>Export Transport CSV</button>
      </div>

      <div className="admin-compose-grid compact">
        <label>
          Route
          <input
            type="text"
            value={transportDraft.route}
            onChange={(event) => setTransportDraft((prev) => ({ ...prev, route: event.target.value }))}
            placeholder="e.g. South Route"
          />
        </label>
        <label>
          Bus No
          <input
            type="text"
            value={transportDraft.busNo}
            onChange={(event) => setTransportDraft((prev) => ({ ...prev, busNo: event.target.value }))}
            placeholder="BUS-05"
          />
        </label>
        <label>
          Driver
          <input
            type="text"
            value={transportDraft.driver}
            onChange={(event) => setTransportDraft((prev) => ({ ...prev, driver: event.target.value }))}
            placeholder="Driver name"
          />
        </label>
        <label>
          Seats
          <input
            type="number"
            min="1"
            value={transportDraft.seats}
            onChange={(event) => setTransportDraft((prev) => ({ ...prev, seats: event.target.value }))}
          />
        </label>
        <label>
          Occupied
          <input
            type="number"
            min="0"
            value={transportDraft.occupied}
            onChange={(event) => setTransportDraft((prev) => ({ ...prev, occupied: event.target.value }))}
          />
        </label>
        <label>
          Status
          <select
            value={transportDraft.status}
            onChange={(event) => setTransportDraft((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option>On Schedule</option>
            <option>Delayed</option>
            <option>Full</option>
          </select>
        </label>
        <button type="button" onClick={addTransportRoute}>Add Route</button>
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {transportPageData.pageItems.map((item) => (
              <tr key={item.id}>
                <td>{item.route}</td>
                <td>{item.busNo}</td>
                <td>{item.driver}</td>
                <td>{item.seats}</td>
                <td>{item.occupied}</td>
                <td>
                  <select
                    value={item.status}
                    onChange={(event) => updateTransportStatus(item.id, event.target.value)}
                  >
                    <option>On Schedule</option>
                    <option>Delayed</option>
                    <option>Full</option>
                  </select>
                </td>
                <td>
                  <div className="admin-row-actions">
                    <button type="button" className="row-action" onClick={() => updateTransportOccupancy(item.id, 1)}>+1</button>
                    <button type="button" className="row-action" onClick={() => updateTransportOccupancy(item.id, -1)}>-1</button>
                    <button type="button" className="row-action danger" onClick={() => removeTransportRoute(item.id)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {!transportPageData.pageItems.length && (
              <tr>
                <td colSpan="7" className="attendance-empty">No transport routes available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {renderPaginationControls('transport', transportPageData, 'transport routes')}
    </section>
    );
  };

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
      case 'admin-enrolment':
        return renderUsers();
      case 'students':
        return renderStudents();
      case 'id-cards':
        return renderIdCards();
      case 'parents':
        return renderSimpleRoleTable('Parents', 'Control parent account lifecycle and communication readiness.', parents, 'Parent');
      case 'teachers':
        return renderTeachers();
      case 'staff':
        return renderStaff();
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
      case 'exams':
        return renderExams();
      case 'results':
        return renderResults();
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

        {activeView === 'dashboard' && <aside className="right-sidebar admin-right-sidebar">
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
        </aside>}
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
