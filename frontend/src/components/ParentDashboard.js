import React, { useEffect, useMemo, useState } from 'react';
import {
  FaChartLine,
  FaClipboardCheck,
  FaWallet,
  FaEnvelope,
  FaBell,
  FaCalendarAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaClock,
  FaUserShield
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import Header from './Header';
import ParentSidebar from './ParentSidebar';
import EditProfile from './EditProfile';
import Announcements from './Announcements';
import {
  getPublishedReportCards,
  REPORT_CARD_PUBLISHED_EVENT
} from './reportCardPublications';
import './TeacherDashboard.css';
import './ParentDashboard.css';

const buildAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f6feb&color=fff&bold=true`;

const DEFAULT_PARENT_SETTINGS = {
  emailNotifications: true,
  smsNotifications: true,
  invoiceReminders: true,
  attendanceAlerts: true,
  language: 'English',
  timezone: 'Africa/Douala'
};

const defaultChildren = [
  {
    id: 1,
    name: 'Emily Johnson',
    className: 'Grade 5',
    announcements: [
      {
        id: 101,
        title: 'Term 2 Parent Meeting',
        message: 'Parent-teacher meeting is scheduled for March 20, 2026 at 4:00 PM.',
        date: '2026-03-20',
        type: 'Important'
      },
      {
        id: 102,
        title: 'Science Fair Preparation',
        message: 'Students should submit science fair topics by March 14, 2026.',
        date: '2026-03-14',
        type: 'Event'
      },
      {
        id: 103,
        title: 'Mid-Term Exams',
        message: 'Mid-term exams begin on March 25, 2026. Ensure students revise daily.',
        date: '2026-03-25',
        type: 'Academic'
      }
    ],
    events: [
      { id: 1, title: 'PTA Executive Meeting', date: '2026-03-12', time: '2:00 PM', location: 'Main Hall' },
      { id: 2, title: 'Career Day', date: '2026-03-18', time: '10:30 AM', location: 'School Auditorium' },
      { id: 3, title: 'Inter-House Sports', date: '2026-03-27', time: '8:30 AM', location: 'School Field' }
    ],
    results: [
      { id: 1, subject: 'Mathematics', ca: 15, exam: 16, total: 15.5, grade: 'A-' },
      { id: 2, subject: 'English', ca: 14, exam: 13, total: 13.5, grade: 'B+' },
      { id: 3, subject: 'Science', ca: 17, exam: 16, total: 16.5, grade: 'A' },
      { id: 4, subject: 'History', ca: 12, exam: 11, total: 11.5, grade: 'B' }
    ],
    academicRecords: [
      {
        id: 1001,
        year: '2025/2026',
        term: 'Term 2',
        sequence: 'Sequence 1',
        classRank: 7,
        classSize: 42,
        average: 14.3,
        conduct: 'Very Good',
        councilDecision: 'Promising Progress',
        remark: 'Consistent improvement in sciences. Keep focus on essay writing.',
        subjects: [
          { id: 1, subject: 'Mathematics', coefficient: 5, ca: 15, exam: 16, total: 15.5, grade: 'A-' },
          { id: 2, subject: 'English Language', coefficient: 4, ca: 14, exam: 13, total: 13.5, grade: 'B+' },
          { id: 3, subject: 'Integrated Science', coefficient: 4, ca: 17, exam: 16, total: 16.5, grade: 'A' },
          { id: 4, subject: 'History', coefficient: 2, ca: 12, exam: 11, total: 11.5, grade: 'B' },
          { id: 5, subject: 'Citizenship Education', coefficient: 1, ca: 14, exam: 14, total: 14, grade: 'B+' }
        ]
      },
      {
        id: 1002,
        year: '2025/2026',
        term: 'Term 1',
        sequence: 'Sequence 2',
        classRank: 10,
        classSize: 42,
        average: 13.2,
        conduct: 'Good',
        councilDecision: 'Progressing',
        remark: 'Good effort. Needs more speed in mathematics problem solving.',
        subjects: [
          { id: 6, subject: 'Mathematics', coefficient: 5, ca: 13, exam: 14, total: 13.5, grade: 'B+' },
          { id: 7, subject: 'English Language', coefficient: 4, ca: 13, exam: 12, total: 12.5, grade: 'B' },
          { id: 8, subject: 'Integrated Science', coefficient: 4, ca: 15, exam: 14, total: 14.5, grade: 'A-' },
          { id: 9, subject: 'History', coefficient: 2, ca: 11, exam: 10, total: 10.5, grade: 'C+' },
          { id: 10, subject: 'Citizenship Education', coefficient: 1, ca: 12, exam: 13, total: 12.5, grade: 'B' }
        ]
      }
    ],
    attendance: [
      { id: 1, date: '2026-03-03', status: 'Present', remark: 'On time' },
      { id: 2, date: '2026-03-04', status: 'Present', remark: 'On time' },
      { id: 3, date: '2026-03-05', status: 'Late', remark: 'Arrived 15 mins late' },
      { id: 4, date: '2026-03-06', status: 'Absent', remark: 'Sick leave' }
    ],
    timetable: [
      { id: 1, day: 'Monday', period1: 'Math', period2: 'English', period3: 'Science', period4: 'ICT' },
      { id: 2, day: 'Tuesday', period1: 'History', period2: 'Math', period3: 'French', period4: 'Sports' },
      { id: 3, day: 'Wednesday', period1: 'Science', period2: 'Geography', period3: 'Math', period4: 'Music' },
      { id: 4, day: 'Thursday', period1: 'English', period2: 'Science', period3: 'Art', period4: 'Math' },
      { id: 5, day: 'Friday', period1: 'Civics', period2: 'Math', period3: 'English', period4: 'Club Activity' }
    ],
    feeItems: [
      { id: 1, item: 'Tuition Fee', term: 'Term 2', billed: 120000, paid: 70000, dueDate: '2026-03-15', priority: 'High' },
      { id: 2, item: 'Transport Fee', term: 'Term 2', billed: 30000, paid: 10000, dueDate: '2026-03-20', priority: 'Medium' },
      { id: 3, item: 'Laboratory Levy', term: 'Term 2', billed: 15000, paid: 15000, dueDate: '2026-03-10', priority: 'Low' },
      { id: 4, item: 'PTA Contribution', term: 'Term 2', billed: 10000, paid: 0, dueDate: '2026-03-25', priority: 'Medium' }
    ],
    invoices: [
      { id: 1, invoiceNo: 'INV-2026-101', title: 'Term 2 Tuition', dueDate: '2026-03-15', amount: 120000, status: 'Unpaid' },
      { id: 2, invoiceNo: 'INV-2026-104', title: 'Transport Fee', dueDate: '2026-03-20', amount: 30000, status: 'Unpaid' },
      { id: 3, invoiceNo: 'INV-2026-089', title: 'Library Subscription', dueDate: '2026-02-25', amount: 10000, status: 'Paid' }
    ],
    paymentHistory: [
      {
        id: 1,
        date: '2026-02-10',
        amount: 90000,
        method: 'Mobile Money',
        reference: 'TXN-92451',
        status: 'Successful',
        feeItem: 'Tuition Fee',
        payerName: 'Mary Johnson',
        payerPhone: '677000444'
      },
      {
        id: 2,
        date: '2026-01-12',
        amount: 75000,
        method: 'Mobile Money',
        reference: 'TRF-55120',
        status: 'Successful',
        feeItem: 'Tuition Fee',
        payerName: 'Mary Johnson',
        payerPhone: '677000444'
      }
    ],
    messages: [
      {
        id: 1,
        from: 'Class Teacher - Mr. John Smith',
        preview: 'Emily has shown excellent participation in class this week.',
        date: '2026-03-06'
      },
      {
        id: 2,
        from: 'Bursar Office',
        preview: 'Kindly complete outstanding transport fees before March 20.',
        date: '2026-03-05'
      }
    ],
    notifications: [
      { id: 1, title: 'New announcement: Term 2 Parent Meeting', date: '2026-03-06', unread: true, view: 'announcements' },
      { id: 2, title: 'Invoice due in 9 days', date: '2026-03-06', unread: true, view: 'invoices' },
      { id: 3, title: 'Attendance alert: Absent on 2026-03-06', date: '2026-03-06', unread: true, view: 'attendance' },
      { id: 4, title: 'Message from Class Teacher', date: '2026-03-05', unread: false, view: 'messages' }
    ]
  },
  {
    id: 2,
    name: 'Daniel Johnson',
    className: 'Grade 3',
    announcements: [
      {
        id: 201,
        title: 'Reading Week',
        message: 'Reading week starts on March 11. Students should bring one storybook.',
        date: '2026-03-11',
        type: 'Event'
      },
      {
        id: 202,
        title: 'Class Project',
        message: 'Submit the recycled-material project by March 16.',
        date: '2026-03-16',
        type: 'Academic'
      }
    ],
    events: [
      { id: 21, title: 'Grade 3 Open Day', date: '2026-03-10', time: '11:00 AM', location: 'Primary Block' },
      { id: 22, title: 'Book Character Day', date: '2026-03-19', time: '9:30 AM', location: 'Assembly Ground' }
    ],
    results: [
      { id: 21, subject: 'Mathematics', ca: 13, exam: 14, total: 13.5, grade: 'B+' },
      { id: 22, subject: 'English', ca: 16, exam: 15, total: 15.5, grade: 'A-' },
      { id: 23, subject: 'Science', ca: 14, exam: 13, total: 13.5, grade: 'B+' },
      { id: 24, subject: 'History', ca: 12, exam: 12, total: 12, grade: 'B' }
    ],
    academicRecords: [
      {
        id: 2001,
        year: '2025/2026',
        term: 'Term 2',
        sequence: 'Sequence 1',
        classRank: 12,
        classSize: 38,
        average: 13.1,
        conduct: 'Good',
        councilDecision: 'Satisfactory',
        remark: 'Strong reading confidence. Continue revision in science vocabulary.',
        subjects: [
          { id: 21, subject: 'Mathematics', coefficient: 5, ca: 13, exam: 14, total: 13.5, grade: 'B+' },
          { id: 22, subject: 'English Language', coefficient: 4, ca: 16, exam: 15, total: 15.5, grade: 'A-' },
          { id: 23, subject: 'Integrated Science', coefficient: 4, ca: 14, exam: 13, total: 13.5, grade: 'B+' },
          { id: 24, subject: 'History', coefficient: 2, ca: 12, exam: 12, total: 12, grade: 'B' },
          { id: 25, subject: 'French', coefficient: 2, ca: 11, exam: 12, total: 11.5, grade: 'B' }
        ]
      }
    ],
    attendance: [
      { id: 21, date: '2026-03-03', status: 'Present', remark: 'On time' },
      { id: 22, date: '2026-03-04', status: 'Present', remark: 'On time' },
      { id: 23, date: '2026-03-05', status: 'Present', remark: 'On time' },
      { id: 24, date: '2026-03-06', status: 'Late', remark: 'Arrived 10 mins late' }
    ],
    timetable: [
      { id: 21, day: 'Monday', period1: 'English', period2: 'Math', period3: 'Science', period4: 'Drawing' },
      { id: 22, day: 'Tuesday', period1: 'Math', period2: 'French', period3: 'Story Time', period4: 'Sports' },
      { id: 23, day: 'Wednesday', period1: 'Science', period2: 'Math', period3: 'Music', period4: 'Reading' },
      { id: 24, day: 'Thursday', period1: 'English', period2: 'Art', period3: 'Math', period4: 'Civics' },
      { id: 25, day: 'Friday', period1: 'Math', period2: 'English', period3: 'Science', period4: 'Club Activity' }
    ],
    feeItems: [
      { id: 21, item: 'Tuition Fee', term: 'Term 2', billed: 100000, paid: 40000, dueDate: '2026-03-15', priority: 'High' },
      { id: 22, item: 'Meal Plan', term: 'Term 2', billed: 25000, paid: 25000, dueDate: '2026-03-20', priority: 'Medium' },
      { id: 23, item: 'School Uniform', term: 'Term 2', billed: 18000, paid: 5000, dueDate: '2026-03-22', priority: 'Low' }
    ],
    invoices: [
      { id: 21, invoiceNo: 'INV-2026-211', title: 'Term 2 Tuition', dueDate: '2026-03-15', amount: 100000, status: 'Unpaid' },
      { id: 22, invoiceNo: 'INV-2026-214', title: 'Meal Plan', dueDate: '2026-03-20', amount: 25000, status: 'Paid' }
    ],
    paymentHistory: [
      {
        id: 21,
        date: '2026-02-09',
        amount: 50000,
        method: 'Orange Money',
        reference: 'OM-22451',
        status: 'Successful',
        feeItem: 'Tuition Fee',
        payerName: 'Mary Johnson',
        payerPhone: '677000444'
      },
      {
        id: 22,
        date: '2026-01-10',
        amount: 70000,
        method: 'Mobile Money',
        reference: 'MM-63120',
        status: 'Successful',
        feeItem: 'Tuition Fee',
        payerName: 'Mary Johnson',
        payerPhone: '677000444'
      }
    ],
    messages: [
      {
        id: 21,
        from: 'Class Teacher - Mrs. Grace N.',
        preview: 'Daniel reads confidently and participates actively.',
        date: '2026-03-06'
      }
    ],
    notifications: [
      { id: 21, title: 'Reminder: Reading Week starts soon', date: '2026-03-06', unread: true, view: 'announcements' },
      { id: 22, title: 'Meal Plan invoice marked paid', date: '2026-03-05', unread: false, view: 'invoices' }
    ]
  }
];

const ParentDashboard = ({ profile, onSaveProfile = () => {}, onLogout = () => {} }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [childrenData, setChildrenData] = useState(() => {
    if (Array.isArray(profile?.children) && profile.children.length > 0) {
      return profile.children;
    }

    if (profile?.childName) {
      return defaultChildren.map((item) => (
        item.id === 1 ? { ...item, name: profile.childName, className: profile.className || item.className } : item
      ));
    }

    return defaultChildren;
  });

  const [selectedChildId, setSelectedChildId] = useState(childrenData[0]?.id || 1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedAcademicTerm, setSelectedAcademicTerm] = useState('');
  const [selectedAcademicSequence, setSelectedAcademicSequence] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('All');
  const [attendanceRangeFilter, setAttendanceRangeFilter] = useState('All');
  const [attendanceDateQuery, setAttendanceDateQuery] = useState('');
  const [timetableViewMode, setTimetableViewMode] = useState('Weekly');
  const [selectedTimetableDay, setSelectedTimetableDay] = useState('All');
  const [timetableSubjectQuery, setTimetableSubjectQuery] = useState('');
  const [feeTermFilter, setFeeTermFilter] = useState('All Terms');
  const [feeStatusFilter, setFeeStatusFilter] = useState('All Status');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All Methods');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All Status');
  const [invoiceTermFilter, setInvoiceTermFilter] = useState('All Terms');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState(null);

  const [settingsDraft, setSettingsDraft] = useState({ ...DEFAULT_PARENT_SETTINGS });
  const [savedSettingsSnapshot, setSavedSettingsSnapshot] = useState({ ...DEFAULT_PARENT_SETTINGS });
  const [settingsLastSavedAt, setSettingsLastSavedAt] = useState('Not saved yet');
  const [eventsSearchQuery, setEventsSearchQuery] = useState('');
  const [eventsMonthFilter, setEventsMonthFilter] = useState('All Months');
  const [eventsSortBy, setEventsSortBy] = useState('date');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageSortBy, setMessageSortBy] = useState('recent');
  const [notificationSearchQuery, setNotificationSearchQuery] = useState('');
  const [notificationStatusFilter, setNotificationStatusFilter] = useState('all');
  const [notificationSortBy, setNotificationSortBy] = useState('recent');
  const [publishedReportCards, setPublishedReportCards] = useState(() => getPublishedReportCards());

  const profileForEdit = useMemo(() => ({
    matricule: profile?.matricule || 'PAR2026',
    name: profile?.name || 'Parent User',
    avatar: profile?.avatar || buildAvatar(profile?.name || 'Parent User'),
    password: profile?.password || 'parent123',
    phone: profile?.phone || '677000444'
  }), [profile]);

  const selectedChild = childrenData.find((item) => item.id === selectedChildId) || childrenData[0];

  const childName = selectedChild?.name || 'Student';
  const className = selectedChild?.className || 'Class';
  const announcements = selectedChild?.announcements || [];
  const events = useMemo(() => selectedChild?.events || [], [selectedChild]);
  const resultItems = selectedChild?.results || [];
  const attendanceItems = selectedChild?.attendance || [];
  const timetableItems = selectedChild?.timetable || [];
  const feeItems = selectedChild?.feeItems || [];
  const invoices = selectedChild?.invoices || [];
  const paymentHistory = selectedChild?.paymentHistory || [];
  const messages = useMemo(() => selectedChild?.messages || [], [selectedChild]);
  const notifications = useMemo(() => selectedChild?.notifications || [], [selectedChild]);
  const academicRecords = selectedChild?.academicRecords || [];

  useEffect(() => {
    const currentChild = childrenData.find((item) => item.id === selectedChildId);
    const currentAnnouncements = currentChild?.announcements || [];
    const currentAcademicRecords = currentChild?.academicRecords || [];

    if (currentAnnouncements.length > 0) {
      setSelectedAnnouncementId(currentAnnouncements[0].id);
    } else {
      setSelectedAnnouncementId(null);
    }

    setMessageDraft('');
    setAttendanceStatusFilter('All');
    setAttendanceRangeFilter('All');
    setAttendanceDateQuery('');
    setTimetableViewMode('Weekly');
    setSelectedTimetableDay('All');
    setTimetableSubjectQuery('');
    setFeeTermFilter('All Terms');
    setFeeStatusFilter('All Status');
    setFeeSearchQuery('');
    setPaymentMethodFilter('All Methods');
    setInvoiceStatusFilter('All Status');
    setInvoiceTermFilter('All Terms');
    setInvoiceSearchQuery('');

    if (currentAcademicRecords.length > 0) {
      setSelectedAcademicYear(currentAcademicRecords[0].year);
      setSelectedAcademicTerm(currentAcademicRecords[0].term);
      setSelectedAcademicSequence(currentAcademicRecords[0].sequence);
    } else {
      setSelectedAcademicYear('');
      setSelectedAcademicTerm('');
      setSelectedAcademicSequence('');
    }

  }, [selectedChildId, childrenData, profile?.name, profile?.phone]);

  useEffect(() => {
    const syncPublishedReportCards = () => {
      setPublishedReportCards(getPublishedReportCards());
    };

    window.addEventListener(REPORT_CARD_PUBLISHED_EVENT, syncPublishedReportCards);
    window.addEventListener('storage', syncPublishedReportCards);

    return () => {
      window.removeEventListener(REPORT_CARD_PUBLISHED_EVENT, syncPublishedReportCards);
      window.removeEventListener('storage', syncPublishedReportCards);
    };
  }, []);

  const academicYearOptions = Array.from(new Set(academicRecords.map((item) => item.year)));
  const academicTermOptions = Array.from(new Set(
    academicRecords
      .filter((item) => !selectedAcademicYear || item.year === selectedAcademicYear)
      .map((item) => item.term)
  ));
  const academicSequenceOptions = Array.from(new Set(
    academicRecords
      .filter((item) => (!selectedAcademicYear || item.year === selectedAcademicYear)
        && (!selectedAcademicTerm || item.term === selectedAcademicTerm))
      .map((item) => item.sequence)
  ));

  const selectedAcademicRecord = academicRecords.find((item) => (
    item.year === selectedAcademicYear
    && item.term === selectedAcademicTerm
    && item.sequence === selectedAcademicSequence
  )) || academicRecords[0] || null;

  const selectedAcademicSubjects = selectedAcademicRecord?.subjects || resultItems;
  const totalCoefficient = selectedAcademicSubjects.reduce((sum, item) => sum + (item.coefficient || 1), 0);
  const weightedPoints = selectedAcademicSubjects.reduce(
    (sum, item) => sum + (item.total * (item.coefficient || 1)),
    0
  );
  const weightedAverage = totalCoefficient ? (weightedPoints / totalCoefficient).toFixed(2) : '0.00';
  const bestSubject = selectedAcademicSubjects.reduce(
    (best, item) => (item.total > best.total ? item : best),
    selectedAcademicSubjects[0] || { subject: 'N/A', total: 0 }
  );
  const weakestSubject = selectedAcademicSubjects.reduce(
    (lowest, item) => (item.total < lowest.total ? item : lowest),
    selectedAcademicSubjects[0] || { subject: 'N/A', total: 0 }
  );
  const passCount = selectedAcademicSubjects.filter((item) => item.total >= 10).length;
  const passRate = selectedAcademicSubjects.length ? Math.round((passCount / selectedAcademicSubjects.length) * 100) : 0;

  const selectedChildPublishedCards = useMemo(() => {
    const selectedChildName = String(selectedChild?.name || '').trim().toLowerCase();
    const selectedChildClass = String(selectedChild?.className || '').trim().toLowerCase();
    const parentName = String(profile?.name || '').trim().toLowerCase();

    return publishedReportCards
      .filter((item) => {
        const sameStudent = selectedChildName && String(item.studentName || '').toLowerCase() === selectedChildName;
        const sameClass = !selectedChildClass || String(item.className || '').toLowerCase() === selectedChildClass;
        const sameParent = !parentName || !item.parentName || String(item.parentName || '').toLowerCase() === parentName;
        return sameStudent && sameClass && sameParent;
      })
      .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());
  }, [publishedReportCards, selectedChild?.name, selectedChild?.className, profile?.name]);

  const updateSelectedChild = (updater) => {
    setChildrenData((prev) => prev.map((item) => (
      item.id === selectedChildId ? updater(item) : item
    )));
  };

  const notificationItems = notifications.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    unread: item.unread
  }));

  const unreadNotificationCount = notificationItems.filter((item) => item.unread).length;

  const eventMonthOptions = useMemo(() => ([
    'All Months',
    ...Array.from(new Set(events.map((item) => item.date.slice(0, 7))))
  ]), [events]);

  const filteredEvents = useMemo(() => {
    const query = eventsSearchQuery.trim().toLowerCase();

    return events
      .filter((item) => {
        const monthMatch = eventsMonthFilter === 'All Months' || item.date.startsWith(eventsMonthFilter);
        const searchMatch = !query || `${item.title} ${item.location} ${item.date} ${item.time}`.toLowerCase().includes(query);
        return monthMatch && searchMatch;
      })
      .sort((left, right) => {
        if (eventsSortBy === 'title') {
          return left.title.localeCompare(right.title);
        }
        return new Date(left.date).getTime() - new Date(right.date).getTime();
      });
  }, [events, eventsSearchQuery, eventsMonthFilter, eventsSortBy]);

  const nextEvent = filteredEvents[0] || events[0] || null;

  const filteredMessages = useMemo(() => {
    const query = messageSearchQuery.trim().toLowerCase();

    return messages
      .filter((item) => (!query || `${item.from} ${item.preview} ${item.date}`.toLowerCase().includes(query)))
      .sort((left, right) => {
        if (messageSortBy === 'sender') {
          return left.from.localeCompare(right.from);
        }
        return new Date(right.date).getTime() - new Date(left.date).getTime();
      });
  }, [messages, messageSearchQuery, messageSortBy]);

  const messageStats = useMemo(() => ({
    total: messages.length,
    teacher: messages.filter((item) => /teacher/i.test(item.from)).length,
    admin: messages.filter((item) => /bursar|office|principal/i.test(item.from)).length
  }), [messages]);

  const filteredNotifications = useMemo(() => {
    const query = notificationSearchQuery.trim().toLowerCase();

    return notifications
      .filter((item) => {
        const statusMatch = notificationStatusFilter === 'all'
          ? true
          : notificationStatusFilter === 'unread'
            ? item.unread
            : !item.unread;
        const searchMatch = !query || `${item.title} ${item.date}`.toLowerCase().includes(query);
        return statusMatch && searchMatch;
      })
      .sort((left, right) => {
        if (notificationSortBy === 'oldest') {
          return new Date(left.date).getTime() - new Date(right.date).getTime();
        }
        return new Date(right.date).getTime() - new Date(left.date).getTime();
      });
  }, [notifications, notificationSearchQuery, notificationStatusFilter, notificationSortBy]);

  const hasUnsavedSettings = useMemo(
    () => JSON.stringify(settingsDraft) !== JSON.stringify(savedSettingsSnapshot),
    [settingsDraft, savedSettingsSnapshot]
  );

  const totalUnpaid = invoices
    .filter((item) => item.status === 'Unpaid')
    .reduce((sum, item) => sum + item.amount, 0);

  const feeTermOptions = ['All Terms', ...Array.from(new Set(feeItems.map((item) => item.term)))];
  const feeStatusResolver = (item) => {
    if (item.paid <= 0) return 'Unpaid';
    if (item.paid >= item.billed) return 'Paid';
    return 'Partial';
  };

  const filteredFeeItems = feeItems.filter((item) => {
    const termMatch = feeTermFilter === 'All Terms' || item.term === feeTermFilter;
    const status = feeStatusResolver(item);
    const statusMatch = feeStatusFilter === 'All Status' || status === feeStatusFilter;
    const query = feeSearchQuery.trim().toLowerCase();
    const searchMatch = !query || item.item.toLowerCase().includes(query) || item.dueDate.includes(query);
    return termMatch && statusMatch && searchMatch;
  });

  const totalBilled = feeItems.reduce((sum, item) => sum + item.billed, 0);
  const totalPaid = feeItems.reduce((sum, item) => sum + item.paid, 0);
  const totalBalance = totalBilled - totalPaid;
  const feeCompletionRate = totalBilled ? Math.round((totalPaid / totalBilled) * 100) : 0;
  const overdueFeeCount = feeItems.filter((item) => (
    feeStatusResolver(item) !== 'Paid' && new Date(item.dueDate) < new Date()
  )).length;

  const paymentMethodOptions = ['All Methods', ...Array.from(new Set(paymentHistory.map((item) => item.method)))];
  const filteredPaymentHistory = paymentHistory.filter((item) => (
    paymentMethodFilter === 'All Methods' || item.method === paymentMethodFilter
  ));

  const inferInvoiceTerm = (invoiceItem) => {
    const match = invoiceItem.title.match(/Term\s*\d/i);
    return match ? match[0].replace(/\s+/g, ' ') : 'Current Term';
  };

  const invoiceTermOptions = ['All Terms', ...Array.from(new Set(invoices.map((item) => inferInvoiceTerm(item))))];
  const filteredInvoices = invoices.filter((item) => {
    const statusMatch = invoiceStatusFilter === 'All Status' || item.status === invoiceStatusFilter;
    const termMatch = invoiceTermFilter === 'All Terms' || inferInvoiceTerm(item) === invoiceTermFilter;
    const query = invoiceSearchQuery.trim().toLowerCase();
    const queryMatch = !query || `${item.invoiceNo} ${item.title} ${item.dueDate}`.toLowerCase().includes(query);
    return statusMatch && termMatch && queryMatch;
  });

  const totalInvoiceAmount = invoices.reduce((sum, item) => sum + item.amount, 0);
  const paidInvoiceAmount = invoices
    .filter((item) => item.status === 'Paid')
    .reduce((sum, item) => sum + item.amount, 0);
  const unpaidInvoiceAmount = invoices
    .filter((item) => item.status === 'Unpaid')
    .reduce((sum, item) => sum + item.amount, 0);
  const overdueInvoices = invoices.filter((item) => item.status === 'Unpaid' && new Date(item.dueDate) < new Date());
  const invoiceCollectionRate = totalInvoiceAmount ? Math.round((paidInvoiceAmount / totalInvoiceAmount) * 100) : 0;

  const openInvoiceFollowUpMessage = () => {
    const topOverdue = overdueInvoices[0];
    const overdueText = topOverdue
      ? `Overdue invoice: ${topOverdue.invoiceNo} (${topOverdue.amount.toLocaleString()} FCFA).`
      : `Current unpaid total is ${unpaidInvoiceAmount.toLocaleString()} FCFA.`;

    setMessageDraft(`Hello Bursar Office, kindly confirm ${childName}'s latest invoice statement. ${overdueText}`);
    setActiveView('messages');
  };

  const exportInvoicesCsv = () => {
    const rows = [
      ['Student', 'Class', 'Invoice No', 'Title', 'Term', 'Due Date', 'Amount', 'Status'],
      ...filteredInvoices.map((item) => [
        childName,
        className,
        item.invoiceNo,
        item.title,
        inferInvoiceTerm(item),
        item.dueDate,
        item.amount,
        item.status
      ])
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${childName.replace(/\s+/g, '_')}_invoices.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const attendanceRate = attendanceItems.length
    ? Math.round((attendanceItems.filter((item) => item.status === 'Present').length / attendanceItems.length) * 100)
    : 0;
  const resultAverage = resultItems.length
    ? (resultItems.reduce((sum, item) => sum + item.total, 0) / resultItems.length).toFixed(1)
    : '0.0';

  const attendanceReferenceDate = attendanceItems.length
    ? attendanceItems
      .map((item) => new Date(item.date).getTime())
      .reduce((max, current) => (current > max ? current : max), 0)
    : Date.now();

  const filteredAttendanceItems = attendanceItems.filter((item) => {
    const statusMatch = attendanceStatusFilter === 'All' || item.status === attendanceStatusFilter;
    const query = attendanceDateQuery.trim();
    const queryMatch = !query || item.date.includes(query);

    const itemTime = new Date(item.date).getTime();
    const dayDifference = Math.floor((attendanceReferenceDate - itemTime) / (1000 * 60 * 60 * 24));

    let rangeMatch = true;
    if (attendanceRangeFilter === 'Last 7 Days') {
      rangeMatch = dayDifference <= 7;
    } else if (attendanceRangeFilter === 'Last 30 Days') {
      rangeMatch = dayDifference <= 30;
    }

    return statusMatch && queryMatch && rangeMatch;
  });

  const presentCount = attendanceItems.filter((item) => item.status === 'Present').length;
  const lateCount = attendanceItems.filter((item) => item.status === 'Late').length;
  const absentCount = attendanceItems.filter((item) => item.status === 'Absent').length;
  const punctualityRate = attendanceItems.length
    ? Math.round((presentCount / attendanceItems.length) * 100)
    : 0;

  const consecutiveAbsenceCount = (() => {
    const sorted = [...attendanceItems].sort((a, b) => new Date(b.date) - new Date(a.date));
    let total = 0;
    for (const item of sorted) {
      if (item.status === 'Absent') {
        total += 1;
      } else {
        break;
      }
    }
    return total;
  })();

  const attendanceAlerts = [];
  if (absentCount >= 2) {
    attendanceAlerts.push(`${childName} has ${absentCount} absences in the selected record set.`);
  }
  if (lateCount >= 2) {
    attendanceAlerts.push(`${childName} has ${lateCount} late arrivals; consider routine adjustment.`);
  }
  if (consecutiveAbsenceCount >= 2) {
    attendanceAlerts.push(`${childName} is absent for ${consecutiveAbsenceCount} consecutive days.`);
  }

  const openAttendanceFollowUpMessage = () => {
    setMessageDraft(
      `Hello Class Teacher, I am following up on ${childName}'s attendance (${presentCount} present, ${lateCount} late, ${absentCount} absent). Please share guidance.`
    );
    setActiveView('messages');
  };

  const downloadAttendanceReport = () => {
    const rows = [
      ['Student', 'Class', 'Date', 'Status', 'Remark'],
      ...filteredAttendanceItems.map((item) => [childName, className, item.date, item.status, item.remark])
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${childName.replace(/\s+/g, '_')}_attendance_report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const timetablePeriodDefinitions = [
    { key: 'period1', label: 'Period 1', time: '07:30 - 08:20' },
    { key: 'period2', label: 'Period 2', time: '08:25 - 09:15' },
    { key: 'period3', label: 'Period 3', time: '09:40 - 10:30' },
    { key: 'period4', label: 'Period 4', time: '10:35 - 11:25' }
  ];

  const timetableDayOptions = ['All', ...timetableItems.map((item) => item.day)];
  const currentWeekDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const normalizedTimetableRows = timetableItems.map((item) => ({
    id: item.id,
    day: item.day,
    slots: timetablePeriodDefinitions.map((period) => ({
      key: period.key,
      label: period.label,
      time: period.time,
      subject: item[period.key]
    }))
  }));

  const effectiveTimetableDay = selectedTimetableDay === 'All'
    ? (timetableDayOptions.includes(currentWeekDay) ? currentWeekDay : timetableItems[0]?.day || 'All')
    : selectedTimetableDay;

  const filteredTimetableRows = normalizedTimetableRows.filter((row) => {
    const dayMatch = selectedTimetableDay === 'All' || row.day === selectedTimetableDay;
    const query = timetableSubjectQuery.trim().toLowerCase();

    const queryMatch = !query || row.slots.some((slot) => slot.subject.toLowerCase().includes(query));
    return dayMatch && queryMatch;
  });

  const dailyTimetableRow = normalizedTimetableRows.find((row) => row.day === effectiveTimetableDay) || null;
  const dailyTimetableSlots = (dailyTimetableRow?.slots || []).filter((slot) => (
    !timetableSubjectQuery.trim() || slot.subject.toLowerCase().includes(timetableSubjectQuery.trim().toLowerCase())
  ));

  const timetableAllSubjects = normalizedTimetableRows.flatMap((row) => row.slots.map((slot) => slot.subject));
  const timetableUniqueSubjects = Array.from(new Set(timetableAllSubjects));
  const timetableSubjectLoad = Object.entries(timetableAllSubjects.reduce((acc, subject) => {
    const key = subject.trim();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).sort((left, right) => right[1] - left[1]);

  const nextClassSlot = (() => {
    const referenceRow = normalizedTimetableRows.find((row) => row.day === currentWeekDay)
      || normalizedTimetableRows[0];
    if (!referenceRow) return null;
    return { day: referenceRow.day, ...referenceRow.slots[0] };
  })();

  const openTimetableFollowUpMessage = () => {
    const contextDay = timetableViewMode === 'Daily' ? effectiveTimetableDay : 'this week';
    setMessageDraft(
      `Hello Class Teacher, kindly confirm ${childName}'s timetable for ${contextDay}. I would like to align home study and transport timing.`
    );
    setActiveView('messages');
  };

  const downloadTimetableCsv = () => {
    const baseRows = timetableViewMode === 'Daily'
      ? (dailyTimetableRow
        ? dailyTimetableSlots.map((slot) => [childName, className, dailyTimetableRow.day, slot.label, slot.time, slot.subject])
        : [])
      : filteredTimetableRows.flatMap((row) => row.slots.map((slot) => [
        childName,
        className,
        row.day,
        slot.label,
        slot.time,
        slot.subject
      ]));

    const rows = [['Student', 'Class', 'Day', 'Period', 'Time', 'Subject'], ...baseRows];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${childName.replace(/\s+/g, '_')}_timetable.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSidebarSelect = (viewKey) => {
    setActiveView(viewKey);
    setSidebarOpen(false);
  };

  const openEventFollowUpMessage = () => {
    const context = nextEvent
      ? `${nextEvent.title} on ${nextEvent.date} at ${nextEvent.time} (${nextEvent.location})`
      : 'upcoming school activities';
    setMessageDraft(`Hello School Office, kindly confirm details for ${childName}'s ${context}. Thank you.`);
    setActiveView('messages');
  };

  const handleNotificationSelect = (notificationId) => {
    const selected = notifications.find((item) => item.id === notificationId);
    updateSelectedChild((child) => ({
      ...child,
      notifications: child.notifications.map((item) => (
        item.id === notificationId ? { ...item, unread: false } : item
      ))
    }));

    if (selected?.view) {
      setActiveView(selected.view);
    }
  };

  const markAllNotificationsAsRead = () => {
    updateSelectedChild((child) => ({
      ...child,
      notifications: child.notifications.map((item) => ({ ...item, unread: false }))
    }));
  };

  const openFeeReminderMessage = () => {
    const topOutstanding = feeItems
      .map((item) => ({ ...item, balance: Math.max(item.billed - item.paid, 0) }))
      .filter((item) => item.balance > 0)
      .sort((left, right) => right.balance - left.balance)[0];

    const reminderLine = topOutstanding
      ? `Outstanding item: ${topOutstanding.item} (${topOutstanding.balance.toLocaleString()} FCFA, due ${topOutstanding.dueDate}).`
      : 'All fee items are currently settled.';

    setMessageDraft(
      `Hello Bursar Office, kindly confirm ${childName}'s updated statement of account. ${reminderLine}`
    );
    setActiveView('messages');
  };

  const downloadFeeStructureCsv = () => {
    const rows = [
      ['Student', 'Class', 'Fee Item', 'Term', 'Billed', 'Paid', 'Balance', 'Due Date', 'Status'],
      ...filteredFeeItems.map((item) => {
        const balance = Math.max(item.billed - item.paid, 0);
        return [
          childName,
          className,
          item.item,
          item.term,
          item.billed,
          item.paid,
          balance,
          item.dueDate,
          feeStatusResolver(item)
        ];
      })
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${childName.replace(/\s+/g, '_')}_fee_structure.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPaymentHistoryCsv = () => {
    const rows = [
      ['Student', 'Class', 'Date', 'Amount', 'Method', 'Reference', 'Fee Item', 'Payer Name', 'Payer Phone', 'Status'],
      ...filteredPaymentHistory.map((item) => [
        childName,
        className,
        item.date,
        item.amount,
        item.method,
        item.reference,
        item.feeItem || 'N/A',
        item.payerName || 'N/A',
        item.payerPhone || 'N/A',
        item.status
      ])
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${childName.replace(/\s+/g, '_')}_payment_history.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadReceipt = (paymentItem) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const cardX = 56;
    const cardY = 70;
    const cardWidth = pageWidth - 112;
    const cardHeight = 560;

    doc.setFillColor(246, 249, 252);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 12, 12, 'F');

    doc.setDrawColor(208, 213, 221);
    doc.setLineWidth(1);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 12, 12, 'S');

    doc.setFillColor(21, 112, 239);
    doc.roundedRect(cardX, cardY, cardWidth, 70, 12, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('EduIgnite Secondary School', cardX + 24, cardY + 30);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Fee Payment Receipt', cardX + 24, cardY + 50);

    doc.setTextColor(16, 24, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Receipt Card', cardX + 24, cardY + 102);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 84, 103);
    doc.text(`Receipt ID: RCPT-${paymentItem.id}`, cardX + cardWidth - 170, cardY + 102);

    const detailStartY = cardY + 132;
    const lineHeight = 28;

    const leftColumn = [
      ['Student', childName],
      ['Class', className],
      ['Payer Name', paymentItem.payerName || 'N/A'],
      ['Payer Phone', paymentItem.payerPhone || 'N/A'],
      ['Fee Item', paymentItem.feeItem || 'N/A']
    ];

    const rightColumn = [
      ['Date', paymentItem.date],
      ['Method', paymentItem.method],
      ['Reference', paymentItem.reference],
      ['Amount', `${paymentItem.amount.toLocaleString()} FCFA`],
      ['Status', paymentItem.status]
    ];

    leftColumn.forEach(([label, value], index) => {
      const y = detailStartY + (index * lineHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(52, 64, 84);
      doc.text(`${label}:`, cardX + 24, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 24, 40);
      doc.text(String(value), cardX + 105, y);
    });

    rightColumn.forEach(([label, value], index) => {
      const y = detailStartY + (index * lineHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(52, 64, 84);
      doc.text(`${label}:`, cardX + cardWidth / 2 + 10, y);

      if (label === 'Status') {
        const isSuccessful = String(value).toLowerCase() === 'successful';
        doc.setFillColor(isSuccessful ? 236 : 254, isSuccessful ? 253 : 243, isSuccessful ? 243 : 242);
        doc.setDrawColor(isSuccessful ? 171 : 254, isSuccessful ? 239 : 205, isSuccessful ? 198 : 202);
        doc.roundedRect(cardX + cardWidth / 2 + 70, y - 11, 88, 18, 8, 8, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(isSuccessful ? 2 : 180, isSuccessful ? 122 : 35, isSuccessful ? 72 : 24);
        doc.text(String(value), cardX + cardWidth / 2 + 84, y + 1);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(16, 24, 40);
        doc.text(String(value), cardX + cardWidth / 2 + 70, y);
      }
    });

    const amountCardY = detailStartY + (lineHeight * 6) + 18;
    doc.setFillColor(239, 248, 255);
    doc.setDrawColor(185, 230, 254);
    doc.roundedRect(cardX + 24, amountCardY, cardWidth - 48, 78, 10, 10, 'FD');

    doc.setTextColor(23, 92, 211);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total Received', cardX + 44, amountCardY + 30);
    doc.setFontSize(24);
    doc.text(`${paymentItem.amount.toLocaleString()} FCFA`, cardX + 44, amountCardY + 60);

    const notesY = amountCardY + 110;
    doc.setTextColor(52, 64, 84);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes', cardX + 24, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 84, 103);
    doc.text(
      'This document confirms payment received by EduIgnite School. Keep this receipt for reference during fee reconciliation and administrative follow-up.',
      cardX + 24,
      notesY + 18,
      { maxWidth: cardWidth - 48, lineHeightFactor: 1.4 }
    );

    doc.setDrawColor(208, 213, 221);
    doc.line(cardX + 24, cardY + cardHeight - 78, cardX + cardWidth - 24, cardY + cardHeight - 78);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(102, 112, 133);
    doc.text(`Generated on ${new Date().toLocaleString()}`, cardX + 24, cardY + cardHeight - 54);
    doc.text('Accounts Office • EduIgnite School', cardX + cardWidth - 170, cardY + cardHeight - 54);

    doc.save(`${childName.replace(/\s+/g, '_')}_receipt_${paymentItem.reference || paymentItem.id}.pdf`);
  };

  const markInvoicePaid = (id) => {
    updateSelectedChild((child) => ({
      ...child,
      invoices: child.invoices.map((item) => (
        item.id === id ? { ...item, status: 'Paid' } : item
      )),
      notifications: [
        {
          id: Date.now(),
          title: 'Invoice status updated to paid',
          date: new Date().toISOString().slice(0, 10),
          unread: true,
          view: 'invoices'
        },
        ...child.notifications
      ]
    }));
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const content = messageDraft.trim();

    if (!content) {
      alert('Please write a message before sending.');
      return;
    }

    const newMessage = {
      id: Date.now(),
      from: `You (${profileForEdit.name})`,
      preview: content,
      date: new Date().toISOString().slice(0, 10)
    };

    updateSelectedChild((child) => ({
      ...child,
      messages: [newMessage, ...child.messages]
    }));
    setMessageDraft('');
  };

  const saveSettings = (event) => {
    event.preventDefault();
    setSavedSettingsSnapshot({ ...settingsDraft });
    setSettingsLastSavedAt(new Date().toLocaleString());
    alert('Parent settings saved successfully.');
  };

  const revertParentSettings = () => {
    setSettingsDraft({ ...savedSettingsSnapshot });
  };

  const loadDefaultParentSettings = () => {
    setSettingsDraft({ ...DEFAULT_PARENT_SETTINGS });
  };

  const renderMain = () => {
    switch (activeView) {
      case 'academic-results':
        return (
          <section className="analytics-card parent-panel">
            <div className="section-header">
              <h2>Academic Results</h2>
            </div>

            <div className="parent-results-controls">
              <label>
                Academic Year
                <select
                  value={selectedAcademicYear}
                  onChange={(event) => {
                    const nextYear = event.target.value;
                    setSelectedAcademicYear(nextYear);

                    const nextTerm = academicRecords.find((item) => item.year === nextYear)?.term || '';
                    setSelectedAcademicTerm(nextTerm);

                    const nextSequence = academicRecords.find((item) => item.year === nextYear && item.term === nextTerm)?.sequence || '';
                    setSelectedAcademicSequence(nextSequence);
                  }}
                >
                  {academicYearOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Term
                <select
                  value={selectedAcademicTerm}
                  onChange={(event) => {
                    const nextTerm = event.target.value;
                    setSelectedAcademicTerm(nextTerm);

                    const nextSequence = academicRecords.find((item) => (
                      item.year === selectedAcademicYear && item.term === nextTerm
                    ))?.sequence || '';
                    setSelectedAcademicSequence(nextSequence);
                  }}
                >
                  {academicTermOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Sequence
                <select
                  value={selectedAcademicSequence}
                  onChange={(event) => setSelectedAcademicSequence(event.target.value)}
                >
                  {academicSequenceOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="parent-results-summary">
              <div>
                <span>Weighted Average (/20)</span>
                <strong>{selectedAcademicRecord ? weightedAverage : `${resultAverage}`}</strong>
              </div>
              <div>
                <span>Class Position</span>
                <strong>
                  {selectedAcademicRecord
                    ? `${selectedAcademicRecord.classRank}/${selectedAcademicRecord.classSize}`
                    : 'N/A'}
                </strong>
              </div>
              <div>
                <span>Pass Rate</span>
                <strong>{passRate}%</strong>
              </div>
            </div>

            <div className="parent-result-highlights">
              <article>
                <h4>Best Subject</h4>
                <p>{bestSubject.subject}</p>
                <span>{bestSubject.total}/20</span>
              </article>
              <article>
                <h4>Needs Reinforcement</h4>
                <p>{weakestSubject.subject}</p>
                <span>{weakestSubject.total}/20</span>
              </article>
              <article>
                <h4>Council Decision</h4>
                <p>{selectedAcademicRecord?.councilDecision || 'N/A'}</p>
                <span>{selectedAcademicRecord?.conduct || 'Conduct N/A'}</span>
              </article>
            </div>

            <div className="parent-academic-remark">
              <strong>Class Council Remark</strong>
              <p>
                {selectedAcademicRecord?.remark
                  || 'No class council remark available for this selected period.'}
              </p>
            </div>

            <div className="parent-academic-remark" style={{ marginTop: 12 }}>
              <strong>Published Report Cards (View Only)</strong>
              {!selectedChildPublishedCards.length && (
                <p>No admin-published report cards available for this child yet.</p>
              )}
              {selectedChildPublishedCards.map((card) => (
                <div key={`parent-published-${card.id}`} style={{ marginTop: 10, borderTop: '1px solid #eaecf0', paddingTop: 10 }}>
                  <p><strong>{card.academicYear} • {card.term} • {card.sequence}</strong></p>
                  <p>Average: {Number(card.average || 0).toFixed(1)}/20 • Rank: {card.rank}/{card.classSize} • Published: {card.publishedAt}</p>
                  <div className="parent-table-wrap" style={{ marginTop: 8 }}>
                    <table className="parent-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Mark</th>
                          <th>Grade</th>
                          <th>Coef</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(card.subjects || []).map((subject) => (
                          <tr key={`${card.id}-${subject.subject}`}>
                            <td>{subject.subject}</td>
                            <td>{subject.score}/20</td>
                            <td>{subject.grade}</td>
                            <td>{subject.coefficient}</td>
                          </tr>
                        ))}
                        {!(card.subjects || []).length && (
                          <tr>
                            <td colSpan="4">No subject details available.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="parent-table-wrap">
              <table className="parent-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Coef</th>
                    <th>Exam</th>
                    <th>Total</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAcademicSubjects.map((item) => (
                    <tr key={item.id}>
                      <td>{item.subject}</td>
                      <td>{item.coefficient || 1}</td>
                      <td>{item.exam}/20</td>
                      <td>{item.total}/20</td>
                      <td>{item.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );

      case 'attendance':
        return (
          <section className="analytics-card parent-panel">
            <div className="section-header">
              <h2>Attendance</h2>
              <div className="parent-attendance-actions">
                <button type="button" className="row-action" onClick={openAttendanceFollowUpMessage}>Follow Up</button>
                <button type="button" className="row-action" onClick={downloadAttendanceReport}>Download CSV</button>
              </div>
            </div>

            <div className="parent-results-controls parent-attendance-controls">
              <label>
                Status
                <select value={attendanceStatusFilter} onChange={(event) => setAttendanceStatusFilter(event.target.value)}>
                  <option>All</option>
                  <option>Present</option>
                  <option>Late</option>
                  <option>Absent</option>
                </select>
              </label>

              <label>
                Date Range
                <select value={attendanceRangeFilter} onChange={(event) => setAttendanceRangeFilter(event.target.value)}>
                  <option>All</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </label>

              <label>
                Search Date (YYYY-MM-DD)
                <input
                  type="text"
                  value={attendanceDateQuery}
                  onChange={(event) => setAttendanceDateQuery(event.target.value)}
                  placeholder="e.g. 2026-03"
                />
              </label>
            </div>

            <div className="parent-attendance-metrics">
              <article>
                <h4>Present</h4>
                <p>{presentCount}</p>
              </article>
              <article>
                <h4>Late</h4>
                <p>{lateCount}</p>
              </article>
              <article>
                <h4>Absent</h4>
                <p>{absentCount}</p>
              </article>
              <article>
                <h4>Punctuality Rate</h4>
                <p>{punctualityRate}%</p>
              </article>
            </div>

            {attendanceAlerts.length > 0 && (
              <ul className="parent-attendance-alerts">
                {attendanceAlerts.map((alertItem) => (
                  <li key={alertItem}>{alertItem}</li>
                ))}
              </ul>
            )}

            <div className="parent-results-summary">
              <div>
                <span>Attendance Rate</span>
                <strong>{attendanceRate}%</strong>
              </div>
              <div>
                <span>Present Days</span>
                <strong>{attendanceItems.filter((item) => item.status === 'Present').length}</strong>
              </div>
              <div>
                <span>Absences</span>
                <strong>{attendanceItems.filter((item) => item.status === 'Absent').length}</strong>
              </div>
            </div>

            <div className="parent-table-wrap">
              <table className="parent-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendanceItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>
                        <span className={`attendance-status ${item.status.toLowerCase()}`}>{item.status}</span>
                      </td>
                      <td>{item.remark}</td>
                    </tr>
                  ))}
                  {filteredAttendanceItems.length === 0 && (
                    <tr>
                      <td colSpan="3" className="attendance-empty">No attendance record matches the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );

      case 'timetable':
        return (
          <section className="analytics-card parent-panel">
            <div className="section-header">
              <h2>Timetable</h2>
              <div className="parent-attendance-actions">
                <button type="button" className="row-action" onClick={openTimetableFollowUpMessage}>Follow Up</button>
                <button type="button" className="row-action" onClick={downloadTimetableCsv}>Download CSV</button>
              </div>
            </div>

            <div className="parent-results-controls parent-timetable-controls">
              <label>
                View Mode
                <select value={timetableViewMode} onChange={(event) => setTimetableViewMode(event.target.value)}>
                  <option>Weekly</option>
                  <option>Daily</option>
                </select>
              </label>

              <label>
                Day
                <select value={selectedTimetableDay} onChange={(event) => setSelectedTimetableDay(event.target.value)}>
                  {timetableDayOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Search Subject
                <input
                  type="text"
                  value={timetableSubjectQuery}
                  onChange={(event) => setTimetableSubjectQuery(event.target.value)}
                  placeholder="e.g. Math, English"
                />
              </label>
            </div>

            <div className="parent-timetable-metrics">
              <article>
                <h4>School Days</h4>
                <p>{normalizedTimetableRows.length}</p>
              </article>
              <article>
                <h4>Total Periods</h4>
                <p>{normalizedTimetableRows.length * timetablePeriodDefinitions.length}</p>
              </article>
              <article>
                <h4>Unique Subjects</h4>
                <p>{timetableUniqueSubjects.length}</p>
              </article>
              <article>
                <h4>Next Class</h4>
                <p>{nextClassSlot ? `${nextClassSlot.subject} (${nextClassSlot.day})` : 'N/A'}</p>
              </article>
            </div>

            <div className="parent-timetable-load">
              <h4>Subject Load (Periods / Week)</h4>
              <ul>
                {timetableSubjectLoad.map(([subject, count]) => (
                  <li key={subject}><span>{subject}</span><strong>{count}</strong></li>
                ))}
              </ul>
            </div>

            {timetableViewMode === 'Daily' ? (
              <div className="parent-timetable-daily">
                <h4>{effectiveTimetableDay} Schedule</h4>
                <div className="parent-table-wrap">
                  <table className="parent-table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Time</th>
                        <th>Subject</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyTimetableSlots.map((slot) => (
                        <tr key={slot.key}>
                          <td>{slot.label}</td>
                          <td>{slot.time}</td>
                          <td>{slot.subject}</td>
                        </tr>
                      ))}
                      {dailyTimetableSlots.length === 0 && (
                        <tr>
                          <td colSpan="3" className="attendance-empty">No subjects match the selected filters for this day.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="parent-table-wrap">
                <table className="parent-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Period 1</th>
                      <th>Period 2</th>
                      <th>Period 3</th>
                      <th>Period 4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTimetableRows.map((item) => (
                      <tr key={item.id}>
                        <td>{item.day}</td>
                        <td>{item.slots[0].subject}</td>
                        <td>{item.slots[1].subject}</td>
                        <td>{item.slots[2].subject}</td>
                        <td>{item.slots[3].subject}</td>
                      </tr>
                    ))}
                    {filteredTimetableRows.length === 0 && (
                      <tr>
                        <td colSpan="5" className="attendance-empty">No timetable row matches the selected filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );

      case 'fees-payments':
        return (
          <section className="analytics-card parent-panel">
            <div className="section-header">
              <h2>Fees & Payments</h2>
              <div className="parent-attendance-actions">
                <button type="button" className="row-action" onClick={openFeeReminderMessage}>Follow Up</button>
                <button type="button" className="row-action" onClick={downloadFeeStructureCsv}>Export Fees</button>
                <button type="button" className="row-action" onClick={downloadPaymentHistoryCsv}>Export Payments</button>
              </div>
            </div>

            <div className="parent-results-summary">
              <div>
                <span>Total Outstanding</span>
                <strong>{totalBalance.toLocaleString()} FCFA</strong>
              </div>
              <div>
                <span>Last Payment</span>
                <strong>{paymentHistory[0] ? `${paymentHistory[0].amount.toLocaleString()} FCFA` : 'N/A'}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>{paymentHistory[0]?.method || 'N/A'}</strong>
              </div>
            </div>

            <div className="parent-fee-metrics">
              <article>
                <h4>Total Billed</h4>
                <p>{totalBilled.toLocaleString()} FCFA</p>
              </article>
              <article>
                <h4>Collection Rate</h4>
                <p>{feeCompletionRate}%</p>
              </article>
              <article>
                <h4>Overdue Fee Items</h4>
                <p>{overdueFeeCount}</p>
              </article>
            </div>

            <div className="parent-results-controls parent-fees-controls">
              <label>
                Term
                <select value={feeTermFilter} onChange={(event) => setFeeTermFilter(event.target.value)}>
                  {feeTermOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Fee Status
                <select value={feeStatusFilter} onChange={(event) => setFeeStatusFilter(event.target.value)}>
                  <option>All Status</option>
                  <option>Paid</option>
                  <option>Partial</option>
                  <option>Unpaid</option>
                </select>
              </label>

              <label>
                Search Fee Item
                <input
                  type="text"
                  value={feeSearchQuery}
                  onChange={(event) => setFeeSearchQuery(event.target.value)}
                  placeholder="e.g. Tuition, Transport"
                />
              </label>
            </div>

            <div className="parent-table-wrap">
              <table className="parent-table">
                <thead>
                  <tr>
                    <th>Fee Item</th>
                    <th>Term</th>
                    <th>Billed</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeeItems.map((item) => {
                    const balance = Math.max(item.billed - item.paid, 0);
                    const status = feeStatusResolver(item);
                    return (
                      <tr key={item.id}>
                        <td>{item.item}</td>
                        <td>{item.term}</td>
                        <td>{item.billed.toLocaleString()} FCFA</td>
                        <td>{item.paid.toLocaleString()} FCFA</td>
                        <td>{balance.toLocaleString()} FCFA</td>
                        <td>{item.dueDate}</td>
                        <td><span className={`fee-status ${status.toLowerCase()}`}>{status}</span></td>
                      </tr>
                    );
                  })}
                  {filteredFeeItems.length === 0 && (
                    <tr>
                      <td colSpan="7" className="attendance-empty">No fee item matches the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="parent-payment-disabled-note">
              Parents cannot make payments on this platform. Please contact the bursar office or use approved school payment channels.
            </div>

            <div className="parent-results-controls parent-fees-controls">
              <label>
                Payment Method Filter
                <select value={paymentMethodFilter} onChange={(event) => setPaymentMethodFilter(event.target.value)}>
                  {paymentMethodOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="parent-table-wrap">
              <table className="parent-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Fee Item</th>
                    <th>Payer</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaymentHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>{item.amount.toLocaleString()} FCFA</td>
                      <td>{item.method}</td>
                      <td>{item.reference}</td>
                      <td>{item.feeItem || 'N/A'}</td>
                      <td>{item.payerName || 'N/A'}</td>
                      <td>{item.status}</td>
                      <td><button type="button" className="row-action" onClick={() => downloadReceipt(item)}>Receipt</button></td>
                    </tr>
                  ))}
                  {filteredPaymentHistory.length === 0 && (
                    <tr>
                      <td colSpan="8" className="attendance-empty">No payment matches the selected filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );


      case 'invoices':
        return (
          <section className="analytics-card parent-panel">
            <div className="section-header">
              <h2>Invoices</h2>
              <div className="parent-attendance-actions">
                <button type="button" className="row-action" onClick={openInvoiceFollowUpMessage}>Follow Up</button>
                <button type="button" className="row-action" onClick={exportInvoicesCsv}>Export CSV</button>
              </div>
            </div>

            <div className="parent-results-summary">
              <div>
                <span>Total Invoice Value</span>
                <strong>{totalInvoiceAmount.toLocaleString()} FCFA</strong>
              </div>
              <div>
                <span>Pending Invoices</span>
                <strong>{unpaidInvoiceAmount.toLocaleString()} FCFA</strong>
              </div>
              <div>
                <span>Collection Rate</span>
                <strong>{invoiceCollectionRate}%</strong>
              </div>
            </div>

            <div className="parent-fee-metrics">
              <article>
                <h4>Paid Invoices</h4>
                <p>{invoices.filter((item) => item.status === 'Paid').length}</p>
              </article>
              <article>
                <h4>Unpaid Invoices</h4>
                <p>{invoices.filter((item) => item.status === 'Unpaid').length}</p>
              </article>
              <article>
                <h4>Overdue Invoices</h4>
                <p>{overdueInvoices.length}</p>
              </article>
            </div>

            <div className="parent-results-controls parent-fees-controls">
              <label>
                Term
                <select value={invoiceTermFilter} onChange={(event) => setInvoiceTermFilter(event.target.value)}>
                  {invoiceTermOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select value={invoiceStatusFilter} onChange={(event) => setInvoiceStatusFilter(event.target.value)}>
                  <option>All Status</option>
                  <option>Paid</option>
                  <option>Unpaid</option>
                </select>
              </label>

              <label>
                Search Invoice
                <input
                  type="text"
                  value={invoiceSearchQuery}
                  onChange={(event) => setInvoiceSearchQuery(event.target.value)}
                  placeholder="Invoice number, title or date"
                />
              </label>
            </div>

            <div className="parent-table-wrap">
              <table className="parent-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Title</th>
                    <th>Term</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((item) => (
                    <tr key={item.id}>
                      <td>{item.invoiceNo}</td>
                      <td>{item.title}</td>
                      <td>{inferInvoiceTerm(item)}</td>
                      <td>{item.dueDate}</td>
                      <td>{item.amount.toLocaleString()} FCFA</td>
                      <td>{item.status === 'Paid' ? '0 FCFA' : `${item.amount.toLocaleString()} FCFA`}</td>
                      <td>
                        <span className={`fee-status ${item.status.toLowerCase()}`}>{item.status}</span>
                      </td>
                      <td>
                        {item.status === 'Unpaid' ? (
                          <button type="button" className="row-action" onClick={() => markInvoicePaid(item.id)}>Mark Paid</button>
                        ) : (
                          <span className="row-tag">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan="8" className="attendance-empty">No invoice matches the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );

      case 'announcements':
        return (
          <Announcements
            announcements={announcements}
            activeAnnouncementId={selectedAnnouncementId}
            onSelectAnnouncement={setSelectedAnnouncementId}
            canCreateAnnouncement={false}
            canManageAnnouncement={false}
          />
        );

      case 'events-calendar':
        return (
          <section className="analytics-card parent-panel">
            <div className="section-header">
              <h2>Events & Calendar</h2>
              <div className="parent-attendance-actions">
                <button type="button" className="row-action" onClick={openEventFollowUpMessage}>Follow Up</button>
                <button type="button" className="row-action" onClick={() => setActiveView('notifications')}>View Related Alerts</button>
              </div>
            </div>

            <div className="parent-results-summary parent-events-summary">
              <div>
                <span>Scheduled Events</span>
                <strong>{filteredEvents.length}</strong>
              </div>
              <div>
                <span>Next Event</span>
                <strong>{nextEvent ? nextEvent.date : 'N/A'}</strong>
              </div>
              <div>
                <span>Next Location</span>
                <strong>{nextEvent ? nextEvent.location : 'N/A'}</strong>
              </div>
            </div>

            <div className="parent-results-controls parent-events-controls">
              <label>
                Search Events
                <input
                  type="text"
                  value={eventsSearchQuery}
                  onChange={(event) => setEventsSearchQuery(event.target.value)}
                  placeholder="Title, location, date, time"
                />
              </label>
              <label>
                Month
                <select value={eventsMonthFilter} onChange={(event) => setEventsMonthFilter(event.target.value)}>
                  {eventMonthOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                Sort
                <select value={eventsSortBy} onChange={(event) => setEventsSortBy(event.target.value)}>
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                </select>
              </label>
            </div>

            <ul className="parent-event-list">
              {filteredEvents.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.location}</p>
                  </div>
                  <span>{item.date} • {item.time}</span>
                </li>
              ))}
              {filteredEvents.length === 0 && (
                <li>
                  <div>
                    <strong>No event found</strong>
                    <p>No school event matches your current filters.</p>
                  </div>
                </li>
              )}
            </ul>
          </section>
        );

      case 'messages':
        return (
          <section className="analytics-card parent-panel">
            <div className="section-header">
              <h2>Messages</h2>
            </div>

            <div className="parent-results-summary parent-messages-summary">
              <div>
                <span>Total Messages</span>
                <strong>{messageStats.total}</strong>
              </div>
              <div>
                <span>From Teachers</span>
                <strong>{messageStats.teacher}</strong>
              </div>
              <div>
                <span>From Admin Offices</span>
                <strong>{messageStats.admin}</strong>
              </div>
              <div>
                <span>In View</span>
                <strong>{filteredMessages.length}</strong>
              </div>
            </div>

            <div className="parent-results-controls parent-message-controls">
              <label>
                Search Conversation
                <input
                  type="text"
                  value={messageSearchQuery}
                  onChange={(event) => setMessageSearchQuery(event.target.value)}
                  placeholder="Search sender, content, date"
                />
              </label>
              <label>
                Sort
                <select value={messageSortBy} onChange={(event) => setMessageSortBy(event.target.value)}>
                  <option value="recent">Most Recent</option>
                  <option value="sender">Sender</option>
                </select>
              </label>
              <label>
                Quick Templates
                <select
                  value=""
                  onChange={(event) => {
                    const template = event.target.value;
                    if (!template) return;
                    setMessageDraft(template);
                    event.target.value = '';
                  }}
                >
                  <option value="">Select template</option>
                  <option value={`Hello Class Teacher, kindly share ${childName}'s behavior update for this week.`}>Teacher update request</option>
                  <option value={`Hello Bursar Office, kindly confirm ${childName}'s current statement and pending balances.`}>Invoice follow-up</option>
                  <option value={`Hello School Office, please confirm details for upcoming events involving ${childName}.`}>Event confirmation</option>
                </select>
              </label>
            </div>

            <div className="admin-actions" style={{ marginBottom: 10 }}>
              <button
                type="button"
                className="row-action"
                onClick={() => {
                  setMessageSearchQuery('');
                  setMessageSortBy('recent');
                }}
              >
                Reset Filters
              </button>
            </div>

            <form className="parent-message-form" onSubmit={sendMessage}>
              <textarea
                rows={3}
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="Write a message to class teacher, principal, or bursar..."
              />
              <button type="submit"><FaPaperPlane /> Send Message</button>
            </form>

            <div className="parent-table-wrap">
              <table className="parent-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Message</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((item) => (
                    <tr key={item.id}>
                      <td>{item.from}</td>
                      <td>{item.preview}</td>
                      <td>{item.date}</td>
                    </tr>
                  ))}
                  {!filteredMessages.length && (
                    <tr>
                      <td colSpan="3" className="attendance-empty">No message matches your current search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );

      case 'notifications':
        return (
          <section className="analytics-card parent-panel">
            <div className="section-header">
              <h2>Notifications</h2>
              <button type="button" className="view-all" onClick={markAllNotificationsAsRead}>Mark all as read</button>
            </div>

            <div className="parent-results-summary parent-notification-summary">
              <div>
                <span>Total Notifications</span>
                <strong>{notifications.length}</strong>
              </div>
              <div>
                <span>Unread</span>
                <strong>{unreadNotificationCount}</strong>
              </div>
              <div>
                <span>Read</span>
                <strong>{notifications.length - unreadNotificationCount}</strong>
              </div>
            </div>

            <div className="parent-results-controls parent-notification-controls">
              <label>
                Search Notifications
                <input
                  type="text"
                  value={notificationSearchQuery}
                  onChange={(event) => setNotificationSearchQuery(event.target.value)}
                  placeholder="Title or date"
                />
              </label>
              <label>
                Status
                <select value={notificationStatusFilter} onChange={(event) => setNotificationStatusFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </label>
              <label>
                Sort
                <select value={notificationSortBy} onChange={(event) => setNotificationSortBy(event.target.value)}>
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </label>
            </div>

            <ul className="parent-notification-list">
              {filteredNotifications.map((item) => (
                <li key={item.id} className={item.unread ? 'unread' : ''}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.date}</small>
                  </div>
                  <button type="button" onClick={() => handleNotificationSelect(item.id)}>Open</button>
                </li>
              ))}
              {filteredNotifications.length === 0 && (
                <li>
                  <div>
                    <strong>No notification found</strong>
                    <small>No notification matches your current filters.</small>
                  </div>
                </li>
              )}
            </ul>
          </section>
        );

      case 'profile':
        return (
          <div className="parent-profile-layout">
            <section className="analytics-card parent-panel">
              <div className="section-header">
                <h2>Profile</h2>
              </div>
              <EditProfile profile={profileForEdit} onSaveProfile={onSaveProfile} />
            </section>

            <section className="analytics-card parent-panel parent-profile-side">
              <div className="section-header">
                <h2>Parent Overview</h2>
              </div>
              <div className="parent-profile-overview">
                <img src={profileForEdit.avatar} alt={profileForEdit.name} />
                <div>
                  <h3>{profileForEdit.name}</h3>
                  <p>{profileForEdit.matricule}</p>
                </div>
              </div>
              <div className="parent-profile-metrics">
                <article>
                  <FaCalendarAlt />
                  <div>
                    <h4>Upcoming Events</h4>
                    <p>{events.length}</p>
                  </div>
                </article>
                <article>
                  <FaEnvelope />
                  <div>
                    <h4>Messages</h4>
                    <p>{messages.length}</p>
                  </div>
                </article>
                <article>
                  <FaBell />
                  <div>
                    <h4>Unread Alerts</h4>
                    <p>{unreadNotificationCount}</p>
                  </div>
                </article>
              </div>
              <div className="parent-attendance-actions">
                <button type="button" className="row-action" onClick={() => setActiveView('settings')}>Open Settings</button>
                <button type="button" className="row-action" onClick={() => setActiveView('messages')}>Open Messages</button>
              </div>
            </section>
          </div>
        );

      case 'settings':
        return (
          <section className="analytics-card parent-panel">
            <div className="section-header">
              <h2>Settings</h2>
            </div>

            <div className="parent-results-summary parent-settings-summary">
              <div>
                <span>Notification Channels</span>
                <strong>{settingsDraft.emailNotifications && settingsDraft.smsNotifications ? 'Email + SMS' : settingsDraft.emailNotifications ? 'Email only' : settingsDraft.smsNotifications ? 'SMS only' : 'Disabled'}</strong>
              </div>
              <div>
                <span>Language</span>
                <strong>{settingsDraft.language}</strong>
              </div>
              <div>
                <span>Last Saved</span>
                <strong>{settingsLastSavedAt}</strong>
              </div>
            </div>

            <form className="parent-settings-form" onSubmit={saveSettings}>
              <div className="parent-settings-grid">
                <article className="parent-settings-box">
                  <h3>Notifications</h3>
                  <label>
                    <input
                      type="checkbox"
                      checked={settingsDraft.emailNotifications}
                      onChange={(event) => setSettingsDraft((prev) => ({ ...prev, emailNotifications: event.target.checked }))}
                    />
                    Email notifications
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={settingsDraft.smsNotifications}
                      onChange={(event) => setSettingsDraft((prev) => ({ ...prev, smsNotifications: event.target.checked }))}
                    />
                    SMS notifications
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={settingsDraft.invoiceReminders}
                      onChange={(event) => setSettingsDraft((prev) => ({ ...prev, invoiceReminders: event.target.checked }))}
                    />
                    Invoice reminders
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={settingsDraft.attendanceAlerts}
                      onChange={(event) => setSettingsDraft((prev) => ({ ...prev, attendanceAlerts: event.target.checked }))}
                    />
                    Attendance alerts
                  </label>
                </article>

                <article className="parent-settings-box">
                  <h3>Localization</h3>
                  <label className="select-label">
                    Language
                    <select
                      value={settingsDraft.language}
                      onChange={(event) => setSettingsDraft((prev) => ({ ...prev, language: event.target.value }))}
                    >
                      <option>English</option>
                      <option>French</option>
                    </select>
                  </label>

                  <label className="select-label">
                    Timezone
                    <select
                      value={settingsDraft.timezone}
                      onChange={(event) => setSettingsDraft((prev) => ({ ...prev, timezone: event.target.value }))}
                    >
                      <option>Africa/Douala</option>
                      <option>Africa/Lagos</option>
                      <option>Europe/Paris</option>
                    </select>
                  </label>

                  <div className="parent-settings-health">
                    <p><FaCheckCircle /> Invoice reminders: {settingsDraft.invoiceReminders ? 'On' : 'Off'}</p>
                    <p><FaClock /> Timezone: {settingsDraft.timezone}</p>
                    <p><FaUserShield /> Alerts guard: {settingsDraft.attendanceAlerts ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </article>
              </div>

              <div className={`parent-settings-status ${hasUnsavedSettings ? 'pending' : 'synced'}`}>
                {hasUnsavedSettings ? 'Unsaved changes detected' : `Settings synced • ${settingsLastSavedAt}`}
              </div>

              <div className="parent-attendance-actions">
                <button type="submit">Save Settings</button>
                <button type="button" className="row-action" onClick={revertParentSettings}>Revert</button>
                <button type="button" className="row-action" onClick={loadDefaultParentSettings}>Load Defaults</button>
              </div>
            </form>
          </section>
        );

      default:
        return (
          <>
            <section className="analytics-card parent-child-switcher">
              <label htmlFor="child-selector">Select Student</label>
              <select
                id="child-selector"
                value={selectedChildId}
                onChange={(event) => setSelectedChildId(Number(event.target.value))}
              >
                {childrenData.map((child) => (
                  <option key={child.id} value={child.id}>{child.name} • {child.className}</option>
                ))}
              </select>
            </section>

            <section className="welcome">
              <div className="welcome-text">
                <h1>Welcome, {profileForEdit.name}!</h1>
                <p>Parent Portal • Monitoring {childName} ({className})</p>
              </div>
              <img className="welcome-avatar" src={profileForEdit.avatar} alt={profileForEdit.name} />
            </section>

            <section className="stats-cards">
              <div className="card" onClick={() => setActiveView('academic-results')}>
                <div className="card-icon"><FaChartLine /></div>
                <div>
                  <h3>{resultAverage}/20 Average</h3>
                  <p>Academic Results</p>
                </div>
              </div>
              <div className="card" onClick={() => setActiveView('attendance')}>
                <div className="card-icon"><FaClipboardCheck /></div>
                <div>
                  <h3>{attendanceRate}% Attendance</h3>
                  <p>Attendance Overview</p>
                </div>
              </div>
              <div className="card" onClick={() => setActiveView('invoices')}>
                <div className="card-icon"><FaWallet /></div>
                <div>
                  <h3>{totalUnpaid.toLocaleString()} FCFA</h3>
                  <p>Outstanding Fees</p>
                </div>
              </div>
              <div className="card" onClick={() => setActiveView('messages')}>
                <div className="card-icon"><FaEnvelope /></div>
                <div>
                  <h3>{messages.length} Messages</h3>
                  <p>Recent Communication</p>
                </div>
              </div>
            </section>

            <section className="analytics-section">
              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="section-header">
                    <h2>Recent Results Snapshot</h2>
                  </div>
                  <div className="chart-list">
                    {resultItems.map((item) => (
                      <div key={item.id} className="chart-row">
                        <div className="chart-row-top">
                          <span>{item.subject}</span>
                          <strong>{item.total}/20</strong>
                        </div>
                        <div className="chart-track">
                          <div className="chart-fill" style={{ width: `${(item.total / 20) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="section-header">
                    <h2>Upcoming Invoices</h2>
                  </div>
                  <ul className="parent-mini-list">
                    {invoices.filter((item) => item.status === 'Unpaid').map((item) => (
                      <li key={item.id}>
                        <strong>{item.title}</strong>
                        <span>{item.amount.toLocaleString()} FCFA • due {item.dueDate}</span>
                      </li>
                    ))}
                    {invoices.filter((item) => item.status === 'Unpaid').length === 0 && (
                      <li>
                        <strong>No pending invoice</strong>
                        <span>All invoices are paid for {childName}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
          </>
        );
    }
  };

  const titleMap = {
    dashboard: 'Dashboard',
    'academic-results': 'Academic Results',
    attendance: 'Attendance',
    timetable: 'Timetable',
    'fees-payments': 'Fees & Payments',
    invoices: 'Invoices',
    announcements: 'Announcements',
    'events-calendar': 'Events & Calendar',
    messages: 'Messages',
    notifications: 'Notifications',
    profile: 'Profile',
    settings: 'Settings'
  };

  const showRightColumn = activeView === 'dashboard';

  return (
    <div className="dashboard-container">
      <ParentSidebar
        active={activeView}
        onSelect={handleSidebarSelect}
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}
      />

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      <Header
        title={titleMap[activeView] || 'Dashboard'}
        onToggleMenu={() => setSidebarOpen((prev) => !prev)}
        onLogout={onLogout}
        profile={profileForEdit}
        notificationCount={unreadNotificationCount}
        notifications={notificationItems}
        onNotificationSelect={handleNotificationSelect}
        onMarkAllNotificationsRead={markAllNotificationsAsRead}
        onViewAllNotifications={() => setActiveView('notifications')}
      />

      <main className="dashboard-main">
        <div className="left-content">
          {activeView !== 'dashboard' && (
            <section className="analytics-card parent-child-switcher compact">
              <label htmlFor="child-selector-inline">Viewing Student</label>
              <select
                id="child-selector-inline"
                value={selectedChildId}
                onChange={(event) => setSelectedChildId(Number(event.target.value))}
              >
                {childrenData.map((child) => (
                  <option key={child.id} value={child.id}>{child.name} • {child.className}</option>
                ))}
              </select>
            </section>
          )}
          {renderMain()}
        </div>

        {showRightColumn && (
          <aside className="right-column">
            <section className="announcements">
              <div className="section-header">
                <h2>Announcements</h2>
                <button type="button" className="view-all" onClick={() => setActiveView('announcements')}>View All &gt;</button>
              </div>
              <ul className="announcement-list">
                {announcements.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <div className="announcement-top">
                      <strong>{item.title}</strong>
                      <span>{item.date}</span>
                    </div>
                    <p>{item.message}</p>
                  </li>
                ))}
                {announcements.length === 0 && (
                  <li>
                    <div className="announcement-top">
                      <strong>No announcement</strong>
                    </div>
                    <p>No announcements for {childName} yet.</p>
                  </li>
                )}
              </ul>
            </section>

            <section className="quick-links">
              <div className="section-header">
                <h2>Quick Links</h2>
              </div>
              <ul>
                <li onClick={() => setActiveView('academic-results')}>View Academic Results</li>
                <li onClick={() => setActiveView('attendance')}>Check Attendance</li>
                <li onClick={() => setActiveView('fees-payments')}>Pay Fees</li>
                <li onClick={() => setActiveView('events-calendar')}>Open School Events</li>
              </ul>
            </section>

            <section className="recent-messages">
              <div className="section-header">
                <h2>Alerts</h2>
              </div>
              <div className="message-item">
                <div className="message-text">
                  <strong><FaBell /> {unreadNotificationCount} unread</strong>
                  <p>Open Notifications tab to view and mark all alerts as read.</p>
                </div>
              </div>
            </section>
          </aside>
        )}
      </main>

      <footer className="dashboard-footer">
        <a href="https://www.youtube.com/results?search_query=how+to+use+parent+dashboard" target="_blank" rel="noreferrer">
          Learn how to use your parent dashboard
        </a>
        <button
          type="button"
          onClick={() => window.open('mailto:support@eduignite.edu?subject=Parent%20Dashboard%20Support', '_blank')}
        >
          Support
        </button>
      </footer>
    </div>
  );
};

export default ParentDashboard;
