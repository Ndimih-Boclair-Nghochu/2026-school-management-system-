import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  FaBook,
  FaHandHolding,
  FaUndoAlt,
  FaExclamationTriangle,
  FaUsers,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaFileCsv,
  FaPrint,
  FaShieldAlt,
  FaBell,
  FaEnvelope
} from 'react-icons/fa';
import Header from './Header';
import LibrarianSidebar from './LibrarianSidebar';
import EditProfile from './EditProfile';
import './LibrarianDashboard.css';

const buildAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f6feb&color=fff&bold=true`;

const DEFAULT_LIBRARY_SETTINGS = {
  borrowingDays: '14',
  maxBooks: '5',
  graceDays: '2',
  reminderFrequency: 'Daily',
  reminderChannel: 'SMS + Email',
  autoSuspendOverdue: true,
  weekendIssue: false,
  requireApproval: true,
  smsProvider: 'Twilio',
  emailSender: 'library@eduignite.edu',
  autoReport: 'Weekly'
};

const LibrarianDashboard = ({ profile, onSaveProfile = () => {}, onLogout = () => {} }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [addBookDraft, setAddBookDraft] = useState({
    title: '',
    code: '',
    author: '',
    category: 'Mathematics',
    status: 'Available',
    isbn: '',
    publisher: '',
    year: '2026',
    shelf: '',
    totalCopies: '1',
    availableCopies: '1',
    rating: '4.0',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=420&q=80',
    coverFileName: '',
    description: ''
  });
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All Categories');
  const [catalogStatus, setCatalogStatus] = useState('All Status');
  const [catalogSortBy, setCatalogSortBy] = useState('Title');
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportPaymentMethod, setSupportPaymentMethod] = useState('Orange Money');
  const [supportAmount, setSupportAmount] = useState('');
  const [supporterNumber, setSupporterNumber] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [returnSearch, setReturnSearch] = useState('');
  const [returnStatusFilter, setReturnStatusFilter] = useState('all');
  const [returnSortBy, setReturnSortBy] = useState('dueDate');
  const [borrowingSearch, setBorrowingSearch] = useState('');
  const [borrowingStatusFilter, setBorrowingStatusFilter] = useState('all');
  const [borrowingSortBy, setBorrowingSortBy] = useState('issuedDate');
  const [overdueSearch, setOverdueSearch] = useState('');
  const [overdueSortBy, setOverdueSortBy] = useState('daysDesc');
  const [overdueCategoryFilter, setOverdueCategoryFilter] = useState('All Categories');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState('all');
  const [memberStatusFilter, setMemberStatusFilter] = useState('all');
  const [memberSortBy, setMemberSortBy] = useState('name');
  const [selectedMemberId, setSelectedMemberId] = useState(1);
  const [selectedMemberTransactionId, setSelectedMemberTransactionId] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('This Term');
  const [reportType, setReportType] = useState('All');
  const [reportSortBy, setReportSortBy] = useState('dueDate');
  const [reportSearch, setReportSearch] = useState('');
  const [settingsDraft, setSettingsDraft] = useState({ ...DEFAULT_LIBRARY_SETTINGS });
  const [savedSettingsSnapshot, setSavedSettingsSnapshot] = useState({ ...DEFAULT_LIBRARY_SETTINGS });
  const [settingsErrors, setSettingsErrors] = useState({});
  const [settingsLastSavedAt, setSettingsLastSavedAt] = useState('Not saved yet');
  const [issueDraft, setIssueDraft] = useState({
    memberId: '1',
    bookId: '1',
    issueDate: '2026-03-05',
    dueDate: '2026-03-19',
    priority: 'Normal',
    note: ''
  });

  const booksCatalog = useMemo(() => ([
    {
      id: 1,
      code: 'BK-1001',
      title: 'Mathematics Workbook Grade 5',
      author: 'P. Norton',
      category: 'Mathematics',
      status: 'Available',
      isbn: '978-0-452-28423-4',
      publisher: 'EduPress Africa',
      year: 2024,
      shelf: 'M-12',
      totalCopies: 24,
      availableCopies: 18,
      rating: 4.6,
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=420&q=80'
    },
    {
      id: 2,
      code: 'BK-1024',
      title: 'African History Essentials',
      author: 'K. Mensah',
      category: 'History',
      status: 'Issued',
      isbn: '978-1-4028-9462-6',
      publisher: 'CamLearn Publications',
      year: 2023,
      shelf: 'H-08',
      totalCopies: 16,
      availableCopies: 4,
      rating: 4.3,
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=420&q=80'
    },
    {
      id: 3,
      code: 'BK-1108',
      title: 'Chemistry Practical Guide',
      author: 'L. Anya',
      category: 'Science',
      status: 'Available',
      isbn: '978-0-679-60139-5',
      publisher: 'FutureLabs Press',
      year: 2025,
      shelf: 'S-03',
      totalCopies: 20,
      availableCopies: 11,
      rating: 4.7,
      cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=420&q=80'
    },
    {
      id: 4,
      code: 'BK-1170',
      title: 'Modern English Literature Notes',
      author: 'R. Collins',
      category: 'Literature',
      status: 'Low-stock',
      isbn: '978-0-330-25864-7',
      publisher: 'Language Hub',
      year: 2022,
      shelf: 'L-06',
      totalCopies: 12,
      availableCopies: 2,
      rating: 4.1,
      cover: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=420&q=80'
    }
  ]), []);

  const borrowingRecords = useMemo(() => ([
    { id: 1, member: 'Emily Johnson', book: 'African History Essentials', bookCode: 'BK-1024', issuedDate: '2026-03-01', dueDate: '2026-03-12', status: 'Active' },
    { id: 2, member: 'Daniel Ngwa', book: 'Biology Revision Notes', bookCode: 'BK-1198', issuedDate: '2026-02-20', dueDate: '2026-03-04', status: 'Overdue' },
    { id: 3, member: 'Mr. Peter B.', book: 'Teaching Strategies 2026', bookCode: 'BK-1304', issuedDate: '2026-02-28', dueDate: '2026-03-14', status: 'Active' }
  ]), []);

  const members = useMemo(() => ([
    {
      id: 1,
      name: 'Emily Johnson',
      type: 'Student',
      matricule: 'STD2026',
      status: 'Active',
      avatar: buildAvatar('Emily Johnson'),
      className: 'Form 4 Science',
      phone: '+237 677 000 222',
      email: 'emily.johnson@eduignite.edu',
      joinedAt: '2025-09-12'
    },
    {
      id: 2,
      name: 'John Smith',
      type: 'Teacher',
      matricule: 'TCH2026',
      status: 'Active',
      avatar: buildAvatar('John Smith'),
      className: 'Staff',
      phone: '+237 677 000 111',
      email: 'john.smith@eduignite.edu',
      joinedAt: '2024-11-03'
    },
    {
      id: 3,
      name: 'Daniel Ngwa',
      type: 'Student',
      matricule: 'STD2041',
      status: 'Inactive',
      avatar: buildAvatar('Daniel Ngwa'),
      className: 'Form 5 Arts',
      phone: '+237 677 111 404',
      email: 'daniel.ngwa@eduignite.edu',
      joinedAt: '2025-01-24'
    }
  ]), []);

  const profileForEdit = useMemo(() => ({
    matricule: profile?.matricule || 'LIB2026',
    name: profile?.name || 'Librarian',
    avatar: profile?.avatar || buildAvatar(profile?.name || 'Librarian'),
    password: profile?.password || 'password123'
  }), [profile]);

  const circulationTrend = useMemo(() => ([
    { month: 'Jan', issued: 252, returned: 231 },
    { month: 'Feb', issued: 268, returned: 246 },
    { month: 'Mar', issued: 284, returned: 257 },
    { month: 'Apr', issued: 301, returned: 276 },
    { month: 'May', issued: 295, returned: 281 },
    { month: 'Jun', issued: 312, returned: 289 }
  ]), []);

  const categoryDistribution = useMemo(() => ([
    { label: 'Mathematics', value: 34 },
    { label: 'Science', value: 28 },
    { label: 'Literature', value: 21 },
    { label: 'History', value: 17 }
  ]), []);

  const maxCirculationValue = useMemo(
    () => Math.max(...circulationTrend.map((item) => Math.max(item.issued, item.returned))),
    [circulationTrend]
  );

  const totalIssued = useMemo(
    () => circulationTrend.reduce((sum, item) => sum + item.issued, 0),
    [circulationTrend]
  );

  const totalReturned = useMemo(
    () => circulationTrend.reduce((sum, item) => sum + item.returned, 0),
    [circulationTrend]
  );

  const returnRate = totalIssued ? Math.round((totalReturned / totalIssued) * 100) : 0;
  const activeMembersCount = members.filter((item) => item.status === 'Active').length;
  const dueSoonCount = borrowingRecords.filter((item) => item.status === 'Active').length;

  const catalogCategoryOptions = useMemo(() => (
    ['All Categories', ...Array.from(new Set(booksCatalog.map((book) => book.category)))]
  ), [booksCatalog]);

  const filteredCatalogBooks = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();

    return booksCatalog
      .filter((book) => {
        const categoryMatch = catalogCategory === 'All Categories' || book.category === catalogCategory;
        const statusMatch = catalogStatus === 'All Status' || book.status === catalogStatus;
        const queryMatch = !query
          || `${book.title} ${book.author} ${book.code} ${book.isbn} ${book.publisher}`.toLowerCase().includes(query);
        return categoryMatch && statusMatch && queryMatch;
      })
      .sort((left, right) => {
        if (catalogSortBy === 'Author') return left.author.localeCompare(right.author);
        if (catalogSortBy === 'Newest') return right.year - left.year;
        if (catalogSortBy === 'Rating') return right.rating - left.rating;
        if (catalogSortBy === 'Availability') return right.availableCopies - left.availableCopies;
        return left.title.localeCompare(right.title);
      });
  }, [booksCatalog, catalogSearch, catalogCategory, catalogStatus, catalogSortBy]);

  const catalogStats = useMemo(() => {
    const totalTitles = booksCatalog.length;
    const totalCopies = booksCatalog.reduce((sum, book) => sum + book.totalCopies, 0);
    const availableCopies = booksCatalog.reduce((sum, book) => sum + book.availableCopies, 0);
    const issuedCopies = totalCopies - availableCopies;
    const lowStockTitles = booksCatalog.filter((book) => book.availableCopies <= 3).length;
    return { totalTitles, totalCopies, availableCopies, issuedCopies, lowStockTitles };
  }, [booksCatalog]);

  const returnRecords = useMemo(() => borrowingRecords.map((row) => {
    const matchedBook = booksCatalog.find((book) => book.code === row.bookCode || book.title === row.book);
    return {
      ...row,
      cover: matchedBook?.cover || 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=420&q=80',
      shelf: matchedBook?.shelf || 'N/A',
      category: matchedBook?.category || 'General',
      availableCopies: matchedBook?.availableCopies ?? 0,
      totalCopies: matchedBook?.totalCopies ?? 0
    };
  }), [borrowingRecords, booksCatalog]);

  const filteredReturnRecords = useMemo(() => {
    const query = returnSearch.trim().toLowerCase();

    return returnRecords
      .filter((row) => {
        const statusMatch = returnStatusFilter === 'all' ? true : row.status.toLowerCase() === returnStatusFilter;
        const queryMatch = !query || `${row.member} ${row.book} ${row.bookCode}`.toLowerCase().includes(query);
        return statusMatch && queryMatch;
      })
      .sort((left, right) => {
        if (returnSortBy === 'member') return left.member.localeCompare(right.member);
        if (returnSortBy === 'book') return left.book.localeCompare(right.book);
        if (returnSortBy === 'status') return left.status.localeCompare(right.status);
        return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
      });
  }, [returnRecords, returnSearch, returnStatusFilter, returnSortBy]);

  const returnSummary = useMemo(() => ({
    active: returnRecords.filter((row) => row.status === 'Active').length,
    overdue: returnRecords.filter((row) => row.status === 'Overdue').length,
    total: returnRecords.length,
    dueSoon: returnRecords.filter((row) => row.status === 'Active').length
  }), [returnRecords]);

  const filteredBorrowingRecords = useMemo(() => {
    const query = borrowingSearch.trim().toLowerCase();

    return returnRecords
      .filter((row) => {
        const statusMatch = borrowingStatusFilter === 'all' ? true : row.status.toLowerCase() === borrowingStatusFilter;
        const queryMatch = !query || `${row.member} ${row.book} ${row.bookCode} ${row.category}`.toLowerCase().includes(query);
        return statusMatch && queryMatch;
      })
      .sort((left, right) => {
        if (borrowingSortBy === 'member') return left.member.localeCompare(right.member);
        if (borrowingSortBy === 'book') return left.book.localeCompare(right.book);
        if (borrowingSortBy === 'status') return left.status.localeCompare(right.status);
        if (borrowingSortBy === 'dueDate') return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
        return new Date(right.issuedDate).getTime() - new Date(left.issuedDate).getTime();
      });
  }, [returnRecords, borrowingSearch, borrowingStatusFilter, borrowingSortBy]);

  const borrowingSummary = useMemo(() => ({
    total: returnRecords.length,
    active: returnRecords.filter((row) => row.status === 'Active').length,
    overdue: returnRecords.filter((row) => row.status === 'Overdue').length,
    returned: returnRecords.filter((row) => row.status === 'Returned').length
  }), [returnRecords]);

  const overdueRecords = useMemo(() => {
    const today = new Date();
    return returnRecords
      .filter((row) => row.status === 'Overdue')
      .map((row) => {
        const dueDate = new Date(row.dueDate);
        const overdueDays = Math.max(1, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        return { ...row, overdueDays };
      });
  }, [returnRecords]);

  const overdueCategoryOptions = useMemo(() => (
    ['All Categories', ...Array.from(new Set(overdueRecords.map((row) => row.category)))]
  ), [overdueRecords]);

  const filteredOverdueRecords = useMemo(() => {
    const query = overdueSearch.trim().toLowerCase();

    return overdueRecords
      .filter((row) => {
        const categoryMatch = overdueCategoryFilter === 'All Categories' || row.category === overdueCategoryFilter;
        const queryMatch = !query || `${row.member} ${row.book} ${row.bookCode}`.toLowerCase().includes(query);
        return categoryMatch && queryMatch;
      })
      .sort((left, right) => {
        if (overdueSortBy === 'member') return left.member.localeCompare(right.member);
        if (overdueSortBy === 'book') return left.book.localeCompare(right.book);
        if (overdueSortBy === 'dueDate') return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
        return right.overdueDays - left.overdueDays;
      });
  }, [overdueRecords, overdueSearch, overdueCategoryFilter, overdueSortBy]);

  const overdueSummary = useMemo(() => {
    const uniqueMembers = new Set(overdueRecords.map((row) => row.member)).size;
    const maxDays = overdueRecords.length ? Math.max(...overdueRecords.map((row) => row.overdueDays)) : 0;
    const avgDays = overdueRecords.length
      ? Math.round(overdueRecords.reduce((sum, row) => sum + row.overdueDays, 0) / overdueRecords.length)
      : 0;
    return {
      total: overdueRecords.length,
      members: uniqueMembers,
      maxDays,
      avgDays
    };
  }, [overdueRecords]);

  const memberRecords = useMemo(() => members.map((member) => {
    const transactions = returnRecords.filter((row) => row.member === member.name);
    const latestBorrowedAt = transactions
      .slice()
      .sort((left, right) => new Date(right.issuedDate).getTime() - new Date(left.issuedDate).getTime())[0]?.issuedDate || 'N/A';
    return {
      ...member,
      avatar: member.avatar || buildAvatar(member.name),
      borrowedCount: transactions.length,
      overdueCount: transactions.filter((row) => row.status === 'Overdue').length,
      lastBorrowedAt: latestBorrowedAt
    };
  }), [members, returnRecords]);

  const filteredMemberRecords = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();

    return memberRecords
      .filter((member) => {
        const typeMatch = memberTypeFilter === 'all' ? true : member.type.toLowerCase() === memberTypeFilter;
        const statusMatch = memberStatusFilter === 'all' ? true : member.status.toLowerCase() === memberStatusFilter;
        const queryMatch = !query || `${member.name} ${member.matricule} ${member.email}`.toLowerCase().includes(query);
        return typeMatch && statusMatch && queryMatch;
      })
      .sort((left, right) => {
        if (memberSortBy === 'recent') return new Date(right.joinedAt).getTime() - new Date(left.joinedAt).getTime();
        if (memberSortBy === 'borrowed') return right.borrowedCount - left.borrowedCount;
        if (memberSortBy === 'overdue') return right.overdueCount - left.overdueCount;
        return left.name.localeCompare(right.name);
      });
  }, [memberRecords, memberSearch, memberTypeFilter, memberStatusFilter, memberSortBy]);

  const memberSummary = useMemo(() => ({
    total: memberRecords.length,
    active: memberRecords.filter((member) => member.status === 'Active').length,
    students: memberRecords.filter((member) => member.type === 'Student').length,
    highRisk: memberRecords.filter((member) => member.overdueCount > 0).length
  }), [memberRecords]);

  const selectedMemberRecord = useMemo(() => (
    memberRecords.find((member) => member.id === selectedMemberId)
    || filteredMemberRecords[0]
    || memberRecords[0]
    || null
  ), [memberRecords, filteredMemberRecords, selectedMemberId]);

  const selectedMemberTransactions = useMemo(() => {
    if (!selectedMemberRecord) return [];

    return returnRecords
      .filter((row) => row.member === selectedMemberRecord.name)
      .map((row) => ({
        ...row,
        overdueDays: row.status === 'Overdue'
          ? Math.max(1, Math.ceil((new Date().getTime() - new Date(row.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
          : 0
      }))
      .sort((left, right) => new Date(right.issuedDate).getTime() - new Date(left.issuedDate).getTime());
  }, [returnRecords, selectedMemberRecord]);

  const selectedMemberTransaction = useMemo(() => {
    if (!selectedMemberTransactions.length) return null;

    return selectedMemberTransactions.find((row) => row.id === selectedMemberTransactionId)
      || selectedMemberTransactions[0];
  }, [selectedMemberTransactions, selectedMemberTransactionId]);

  const reportRows = useMemo(() => returnRecords.map((row) => ({
    ...row,
    overdueDays: row.status === 'Overdue'
      ? Math.max(1, Math.ceil((new Date().getTime() - new Date(row.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 0,
    period: new Date(row.issuedDate).getMonth() < 6 ? 'This Term' : 'Last Term'
  })), [returnRecords]);

  const filteredReportRows = useMemo(() => {
    const query = reportSearch.trim().toLowerCase();

    return reportRows
      .filter((row) => {
        const periodMatch = reportPeriod === 'All Periods' ? true : row.period === reportPeriod;
        const typeMatch = reportType === 'All'
          ? true
          : reportType === 'Overdue Only'
            ? row.status === 'Overdue'
            : row.status === 'Active';
        const queryMatch = !query || `${row.member} ${row.book} ${row.bookCode} ${row.category}`.toLowerCase().includes(query);
        return periodMatch && typeMatch && queryMatch;
      })
      .sort((left, right) => {
        if (reportSortBy === 'member') return left.member.localeCompare(right.member);
        if (reportSortBy === 'book') return left.book.localeCompare(right.book);
        if (reportSortBy === 'status') return left.status.localeCompare(right.status);
        return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
      });
  }, [reportRows, reportPeriod, reportType, reportSortBy, reportSearch]);

  const reportSummary = useMemo(() => ({
    total: filteredReportRows.length,
    active: filteredReportRows.filter((row) => row.status === 'Active').length,
    overdue: filteredReportRows.filter((row) => row.status === 'Overdue').length,
    onTimeRate: filteredReportRows.length
      ? Math.round((filteredReportRows.filter((row) => row.status !== 'Overdue').length / filteredReportRows.length) * 100)
      : 0
  }), [filteredReportRows]);

  const reportStatusChartData = useMemo(() => ([
    { label: 'Active', value: filteredReportRows.filter((row) => row.status === 'Active').length },
    { label: 'Overdue', value: filteredReportRows.filter((row) => row.status === 'Overdue').length },
    { label: 'Returned', value: filteredReportRows.filter((row) => row.status === 'Returned').length }
  ]), [filteredReportRows]);

  const reportCategoryChartData = useMemo(() => {
    const counts = filteredReportRows.reduce((accumulator, row) => {
      accumulator[row.category] = (accumulator[row.category] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);
  }, [filteredReportRows]);

  const reportTopOverdueMember = useMemo(() => {
    const overdueCounts = filteredReportRows
      .filter((row) => row.status === 'Overdue')
      .reduce((accumulator, row) => {
        accumulator[row.member] = (accumulator[row.member] || 0) + 1;
        return accumulator;
      }, {});

    const [member, count] = Object.entries(overdueCounts).sort((left, right) => right[1] - left[1])[0] || [];
    return member ? { member, count } : null;
  }, [filteredReportRows]);

  const reportTopCategory = reportCategoryChartData[0] || null;

  const hasUnsavedSettings = useMemo(
    () => JSON.stringify(settingsDraft) !== JSON.stringify(savedSettingsSnapshot),
    [settingsDraft, savedSettingsSnapshot]
  );

  const selectedIssueMember = members.find((member) => String(member.id) === issueDraft.memberId) || members[0];
  const selectedIssueBook = booksCatalog.find((book) => String(book.id) === issueDraft.bookId) || booksCatalog[0];

  const unreadNotificationCount = borrowingRecords.filter((item) => item.status === 'Overdue').length;

  const notificationItems = borrowingRecords
    .filter((item) => item.status === 'Overdue')
    .map((item) => ({
      id: item.id,
      title: `${item.member} overdue: ${item.book}`,
      date: item.dueDate,
      unread: true
    }));

  const handleSidebarSelect = (viewKey) => {
    setActiveView(viewKey);
    setSidebarOpen(false);
  };

  const submitSupportForm = (event) => {
    event.preventDefault();
    const amount = supportAmount.trim();
    const number = supporterNumber.trim();
    const message = supportMessage.trim();

    if (!amount || !number || !message) {
      alert('Please enter amount, number and message.');
      return;
    }

    alert(`Thank you for supporting with ${amount} via ${supportPaymentMethod}.`);
    setSupportAmount('');
    setSupporterNumber('');
    setSupportMessage('');
    setSupportPaymentMethod('Orange Money');
    setShowSupportForm(false);
  };

  const handleAddBookDraftChange = (field, value) => {
    setAddBookDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddBookCoverUpload = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAddBookDraft((prev) => ({
        ...prev,
        cover: typeof reader.result === 'string' ? reader.result : prev.cover,
        coverFileName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetAddBookDraft = () => {
    setAddBookDraft({
      title: '',
      code: '',
      author: '',
      category: 'Mathematics',
      status: 'Available',
      isbn: '',
      publisher: '',
      year: '2026',
      shelf: '',
      totalCopies: '1',
      availableCopies: '1',
      rating: '4.0',
      cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=420&q=80',
      coverFileName: '',
      description: ''
    });
    setNotice('');
  };

  const resetIssueDraft = () => {
    setIssueDraft({
      memberId: '1',
      bookId: '1',
      issueDate: '2026-03-05',
      dueDate: '2026-03-19',
      priority: 'Normal',
      note: ''
    });
    setNotice('');
  };

  const handleSettingsFieldChange = (field, value) => {
    setSettingsDraft((prev) => ({ ...prev, [field]: value }));
    setSettingsErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateSettingsDraft = () => {
    const nextErrors = {};
    const borrowingDays = Number(settingsDraft.borrowingDays);
    const maxBooks = Number(settingsDraft.maxBooks);
    const graceDays = Number(settingsDraft.graceDays);

    if (!Number.isFinite(borrowingDays) || borrowingDays < 1 || borrowingDays > 60) {
      nextErrors.borrowingDays = 'Borrowing period must be between 1 and 60 days.';
    }
    if (!Number.isFinite(maxBooks) || maxBooks < 1 || maxBooks > 20) {
      nextErrors.maxBooks = 'Maximum books must be between 1 and 20.';
    }
    if (!Number.isFinite(graceDays) || graceDays < 0 || graceDays > 14) {
      nextErrors.graceDays = 'Grace period must be between 0 and 14 days.';
    }
    if (!/^\S+@\S+\.\S+$/.test(settingsDraft.emailSender.trim())) {
      nextErrors.emailSender = 'Enter a valid sender email address.';
    }

    return nextErrors;
  };

  const saveLibrarySettings = () => {
    const nextErrors = validateSettingsDraft();
    setSettingsErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      setNotice('Please fix settings validation errors before saving.');
      return;
    }

    setSavedSettingsSnapshot({ ...settingsDraft });
    setSettingsLastSavedAt(new Date().toLocaleString());
    setNotice('Library settings saved successfully.');
  };

  const revertLibrarySettings = () => {
    setSettingsDraft({ ...savedSettingsSnapshot });
    setSettingsErrors({});
    setNotice('Settings reverted to last saved snapshot.');
  };

  const resetLibrarySettingsDefaults = () => {
    setSettingsDraft({ ...DEFAULT_LIBRARY_SETTINGS });
    setSettingsErrors({});
    setNotice('Default library settings template loaded.');
  };

  const applySettingsPreset = (preset) => {
    if (preset === 'strict') {
      setSettingsDraft((prev) => ({
        ...prev,
        borrowingDays: '10',
        maxBooks: '3',
        graceDays: '0',
        reminderFrequency: 'Daily',
        reminderChannel: 'SMS + Email',
        autoSuspendOverdue: true,
        requireApproval: true
      }));
      setNotice('Strict policy preset applied. Review and save settings.');
      return;
    }

    if (preset === 'balanced') {
      setSettingsDraft((prev) => ({
        ...prev,
        borrowingDays: '14',
        maxBooks: '5',
        graceDays: '2',
        reminderFrequency: 'Daily',
        reminderChannel: 'SMS + Email',
        autoSuspendOverdue: true,
        requireApproval: true
      }));
      setNotice('Balanced policy preset applied.');
      return;
    }

    setSettingsDraft((prev) => ({
      ...prev,
      borrowingDays: '21',
      maxBooks: '7',
      graceDays: '4',
      reminderFrequency: 'Every 2 days',
      reminderChannel: 'Email',
      autoSuspendOverdue: false,
      requireApproval: false
    }));
    setNotice('Extended access preset applied.');
  };

  const exportLibrarianReportCsv = () => {
    if (!filteredReportRows.length) {
      setNotice('No report rows available for CSV export with the current filters.');
      return;
    }

    const header = ['Member', 'Book', 'Code', 'Category', 'Issued', 'Due', 'Status', 'OverdueDays'];
    const rows = filteredReportRows.map((row) => [
      row.member,
      row.book,
      row.bookCode,
      row.category,
      row.issuedDate,
      row.dueDate,
      row.status,
      row.overdueDays
    ]);

    const csvContent = [header, ...rows]
      .map((csvRow) => csvRow.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `library-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    setNotice('CSV report exported successfully.');
  };

  const printReportSnapshot = () => {
    if (!filteredReportRows.length) {
      setNotice('No rows available to print with the current filters.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=960,height=700');
    if (!printWindow) {
      setNotice('Unable to open print preview window. Please allow popups.');
      return;
    }

    const tableRowsHtml = filteredReportRows
      .map((row) => `
        <tr>
          <td>${row.member}</td>
          <td>${row.book}</td>
          <td>${row.bookCode}</td>
          <td>${row.category}</td>
          <td>${row.issuedDate}</td>
          <td>${row.dueDate}</td>
          <td>${row.status}</td>
          <td>${row.overdueDays}</td>
        </tr>
      `)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Library Report Snapshot</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 18px; color: #111827; }
            h1 { margin: 0 0 6px; font-size: 22px; }
            p { margin: 0 0 16px; color: #475467; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d0d5dd; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f2f4f7; }
          </style>
        </head>
        <body>
          <h1>Library Report Snapshot</h1>
          <p>Period: ${reportPeriod} • Type: ${reportType} • Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Book</th>
                <th>Code</th>
                <th>Category</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Status</th>
                <th>Overdue Days</th>
              </tr>
            </thead>
            <tbody>${tableRowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    setNotice('Print snapshot generated.');
  };

  const exportLibrarianReportPdf = (reportScope = 'full') => {
    const rowsToExport = reportScope === 'overdue'
      ? filteredReportRows.filter((row) => row.status === 'Overdue')
      : filteredReportRows;

    if (!rowsToExport.length) {
      setNotice('No report rows available for export with the current filters.');
      return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 12;
    const contentWidth = pageWidth - (marginX * 2);
    const librarianName = profile?.name || 'School Librarian';
    let cursorY = 12;

    const ensureSpace = (requiredHeight) => {
      if (cursorY + requiredHeight > pageHeight - 14) {
        doc.addPage();
        cursorY = 14;
      }
    };

    doc.setFillColor(21, 112, 239);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('School Library Report', marginX, 10);
    doc.setFontSize(9);
    doc.text(`${reportScope === 'overdue' ? 'Overdue Report' : 'Comprehensive Report'} • ${reportPeriod} • ${reportType}`, marginX, 16);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - marginX, 16, { align: 'right' });

    doc.setTextColor(17, 24, 39);
    cursorY = 30;

    doc.setFontSize(11);
    doc.text('Librarian Information', marginX, cursorY);
    cursorY += 6;
    doc.setFontSize(9);
    doc.text(`Name: ${librarianName}`, marginX, cursorY);
    doc.text('Role: School Librarian', marginX + 70, cursorY);
    cursorY += 5;
    doc.text('School: EduIgnite School Management System', marginX, cursorY);
    doc.text('Place of Signature: ______________________', marginX + 90, cursorY);
    cursorY += 8;

    ensureSpace(28);
    const summaryItems = [
      { label: 'Records', value: String(rowsToExport.length) },
      { label: 'Active', value: String(rowsToExport.filter((row) => row.status === 'Active').length) },
      { label: 'Overdue', value: String(rowsToExport.filter((row) => row.status === 'Overdue').length) },
      {
        label: 'On-time Rate',
        value: `${rowsToExport.length
          ? Math.round((rowsToExport.filter((row) => row.status !== 'Overdue').length / rowsToExport.length) * 100)
          : 0}%`
      }
    ];

    doc.setFontSize(11);
    doc.text('Summary', marginX, cursorY);
    cursorY += 4;
    const cardGap = 3;
    const cardWidth = (contentWidth - (cardGap * 3)) / 4;
    summaryItems.forEach((item, index) => {
      const x = marginX + (index * (cardWidth + cardGap));
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(219, 234, 254);
      doc.roundedRect(x, cursorY, cardWidth, 16, 1.6, 1.6, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(71, 84, 103);
      doc.text(item.label, x + 2.5, cursorY + 6);
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text(item.value, x + 2.5, cursorY + 12);
    });
    cursorY += 22;

    ensureSpace(62);
    doc.setFontSize(11);
    doc.text('Charts', marginX, cursorY);
    cursorY += 4;

    const leftChartX = marginX;
    const rightChartX = marginX + (contentWidth / 2) + 2;
    const chartWidth = (contentWidth / 2) - 4;
    const chartHeight = 50;

    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(leftChartX, cursorY, chartWidth, chartHeight, 1.5, 1.5, 'S');
    doc.roundedRect(rightChartX, cursorY, chartWidth, chartHeight, 1.5, 1.5, 'S');

    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text('Borrowing Status Distribution', leftChartX + 2, cursorY + 5);
    doc.text('Top Categories Distribution', rightChartX + 2, cursorY + 5);

    const statusMax = Math.max(1, ...reportStatusChartData.map((item) => item.value));
    const barBaseY = cursorY + chartHeight - 8;
    const barWidth = 10;
    const barGap = 7;
    reportStatusChartData.forEach((item, index) => {
      const barHeight = Math.max(1, ((chartHeight - 20) * item.value) / statusMax);
      const x = leftChartX + 7 + (index * (barWidth + barGap));
      const y = barBaseY - barHeight;
      doc.setFillColor(21, 112, 239);
      doc.rect(x, y, barWidth, barHeight, 'F');
      doc.setFontSize(7);
      doc.setTextColor(55, 65, 81);
      doc.text(String(item.value), x + (barWidth / 2), y - 1.5, { align: 'center' });
      doc.text(item.label, x + (barWidth / 2), barBaseY + 4, { align: 'center' });
    });

    const categoryDataForChart = reportCategoryChartData.length
      ? reportCategoryChartData
      : [{ label: 'No Data', value: 0 }];
    const categoryMax = Math.max(1, ...categoryDataForChart.map((item) => item.value));
    categoryDataForChart.forEach((item, index) => {
      const rowY = cursorY + 10 + (index * 8);
      const barLength = ((chartWidth - 22) * item.value) / categoryMax;
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(rightChartX + 2, rowY, chartWidth - 22, 4, 1, 1, 'F');
      doc.setFillColor(21, 112, 239);
      doc.roundedRect(rightChartX + 2, rowY, Math.max(1, barLength), 4, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(55, 65, 81);
      doc.text(item.label, rightChartX + 2, rowY - 1);
      doc.text(String(item.value), rightChartX + chartWidth - 3, rowY + 3, { align: 'right' });
    });

    cursorY += chartHeight + 6;

    ensureSpace(18);
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('Report Data', marginX, cursorY);
    cursorY += 6;

    const tableColumns = [
      { label: 'Member', width: 34 },
      { label: 'Book', width: 56 },
      { label: 'Code', width: 18 },
      { label: 'Issued', width: 20 },
      { label: 'Due', width: 20 },
      { label: 'Status', width: 17 },
      { label: 'Days', width: 11 }
    ];

    const drawTableHeader = () => {
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, cursorY, contentWidth, 7, 'F');
      let colX = marginX + 1.5;
      doc.setFontSize(7.4);
      doc.setTextColor(31, 41, 55);
      tableColumns.forEach((column) => {
        doc.text(column.label, colX, cursorY + 4.6);
        colX += column.width;
      });
      cursorY += 7;
    };

    drawTableHeader();
    doc.setFontSize(7.1);
    rowsToExport.forEach((row, index) => {
      ensureSpace(6);
      if (cursorY + 6 > pageHeight - 18) {
        doc.addPage();
        cursorY = 14;
        drawTableHeader();
      }

      let colX = marginX + 1.5;
      const rowShade = index % 2 === 0 ? 255 : 250;
      doc.setFillColor(rowShade, rowShade, rowShade);
      doc.rect(marginX, cursorY, contentWidth, 6, 'F');

      const rowValues = [
        String(row.member).slice(0, 24),
        String(row.book).slice(0, 39),
        row.bookCode,
        row.issuedDate,
        row.dueDate,
        row.status,
        String(row.overdueDays)
      ];

      rowValues.forEach((value, valueIndex) => {
        doc.setTextColor(51, 65, 85);
        doc.text(value, colX, cursorY + 4);
        colX += tableColumns[valueIndex].width;
      });

      cursorY += 6;
    });

    ensureSpace(26);
    cursorY += 8;
    doc.setDrawColor(107, 114, 128);
    doc.line(marginX, cursorY, marginX + 58, cursorY);
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.text(`Librarian Signature: ${librarianName}`, marginX, cursorY + 4.6);
    doc.text('Signing Place: ____________________________', marginX + 78, cursorY + 4.6);
    doc.text('Date: ____ / ____ / ______', marginX + 78, cursorY + 10.2);

    const fileSuffix = reportScope === 'overdue' ? 'overdue' : 'full';
    doc.save(`library-report-${fileSuffix}-${new Date().toISOString().slice(0, 10)}.pdf`);
    setNotice(`PDF exported successfully (${reportScope === 'overdue' ? 'Overdue Report' : 'Comprehensive Report'}).`);
  };

  const renderCatalogTable = (rows) => (
    <div className="librarian-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Book</th>
            <th>Code</th>
            <th>Author</th>
            <th>Category</th>
            <th>Copies</th>
            <th>Rating</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div className="catalog-book-cell">
                  <img src={row.cover} alt={row.title} />
                  <div>
                    <strong>{row.title}</strong>
                    <p>{row.publisher} • {row.year}</p>
                  </div>
                </div>
              </td>
              <td>{row.code}</td>
              <td>{row.author}</td>
              <td>{row.category}</td>
              <td>{row.availableCopies}/{row.totalCopies}</td>
              <td>{row.rating.toFixed(1)} ★</td>
              <td><span className={`librarian-badge ${row.status.toLowerCase().replace(/\s+/g, '-')}`}>{row.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMain = () => {
    switch (activeView) {
      case 'books-catalog':
        return (
          <div className="librarian-catalog-layout">
            <section className="librarian-panel">
              <div className="librarian-panel-head">
                <div>
                  <h2>Books Catalog</h2>
                  <p>Professional catalog with cover preview, metadata, stock health and quick filtering.</p>
                </div>
              </div>

              <div className="librarian-stats catalog-stats">
                <article className="librarian-stat-card compact">
                  <FaBook />
                  <div>
                    <h3>{catalogStats.totalTitles}</h3>
                    <p>Total Titles</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaHandHolding />
                  <div>
                    <h3>{catalogStats.issuedCopies}</h3>
                    <p>Issued Copies</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaUndoAlt />
                  <div>
                    <h3>{catalogStats.availableCopies}</h3>
                    <p>Available Copies</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaExclamationTriangle />
                  <div>
                    <h3>{catalogStats.lowStockTitles}</h3>
                    <p>Low-stock Titles</p>
                  </div>
                </article>
              </div>

              <div className="catalog-tools">
                <input
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Search by title, author, code, ISBN or publisher"
                />
                <select value={catalogCategory} onChange={(event) => setCatalogCategory(event.target.value)}>
                  {catalogCategoryOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
                <select value={catalogStatus} onChange={(event) => setCatalogStatus(event.target.value)}>
                  <option>All Status</option>
                  <option>Available</option>
                  <option>Issued</option>
                  <option>Low-stock</option>
                </select>
                <select value={catalogSortBy} onChange={(event) => setCatalogSortBy(event.target.value)}>
                  <option>Title</option>
                  <option>Author</option>
                  <option>Newest</option>
                  <option>Rating</option>
                  <option>Availability</option>
                </select>
              </div>
            </section>

            <section className="catalog-cards-grid">
              {filteredCatalogBooks.map((book) => (
                <article key={book.id} className="catalog-book-card">
                  <img src={book.cover} alt={book.title} className="catalog-book-cover" />
                  <div className="catalog-book-content">
                    <div className="catalog-book-head">
                      <h3>{book.title}</h3>
                      <span className={`librarian-badge ${book.status.toLowerCase().replace(/\s+/g, '-')}`}>{book.status}</span>
                    </div>
                    <p>{book.author} • {book.category}</p>
                    <div className="catalog-book-meta">
                      <span>Code: {book.code}</span>
                      <span>ISBN: {book.isbn}</span>
                      <span>Shelf: {book.shelf}</span>
                      <span>Copies: {book.availableCopies}/{book.totalCopies}</span>
                      <span>Rating: {book.rating.toFixed(1)} ★</span>
                    </div>
                  </div>
                </article>
              ))}
              {filteredCatalogBooks.length === 0 && (
                <p className="librarian-note">No books match your current filter and search criteria.</p>
              )}
            </section>

            <section className="librarian-panel">
              <div className="librarian-panel-head">
                <h3>Detailed Catalog Table</h3>
              </div>
              {renderCatalogTable(filteredCatalogBooks)}
            </section>
          </div>
        );
      case 'add-book':
        return (
          <section className="librarian-panel add-book-panel">
            <div className="librarian-panel-head">
              <div>
                <h2>Add Book</h2>
                <p>Register a complete catalog-ready book profile with all metadata and cover image.</p>
              </div>
            </div>

            <div className="add-book-layout">
              <div className="librarian-form-grid add-book-form-grid">
                <label>
                  Book Title
                  <input
                    placeholder="Enter title"
                    value={addBookDraft.title}
                    onChange={(event) => handleAddBookDraftChange('title', event.target.value)}
                  />
                </label>
                <label>
                  Book Code
                  <input
                    placeholder="Enter unique code"
                    value={addBookDraft.code}
                    onChange={(event) => handleAddBookDraftChange('code', event.target.value)}
                  />
                </label>
                <label>
                  Author
                  <input
                    placeholder="Enter author name"
                    value={addBookDraft.author}
                    onChange={(event) => handleAddBookDraftChange('author', event.target.value)}
                  />
                </label>
                <label>
                  Category
                  <select
                    value={addBookDraft.category}
                    onChange={(event) => handleAddBookDraftChange('category', event.target.value)}
                  >
                    {catalogCategoryOptions.filter((item) => item !== 'All Categories').map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={addBookDraft.status}
                    onChange={(event) => handleAddBookDraftChange('status', event.target.value)}
                  >
                    <option>Available</option>
                    <option>Issued</option>
                    <option>Low-stock</option>
                  </select>
                </label>
                <label>
                  ISBN
                  <input
                    placeholder="e.g. 978-0-452-28423-4"
                    value={addBookDraft.isbn}
                    onChange={(event) => handleAddBookDraftChange('isbn', event.target.value)}
                  />
                </label>
                <label>
                  Publisher
                  <input
                    placeholder="Enter publisher"
                    value={addBookDraft.publisher}
                    onChange={(event) => handleAddBookDraftChange('publisher', event.target.value)}
                  />
                </label>
                <label>
                  Publication Year
                  <input
                    type="number"
                    min="1990"
                    max="2035"
                    value={addBookDraft.year}
                    onChange={(event) => handleAddBookDraftChange('year', event.target.value)}
                  />
                </label>
                <label>
                  Shelf Number
                  <input
                    placeholder="e.g. S-12"
                    value={addBookDraft.shelf}
                    onChange={(event) => handleAddBookDraftChange('shelf', event.target.value)}
                  />
                </label>
                <label>
                  Total Copies
                  <input
                    type="number"
                    min="1"
                    value={addBookDraft.totalCopies}
                    onChange={(event) => handleAddBookDraftChange('totalCopies', event.target.value)}
                  />
                </label>
                <label>
                  Available Copies
                  <input
                    type="number"
                    min="0"
                    value={addBookDraft.availableCopies}
                    onChange={(event) => handleAddBookDraftChange('availableCopies', event.target.value)}
                  />
                </label>
                <label>
                  Rating
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={addBookDraft.rating}
                    onChange={(event) => handleAddBookDraftChange('rating', event.target.value)}
                  />
                </label>
                <label className="full-width">
                  Cover Image URL
                  <input
                    placeholder="https://..."
                    value={addBookDraft.cover}
                    onChange={(event) => handleAddBookDraftChange('cover', event.target.value)}
                  />
                </label>
                <label className="full-width">
                  Upload Cover Image (Manual)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddBookCoverUpload}
                  />
                </label>
                {addBookDraft.coverFileName && (
                  <p className="librarian-note">Selected image: {addBookDraft.coverFileName}</p>
                )}
                <label className="full-width">
                  Description
                  <textarea
                    rows={3}
                    placeholder="Short overview of the book content"
                    value={addBookDraft.description}
                    onChange={(event) => handleAddBookDraftChange('description', event.target.value)}
                  />
                </label>
              </div>

              <aside className="add-book-preview-panel">
                <h3>Live Preview</h3>
                <article className="catalog-book-card">
                  <img
                    src={addBookDraft.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=420&q=80'}
                    alt={addBookDraft.title || 'Book cover preview'}
                    className="catalog-book-cover"
                  />
                  <div className="catalog-book-content">
                    <div className="catalog-book-head">
                      <h3>{addBookDraft.title || 'Book title preview'}</h3>
                      <span className={`librarian-badge ${(addBookDraft.status || 'available').toLowerCase().replace(/\s+/g, '-')}`}>{addBookDraft.status || 'Available'}</span>
                    </div>
                    <p>{addBookDraft.author || 'Author'} • {addBookDraft.category || 'Category'}</p>
                    <div className="catalog-book-meta">
                      <span>Code: {addBookDraft.code || 'N/A'}</span>
                      <span>ISBN: {addBookDraft.isbn || 'N/A'}</span>
                      <span>Shelf: {addBookDraft.shelf || 'N/A'}</span>
                      <span>Copies: {addBookDraft.availableCopies || 0}/{addBookDraft.totalCopies || 0}</span>
                      <span>Rating: {Number(addBookDraft.rating || 0).toFixed(1)} ★</span>
                    </div>
                    {addBookDraft.description && <p className="add-book-description">{addBookDraft.description}</p>}
                  </div>
                </article>

                <div className="librarian-chip-list add-book-chip-list">
                  <span>Catalog-ready Metadata</span>
                  <span>Cover Preview Enabled</span>
                  <span>Stock Tracking Included</span>
                </div>
              </aside>
            </div>

            <div className="librarian-form-actions">
              <button
                type="button"
                className="primary"
                onClick={() => setNotice(`Demo: "${addBookDraft.title || 'New book'}" added to catalog successfully.`)}
              >
                Save Book
              </button>
              <button type="button" className="secondary" onClick={resetAddBookDraft}>Clear</button>
            </div>
            {notice && <p className="librarian-note">{notice}</p>}
          </section>
        );
      case 'issue-book':
        return (
          <section className="librarian-panel issue-book-panel">
            <div className="librarian-panel-head">
              <div>
                <h2>Issue Book</h2>
                <p>Assign books professionally with member verification, stock visibility and issue summary.</p>
              </div>
            </div>

            <div className="librarian-chip-list issue-policy-chips">
              <span>Borrowing Limit: 5 books/member</span>
              <span>Standard Duration: 14 days</span>
              <span>Late Fee Policy: Active</span>
            </div>

            <div className="issue-book-layout">
              <div className="librarian-form-grid issue-book-form-grid">
                <label>
                  Member
                  <select
                    value={issueDraft.memberId}
                    onChange={(event) => setIssueDraft((prev) => ({ ...prev, memberId: event.target.value }))}
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.name} ({member.matricule})</option>
                    ))}
                  </select>
                </label>
                <label>
                  Book
                  <select
                    value={issueDraft.bookId}
                    onChange={(event) => setIssueDraft((prev) => ({ ...prev, bookId: event.target.value }))}
                  >
                    {booksCatalog.map((book) => (
                      <option key={book.id} value={book.id}>{book.title} ({book.code})</option>
                    ))}
                  </select>
                </label>
                <label>
                  Issue Date
                  <input
                    type="date"
                    value={issueDraft.issueDate}
                    onChange={(event) => setIssueDraft((prev) => ({ ...prev, issueDate: event.target.value }))}
                  />
                </label>
                <label>
                  Due Date
                  <input
                    type="date"
                    value={issueDraft.dueDate}
                    onChange={(event) => setIssueDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
                  />
                </label>
                <label>
                  Priority
                  <select
                    value={issueDraft.priority}
                    onChange={(event) => setIssueDraft((prev) => ({ ...prev, priority: event.target.value }))}
                  >
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </label>
                <label>
                  Availability
                  <input
                    value={`${selectedIssueBook?.availableCopies || 0}/${selectedIssueBook?.totalCopies || 0} copies`}
                    readOnly
                  />
                </label>
                <label className="full-width">
                  Issue Note
                  <textarea
                    rows={3}
                    placeholder="Optional note for this issue transaction"
                    value={issueDraft.note}
                    onChange={(event) => setIssueDraft((prev) => ({ ...prev, note: event.target.value }))}
                  />
                </label>
              </div>

              <aside className="issue-summary-panel">
                <h3>Issue Summary</h3>
                <article className="catalog-book-card issue-summary-card">
                  <img src={selectedIssueBook?.cover} alt={selectedIssueBook?.title} className="catalog-book-cover" />
                  <div className="catalog-book-content">
                    <div className="catalog-book-head">
                      <h3>{selectedIssueBook?.title}</h3>
                      <span className={`librarian-badge ${(selectedIssueBook?.status || 'available').toLowerCase().replace(/\s+/g, '-')}`}>{selectedIssueBook?.status}</span>
                    </div>
                    <p>{selectedIssueBook?.author} • {selectedIssueBook?.category}</p>
                    <div className="catalog-book-meta">
                      <span>Code: {selectedIssueBook?.code}</span>
                      <span>Shelf: {selectedIssueBook?.shelf}</span>
                      <span>ISBN: {selectedIssueBook?.isbn}</span>
                      <span>Copies: {selectedIssueBook?.availableCopies}/{selectedIssueBook?.totalCopies}</span>
                    </div>
                  </div>
                </article>

                <div className="issue-member-summary">
                  <h4>Member Details</h4>
                  <p><strong>{selectedIssueMember?.name}</strong> • {selectedIssueMember?.type}</p>
                  <p>{selectedIssueMember?.matricule}</p>
                  <span className={`librarian-badge ${(selectedIssueMember?.status || 'active').toLowerCase()}`}>{selectedIssueMember?.status}</span>
                </div>

                {selectedIssueBook?.availableCopies <= 0 && (
                  <p className="librarian-note issue-warning">Selected book is out of stock. Choose another title.</p>
                )}
              </aside>
            </div>

            <div className="librarian-form-actions">
              <button
                type="button"
                className="primary"
                disabled={selectedIssueBook?.availableCopies <= 0 || selectedIssueMember?.status === 'Inactive'}
                onClick={() => setNotice(`Demo: ${selectedIssueBook?.title} issued to ${selectedIssueMember?.name} (${issueDraft.dueDate}).`)}
              >
                Confirm Issue
              </button>
              <button type="button" className="secondary" onClick={resetIssueDraft}>Clear</button>
            </div>
            {notice && <p className="librarian-note">{notice}</p>}
          </section>
        );
      case 'return-book':
        return (
          <div className="librarian-return-layout">
            <section className="librarian-panel return-book-panel">
              <div className="librarian-panel-head">
                <div>
                  <h2>Return Book</h2>
                  <p>Track due returns, identify overdue items, and process returns with complete book/member context.</p>
                </div>
              </div>

              <div className="librarian-stats return-stats">
                <article className="librarian-stat-card compact">
                  <FaUndoAlt />
                  <div>
                    <h3>{returnSummary.total}</h3>
                    <p>Total Borrowing Records</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaHandHolding />
                  <div>
                    <h3>{returnSummary.active}</h3>
                    <p>Pending Returns</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaExclamationTriangle />
                  <div>
                    <h3>{returnSummary.overdue}</h3>
                    <p>Overdue Items</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaClock />
                  <div>
                    <h3>{returnSummary.dueSoon}</h3>
                    <p>Due Soon</p>
                  </div>
                </article>
              </div>

              <div className="return-tools">
                <input
                  value={returnSearch}
                  onChange={(event) => setReturnSearch(event.target.value)}
                  placeholder="Search member, book title, or code"
                />
                <select value={returnStatusFilter} onChange={(event) => setReturnStatusFilter(event.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select value={returnSortBy} onChange={(event) => setReturnSortBy(event.target.value)}>
                  <option value="dueDate">Sort: Due Date</option>
                  <option value="member">Sort: Member</option>
                  <option value="book">Sort: Book</option>
                  <option value="status">Sort: Status</option>
                </select>
              </div>
            </section>

            <section className="return-cards-grid">
              {filteredReturnRecords.map((row) => (
                <article key={row.id} className="return-record-card">
                  <img src={row.cover} alt={row.book} />
                  <div>
                    <div className="catalog-book-head">
                      <h3>{row.book}</h3>
                      <span className={`librarian-badge ${row.status.toLowerCase()}`}>{row.status}</span>
                    </div>
                    <p>{row.member} • {row.bookCode}</p>
                    <div className="catalog-book-meta">
                      <span>Due: {row.dueDate}</span>
                      <span>Shelf: {row.shelf}</span>
                      <span>Category: {row.category}</span>
                      <span>Stock: {row.availableCopies}/{row.totalCopies}</span>
                    </div>
                    <div className="librarian-form-actions">
                      <button type="button" className="primary" onClick={() => setNotice(`Demo: ${row.book} returned by ${row.member}.`)}>Mark Returned</button>
                    </div>
                  </div>
                </article>
              ))}
              {filteredReturnRecords.length === 0 && <p className="librarian-note">No return records match your filters.</p>}
            </section>

            <section className="librarian-panel">
              <div className="librarian-panel-head">
                <h3>Return Processing Table</h3>
              </div>
              <div className="librarian-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Member</th>
                      <th>Code</th>
                      <th>Issued</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReturnRecords.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="catalog-book-cell">
                            <img src={row.cover} alt={row.book} />
                            <div>
                              <strong>{row.book}</strong>
                              <p>{row.category}</p>
                            </div>
                          </div>
                        </td>
                        <td>{row.member}</td>
                        <td>{row.bookCode}</td>
                        <td>{row.issuedDate}</td>
                        <td>{row.dueDate}</td>
                        <td><span className={`librarian-badge ${row.status.toLowerCase()}`}>{row.status}</span></td>
                        <td><button type="button" className="secondary" onClick={() => setNotice(`Demo: ${row.book} returned by ${row.member}.`)}>Mark Returned</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {notice && <p className="librarian-note">{notice}</p>}
            </section>
          </div>
        );
      case 'borrowing-records':
        return (
          <div className="librarian-borrowing-layout">
            <section className="librarian-panel borrowing-records-panel">
              <div className="librarian-panel-head">
                <div>
                  <h2>Borrowing Records</h2>
                  <p>Comprehensive view of all borrowing transactions with status insights and searchable history.</p>
                </div>
              </div>

              <div className="librarian-stats borrowing-stats">
                <article className="librarian-stat-card compact">
                  <FaBook />
                  <div>
                    <h3>{borrowingSummary.total}</h3>
                    <p>Total Records</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaHandHolding />
                  <div>
                    <h3>{borrowingSummary.active}</h3>
                    <p>Active Borrowings</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaExclamationTriangle />
                  <div>
                    <h3>{borrowingSummary.overdue}</h3>
                    <p>Overdue Records</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaUndoAlt />
                  <div>
                    <h3>{borrowingSummary.returned}</h3>
                    <p>Returned Records</p>
                  </div>
                </article>
              </div>

              <div className="borrowing-tools">
                <input
                  value={borrowingSearch}
                  onChange={(event) => setBorrowingSearch(event.target.value)}
                  placeholder="Search by member, book, code, or category"
                />
                <select value={borrowingStatusFilter} onChange={(event) => setBorrowingStatusFilter(event.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                  <option value="returned">Returned</option>
                </select>
                <select value={borrowingSortBy} onChange={(event) => setBorrowingSortBy(event.target.value)}>
                  <option value="issuedDate">Sort: Issued Date</option>
                  <option value="dueDate">Sort: Due Date</option>
                  <option value="member">Sort: Member</option>
                  <option value="book">Sort: Book</option>
                  <option value="status">Sort: Status</option>
                </select>
              </div>
            </section>

            <section className="borrowing-cards-grid">
              {filteredBorrowingRecords.map((row) => (
                <article key={row.id} className="borrowing-record-card">
                  <img src={row.cover} alt={row.book} />
                  <div>
                    <div className="catalog-book-head">
                      <h3>{row.book}</h3>
                      <span className={`librarian-badge ${row.status.toLowerCase()}`}>{row.status}</span>
                    </div>
                    <p>{row.member} • {row.bookCode}</p>
                    <div className="catalog-book-meta">
                      <span>Issued: {row.issuedDate}</span>
                      <span>Due: {row.dueDate}</span>
                      <span>Shelf: {row.shelf}</span>
                      <span>Category: {row.category}</span>
                    </div>
                  </div>
                </article>
              ))}
              {filteredBorrowingRecords.length === 0 && <p className="librarian-note">No borrowing records match your filters.</p>}
            </section>

            <section className="librarian-panel">
              <div className="librarian-panel-head">
                <h3>Borrowing Transaction Table</h3>
              </div>
              <div className="librarian-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Member</th>
                      <th>Code</th>
                      <th>Issued</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBorrowingRecords.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="catalog-book-cell">
                            <img src={row.cover} alt={row.book} />
                            <div>
                              <strong>{row.book}</strong>
                              <p>{row.category}</p>
                            </div>
                          </div>
                        </td>
                        <td>{row.member}</td>
                        <td>{row.bookCode}</td>
                        <td>{row.issuedDate}</td>
                        <td>{row.dueDate}</td>
                        <td><span className={`librarian-badge ${row.status.toLowerCase()}`}>{row.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      case 'overdue-books':
        return (
          <div className="librarian-overdue-layout">
            <section className="librarian-panel overdue-books-panel">
              <div className="librarian-panel-head">
                <div>
                  <h2>Overdue Books</h2>
                  <p>Monitor overdue borrowers, prioritize follow-ups, and track overdue severity professionally.</p>
                </div>
              </div>

              <div className="librarian-stats overdue-stats">
                <article className="librarian-stat-card compact">
                  <FaExclamationTriangle />
                  <div>
                    <h3>{overdueSummary.total}</h3>
                    <p>Total Overdue Titles</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaUsers />
                  <div>
                    <h3>{overdueSummary.members}</h3>
                    <p>Affected Members</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaClock />
                  <div>
                    <h3>{overdueSummary.avgDays} days</h3>
                    <p>Average Delay</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaChartLine />
                  <div>
                    <h3>{overdueSummary.maxDays} days</h3>
                    <p>Longest Overdue</p>
                  </div>
                </article>
              </div>

              <div className="overdue-tools">
                <input
                  value={overdueSearch}
                  onChange={(event) => setOverdueSearch(event.target.value)}
                  placeholder="Search member, title, or code"
                />
                <select value={overdueCategoryFilter} onChange={(event) => setOverdueCategoryFilter(event.target.value)}>
                  {overdueCategoryOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
                <select value={overdueSortBy} onChange={(event) => setOverdueSortBy(event.target.value)}>
                  <option value="daysDesc">Sort: Most Overdue</option>
                  <option value="dueDate">Sort: Due Date</option>
                  <option value="member">Sort: Member</option>
                  <option value="book">Sort: Book</option>
                </select>
              </div>
            </section>

            <section className="overdue-cards-grid">
              {filteredOverdueRecords.map((row) => (
                <article key={row.id} className="overdue-record-card">
                  <img src={row.cover} alt={row.book} />
                  <div>
                    <div className="catalog-book-head">
                      <h3>{row.book}</h3>
                      <span className="librarian-badge overdue">Overdue</span>
                    </div>
                    <p>{row.member} • {row.bookCode}</p>
                    <div className="catalog-book-meta">
                      <span>Due: {row.dueDate}</span>
                      <span>Overdue: {row.overdueDays} days</span>
                      <span>Shelf: {row.shelf}</span>
                      <span>Category: {row.category}</span>
                    </div>
                    <div className="librarian-form-actions">
                      <button type="button" className="secondary" onClick={() => setNotice(`Reminder sent to ${row.member} for ${row.book}.`)}>Send Reminder</button>
                    </div>
                  </div>
                </article>
              ))}
              {filteredOverdueRecords.length === 0 && <p className="librarian-note">No overdue books match your current filters.</p>}
            </section>

            <section className="librarian-panel">
              <div className="librarian-panel-head">
                <h3>Overdue Follow-up Table</h3>
              </div>
              <div className="librarian-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Member</th>
                      <th>Code</th>
                      <th>Due Date</th>
                      <th>Overdue Days</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOverdueRecords.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="catalog-book-cell">
                            <img src={row.cover} alt={row.book} />
                            <div>
                              <strong>{row.book}</strong>
                              <p>{row.category}</p>
                            </div>
                          </div>
                        </td>
                        <td>{row.member}</td>
                        <td>{row.bookCode}</td>
                        <td>{row.dueDate}</td>
                        <td>{row.overdueDays}</td>
                        <td><span className="librarian-badge overdue">Overdue</span></td>
                        <td><button type="button" className="secondary" onClick={() => setNotice(`Reminder sent to ${row.member} for ${row.book}.`)}>Send Reminder</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {notice && <p className="librarian-note">{notice}</p>}
            </section>
          </div>
        );
      case 'library-members':
        return (
          <div className="librarian-members-layout">
            <section className="librarian-panel members-panel">
              <div className="librarian-panel-head">
                <div>
                  <h2>Library Members</h2>
                  <p>Manage active borrowers, membership health, and engagement across students and staff.</p>
                </div>
              </div>

              <div className="librarian-stats members-stats">
                <article className="librarian-stat-card compact">
                  <FaUsers />
                  <div>
                    <h3>{memberSummary.total}</h3>
                    <p>Total Members</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaCheckCircle />
                  <div>
                    <h3>{memberSummary.active}</h3>
                    <p>Active Members</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaBook />
                  <div>
                    <h3>{memberSummary.students}</h3>
                    <p>Student Members</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaExclamationTriangle />
                  <div>
                    <h3>{memberSummary.highRisk}</h3>
                    <p>Members with Overdue</p>
                  </div>
                </article>
              </div>

              <div className="members-tools">
                <input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search by name, matricule, or email"
                />
                <select value={memberTypeFilter} onChange={(event) => setMemberTypeFilter(event.target.value)}>
                  <option value="all">All Types</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
                <select value={memberStatusFilter} onChange={(event) => setMemberStatusFilter(event.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select value={memberSortBy} onChange={(event) => setMemberSortBy(event.target.value)}>
                  <option value="name">Sort: Name</option>
                  <option value="recent">Sort: Recently Joined</option>
                  <option value="borrowed">Sort: Most Borrowed</option>
                  <option value="overdue">Sort: Overdue Count</option>
                </select>
              </div>
            </section>

            <section className="members-cards-grid">
              {filteredMemberRecords.map((member) => (
                <article
                  key={member.id}
                  className={`member-record-card ${selectedMemberRecord?.id === member.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMemberId(member.id);
                    setSelectedMemberTransactionId(null);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedMemberId(member.id);
                      setSelectedMemberTransactionId(null);
                    }
                  }}
                >
                  <img src={member.avatar} alt={member.name} className="member-avatar" />
                  <div>
                    <div className="catalog-book-head">
                      <h3>{member.name}</h3>
                      <span className={`librarian-badge ${member.status.toLowerCase()}`}>{member.status}</span>
                    </div>
                    <p>{member.type} • {member.matricule}</p>
                    <div className="catalog-book-meta">
                      <span>Class/Role: {member.className}</span>
                      <span>Borrowed: {member.borrowedCount}</span>
                      <span>Overdue: {member.overdueCount}</span>
                      <span>Joined: {member.joinedAt}</span>
                    </div>
                  </div>
                </article>
              ))}
              {filteredMemberRecords.length === 0 && <p className="librarian-note">No members match your filters.</p>}
            </section>

            <section className="librarian-panel member-history-panel">
              <div className="librarian-panel-head">
                <div>
                  <h3>Member History & Transactions</h3>
                  <p>Click any member card above to inspect complete library activity.</p>
                </div>
              </div>

              {selectedMemberRecord && (
                <div className="member-history-header">
                  <img src={selectedMemberRecord.avatar} alt={selectedMemberRecord.name} className="member-history-avatar" />
                  <div>
                    <h4>{selectedMemberRecord.name}</h4>
                    <p>
                      {selectedMemberRecord.type} • {selectedMemberRecord.matricule} • {selectedMemberRecord.className}
                    </p>
                    <div className="catalog-book-meta">
                      <span>Total Borrowed: {selectedMemberTransactions.length}</span>
                      <span>Overdue: {selectedMemberTransactions.filter((row) => row.status === 'Overdue').length}</span>
                      <span>Active: {selectedMemberTransactions.filter((row) => row.status === 'Active').length}</span>
                      <span>Last Borrowed: {selectedMemberRecord.lastBorrowedAt}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="librarian-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Code</th>
                      <th>Issued</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th>Overdue Days</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMemberTransactions.map((row) => (
                      <tr key={row.id}>
                        <td>{row.book}</td>
                        <td>{row.bookCode}</td>
                        <td>{row.issuedDate}</td>
                        <td>{row.dueDate}</td>
                        <td><span className={`librarian-badge ${row.status.toLowerCase()}`}>{row.status}</span></td>
                        <td>{row.overdueDays}</td>
                        <td>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => setSelectedMemberTransactionId(row.id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedMemberTransactions.length === 0 && (
                <p className="librarian-note">No transaction history found for this member yet.</p>
              )}

              {selectedMemberTransaction && (
                <article className="member-transaction-detail-card">
                  <div className="librarian-panel-head">
                    <h4>Transaction Details</h4>
                  </div>
                  <div className="catalog-book-meta">
                    <span>Member: {selectedMemberRecord?.name}</span>
                    <span>Book: {selectedMemberTransaction.book}</span>
                    <span>Code: {selectedMemberTransaction.bookCode}</span>
                    <span>Status: {selectedMemberTransaction.status}</span>
                    <span>Issued Date: {selectedMemberTransaction.issuedDate}</span>
                    <span>Due Date: {selectedMemberTransaction.dueDate}</span>
                    <span>Overdue Days: {selectedMemberTransaction.overdueDays}</span>
                    <span>Category: {selectedMemberTransaction.category}</span>
                  </div>
                </article>
              )}
            </section>

            <section className="librarian-panel">
              <div className="librarian-panel-head">
                <h3>Members Directory</h3>
              </div>
              <div className="librarian-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Matricule</th>
                      <th>Contact</th>
                      <th>Borrowed</th>
                      <th>Overdue</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMemberRecords.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <div className="member-name-cell">
                            <img src={member.avatar || buildAvatar(member.name)} alt={member.name} className="member-table-avatar" />
                            <span>{member.name}</span>
                          </div>
                        </td>
                        <td>{member.type}</td>
                        <td>{member.matricule}</td>
                        <td>{member.phone}</td>
                        <td>{member.borrowedCount}</td>
                        <td>{member.overdueCount}</td>
                        <td><span className={`librarian-badge ${member.status.toLowerCase()}`}>{member.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      case 'reports':
        return (
          <div className="librarian-reports-layout">
            <section className="librarian-panel reports-panel">
              <div className="librarian-panel-head">
                <div>
                  <h2>Reports</h2>
                  <p>Build circulation and compliance reports with filtering, summaries, and export actions.</p>
                </div>
              </div>

              <div className="librarian-stats reports-stats">
                <article className="librarian-stat-card compact">
                  <FaChartLine />
                  <div>
                    <h3>{reportSummary.total}</h3>
                    <p>Records in Scope</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaHandHolding />
                  <div>
                    <h3>{reportSummary.active}</h3>
                    <p>Active Borrowing</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaExclamationTriangle />
                  <div>
                    <h3>{reportSummary.overdue}</h3>
                    <p>Overdue Count</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaCheckCircle />
                  <div>
                    <h3>{reportSummary.onTimeRate}%</h3>
                    <p>On-time Rate</p>
                  </div>
                </article>
              </div>

              <div className="reports-tools">
                <input
                  value={reportSearch}
                  onChange={(event) => setReportSearch(event.target.value)}
                  placeholder="Search member, book, code, or category"
                />
                <select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)}>
                  <option>This Term</option>
                  <option>Last Term</option>
                  <option>All Periods</option>
                </select>
                <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
                  <option>All</option>
                  <option>Overdue Only</option>
                  <option>Active Only</option>
                </select>
                <select value={reportSortBy} onChange={(event) => setReportSortBy(event.target.value)}>
                  <option value="dueDate">Sort: Due Date</option>
                  <option value="member">Sort: Member</option>
                  <option value="book">Sort: Book</option>
                  <option value="status">Sort: Status</option>
                </select>
                <button type="button" className="secondary" onClick={exportLibrarianReportCsv}><FaFileCsv /> Export CSV</button>
                <button type="button" className="secondary" onClick={printReportSnapshot}><FaPrint /> Print Snapshot</button>
              </div>
            </section>

            <section className="librarian-panel report-insights-panel">
              <div className="librarian-panel-head">
                <h3>Report Insights</h3>
              </div>
              <div className="report-insights-grid">
                <article className="report-insight-card">
                  <h4>Top Category in Scope</h4>
                  <p>{reportTopCategory ? `${reportTopCategory.label} (${reportTopCategory.value})` : 'No category data available'}</p>
                </article>
                <article className="report-insight-card">
                  <h4>Highest Overdue Member</h4>
                  <p>{reportTopOverdueMember ? `${reportTopOverdueMember.member} (${reportTopOverdueMember.count})` : 'No overdue rows in current filter'}</p>
                </article>
                <article className="report-insight-card">
                  <h4>Search Scope</h4>
                  <p>{reportSearch.trim() ? `Filtered by: "${reportSearch.trim()}"` : 'No text search applied'}</p>
                </article>
              </div>
              <div className="report-category-bars">
                {reportCategoryChartData.length > 0 ? reportCategoryChartData.map((item) => (
                  <div key={item.label} className="report-category-row">
                    <span>{item.label}</span>
                    <div>
                      <i style={{ width: `${Math.max(8, (item.value / Math.max(...reportCategoryChartData.map((entry) => entry.value))) * 100)}%` }} />
                      <strong>{item.value}</strong>
                    </div>
                  </div>
                )) : <p className="librarian-note">No category insights available for this filter.</p>}
              </div>
            </section>

            <section className="librarian-panel">
              <div className="librarian-panel-head">
                <h3>Report Preview</h3>
              </div>
              <div className="librarian-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Book</th>
                      <th>Code</th>
                      <th>Issued</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th>Overdue Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.member}</td>
                        <td>{row.book}</td>
                        <td>{row.bookCode}</td>
                        <td>{row.issuedDate}</td>
                        <td>{row.dueDate}</td>
                        <td><span className={`librarian-badge ${row.status.toLowerCase()}`}>{row.status}</span></td>
                        <td>{row.overdueDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="librarian-form-actions">
                <button type="button" className="primary" onClick={() => exportLibrarianReportPdf('full')}>Export Full Report</button>
                <button type="button" className="secondary" onClick={() => exportLibrarianReportPdf('overdue')}>Export Overdue Report</button>
              </div>
              {notice && <p className="librarian-note">{notice}</p>}
            </section>
          </div>
        );
      case 'settings':
        return (
          <div className="librarian-settings-layout">
            <section className="librarian-panel settings-panel">
              <div className="librarian-panel-head">
                <div>
                  <h2>Settings</h2>
                  <p>Configure policy, notifications, automation, and integrations for the full library system.</p>
                </div>
              </div>

              <div className="librarian-stats settings-stats">
                <article className="librarian-stat-card compact">
                  <FaClock />
                  <div>
                    <h3>{settingsDraft.borrowingDays} days</h3>
                    <p>Borrowing Period</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaBook />
                  <div>
                    <h3>{settingsDraft.maxBooks}</h3>
                    <p>Books per Member</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaChartLine />
                  <div>
                    <h3>{settingsDraft.autoReport}</h3>
                    <p>Auto Report Cycle</p>
                  </div>
                </article>
                <article className="librarian-stat-card compact">
                  <FaCheckCircle />
                  <div>
                    <h3>{settingsDraft.reminderChannel}</h3>
                    <p>Reminder Channel</p>
                  </div>
                </article>
              </div>

              <div className="settings-sections-grid">
                <article className="settings-box">
                  <h3>Policy Templates</h3>
                  <div className="settings-template-actions">
                    <button type="button" className="secondary" onClick={() => applySettingsPreset('strict')}>Strict</button>
                    <button type="button" className="secondary" onClick={() => applySettingsPreset('balanced')}>Balanced</button>
                    <button type="button" className="secondary" onClick={() => applySettingsPreset('extended')}>Extended Access</button>
                  </div>
                  <p className="librarian-note">Select a template, review fields below, then save your policy.</p>
                </article>

                <article className="settings-box">
                  <h3>Borrowing Policy</h3>
                  <div className="librarian-form-grid">
                    <label>
                      Default Borrowing Period (days)
                      <input
                        type="number"
                        min="1"
                        value={settingsDraft.borrowingDays}
                        onChange={(event) => handleSettingsFieldChange('borrowingDays', event.target.value)}
                      />
                      {settingsErrors.borrowingDays && <small className="settings-error">{settingsErrors.borrowingDays}</small>}
                    </label>
                    <label>
                      Maximum Books Per Member
                      <input
                        type="number"
                        min="1"
                        value={settingsDraft.maxBooks}
                        onChange={(event) => handleSettingsFieldChange('maxBooks', event.target.value)}
                      />
                      {settingsErrors.maxBooks && <small className="settings-error">{settingsErrors.maxBooks}</small>}
                    </label>
                    <label>
                      Grace Period (days)
                      <input
                        type="number"
                        min="0"
                        value={settingsDraft.graceDays}
                        onChange={(event) => handleSettingsFieldChange('graceDays', event.target.value)}
                      />
                      {settingsErrors.graceDays && <small className="settings-error">{settingsErrors.graceDays}</small>}
                    </label>
                    <label>
                      Weekend Issue
                      <select
                        value={settingsDraft.weekendIssue ? 'Enabled' : 'Disabled'}
                        onChange={(event) => handleSettingsFieldChange('weekendIssue', event.target.value === 'Enabled')}
                      >
                        <option>Enabled</option>
                        <option>Disabled</option>
                      </select>
                    </label>
                  </div>
                </article>

                <article className="settings-box">
                  <h3>Alerts & Notifications</h3>
                  <div className="librarian-form-grid">
                    <label>
                      Reminder Frequency
                      <select
                        value={settingsDraft.reminderFrequency}
                        onChange={(event) => handleSettingsFieldChange('reminderFrequency', event.target.value)}
                      >
                        <option>Daily</option>
                        <option>Every 2 days</option>
                        <option>Weekly</option>
                      </select>
                    </label>
                    <label>
                      Reminder Channel
                      <select
                        value={settingsDraft.reminderChannel}
                        onChange={(event) => handleSettingsFieldChange('reminderChannel', event.target.value)}
                      >
                        <option>SMS</option>
                        <option>Email</option>
                        <option>SMS + Email</option>
                      </select>
                    </label>
                    <label>
                      Auto Suspend Overdue
                      <select
                        value={settingsDraft.autoSuspendOverdue ? 'Enabled' : 'Disabled'}
                        onChange={(event) => handleSettingsFieldChange('autoSuspendOverdue', event.target.value === 'Enabled')}
                      >
                        <option>Enabled</option>
                        <option>Disabled</option>
                      </select>
                    </label>
                    <label>
                      Require Approval for Exceptions
                      <select
                        value={settingsDraft.requireApproval ? 'Enabled' : 'Disabled'}
                        onChange={(event) => handleSettingsFieldChange('requireApproval', event.target.value === 'Enabled')}
                      >
                        <option>Enabled</option>
                        <option>Disabled</option>
                      </select>
                    </label>
                  </div>
                </article>

                <article className="settings-box full-width">
                  <h3>Integration & Reporting</h3>
                  <div className="librarian-form-grid">
                    <label>
                      SMS Provider
                      <select
                        value={settingsDraft.smsProvider}
                        onChange={(event) => handleSettingsFieldChange('smsProvider', event.target.value)}
                      >
                        <option>Twilio</option>
                        <option>MTN Bulk SMS</option>
                        <option>Orange API</option>
                      </select>
                    </label>
                    <label>
                      Email Sender
                      <input
                        value={settingsDraft.emailSender}
                        onChange={(event) => handleSettingsFieldChange('emailSender', event.target.value)}
                      />
                      {settingsErrors.emailSender && <small className="settings-error">{settingsErrors.emailSender}</small>}
                    </label>
                    <label>
                      Automated Report Schedule
                      <select
                        value={settingsDraft.autoReport}
                        onChange={(event) => handleSettingsFieldChange('autoReport', event.target.value)}
                      >
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                      </select>
                    </label>
                    <label>
                      Test Notifications
                      <button type="button" className="secondary" onClick={() => setNotice('Demo: Test notification sent successfully.')}>Send Test Alert</button>
                    </label>
                  </div>
                </article>

                <article className="settings-box full-width settings-health-box">
                  <h3>Configuration Health</h3>
                  <div className="settings-health-grid">
                    <div>
                      <FaShieldAlt />
                      <p>{settingsDraft.autoSuspendOverdue ? 'Auto-suspension is enabled for overdue control.' : 'Auto-suspension is disabled.'}</p>
                    </div>
                    <div>
                      <FaBell />
                      <p>Reminder schedule: {settingsDraft.reminderFrequency} via {settingsDraft.reminderChannel}.</p>
                    </div>
                    <div>
                      <FaEnvelope />
                      <p>Sender identity: {settingsDraft.emailSender}.</p>
                    </div>
                  </div>
                </article>
              </div>

              <div className={`settings-save-status ${hasUnsavedSettings ? 'pending' : 'synced'}`}>
                {hasUnsavedSettings ? 'Unsaved changes detected' : `All changes synced • ${settingsLastSavedAt}`}
              </div>

              <div className="librarian-form-actions">
                <button type="button" className="primary" onClick={saveLibrarySettings}>Save Settings</button>
                <button type="button" className="secondary" onClick={revertLibrarySettings}>Revert</button>
                <button type="button" className="secondary" onClick={resetLibrarySettingsDefaults}>Load Defaults</button>
              </div>
              {notice && <p className="librarian-note">{notice}</p>}
            </section>
          </div>
        );
      case 'profile':
        return (
          <div className="librarian-profile-layout">
            <section className="librarian-panel">
              <div className="librarian-panel-head">
                <div>
                  <h2>Profile</h2>
                  <p>Manage librarian identity, security, and account preferences.</p>
                </div>
              </div>
              <EditProfile profile={profileForEdit} onSaveProfile={onSaveProfile} />
            </section>

            <section className="librarian-panel profile-side-panel">
              <div className="librarian-panel-head">
                <h3>Account Overview</h3>
              </div>
              <div className="profile-overview-card">
                <img src={profile?.avatar || buildAvatar(profile?.name || 'Librarian')} alt="Librarian profile" />
                <div>
                  <h4>{profile?.name || 'Librarian'}</h4>
                  <p>{profile?.matricule || 'LIB2026'} • Library Operations</p>
                </div>
              </div>
              <div className="profile-status-list">
                <p><FaShieldAlt /> Password protection enabled</p>
                <p><FaBell /> Notification channel: {settingsDraft.reminderChannel}</p>
                <p><FaEnvelope /> Contact sender: {settingsDraft.emailSender}</p>
              </div>
              <div className="librarian-form-actions profile-quick-actions">
                <button type="button" className="secondary" onClick={() => setActiveView('settings')}>Open Security Settings</button>
                <button type="button" className="secondary" onClick={() => setActiveView('reports')}>Go to Reports</button>
              </div>
            </section>
          </div>
        );
      default:
        return (
          <>
            <section className="librarian-welcome">
              <div>
                <h1>Welcome, {profile?.name || 'Librarian'}!</h1>
                <p>Library Operations Center • Track circulation, members, and overdue performance in one place.</p>
              </div>
              <img src={profile?.avatar || 'https://via.placeholder.com/64'} alt="Librarian avatar" />
            </section>

            <section className="librarian-stats">
              <article className="librarian-stat-card">
                <FaBook />
                <div>
                  <h3>2,487 Books</h3>
                  <p>Total cataloged</p>
                  <span className="librarian-stat-meta">+48 this term</span>
                </div>
              </article>
              <article className="librarian-stat-card">
                <FaHandHolding />
                <div>
                  <h3>312 Issued</h3>
                  <p>Active borrowings</p>
                  <span className="librarian-stat-meta">+6% vs last month</span>
                </div>
              </article>
              <article className="librarian-stat-card">
                <FaChartLine />
                <div>
                  <h3>{returnRate}% Return Rate</h3>
                  <p>Average on-time returns</p>
                  <span className="librarian-stat-meta">Across 6 months</span>
                </div>
              </article>
              <article className="librarian-stat-card">
                <FaExclamationTriangle />
                <div>
                  <h3>{unreadNotificationCount} Overdue</h3>
                  <p>Needs follow-up</p>
                  <span className="librarian-stat-meta warning">Priority alerts</span>
                </div>
              </article>
            </section>

            <section className="librarian-grid analytics">
              <article className="librarian-panel">
                <div className="librarian-panel-head">
                  <div>
                    <h3>Circulation Trend (Issued vs Returned)</h3>
                    <p>Monthly movement of borrowed and returned books.</p>
                  </div>
                </div>
                <div className="librarian-trend-chart">
                  {circulationTrend.map((item) => (
                    <div key={item.month} className="trend-col">
                      <div className="trend-bars">
                        <span
                          className="bar issued"
                          style={{ height: `${Math.max((item.issued / maxCirculationValue) * 132, 10)}px` }}
                          title={`Issued: ${item.issued}`}
                        />
                        <span
                          className="bar returned"
                          style={{ height: `${Math.max((item.returned / maxCirculationValue) * 132, 10)}px` }}
                          title={`Returned: ${item.returned}`}
                        />
                      </div>
                      <strong>{item.month}</strong>
                    </div>
                  ))}
                </div>
                <div className="librarian-legend">
                  <span><i className="issued" />Issued</span>
                  <span><i className="returned" />Returned</span>
                </div>
              </article>

              <article className="librarian-panel">
                <div className="librarian-panel-head">
                  <div>
                    <h3>Catalog Distribution</h3>
                    <p>Book collection split by subject category.</p>
                  </div>
                </div>
                <div className="librarian-distribution-list">
                  {categoryDistribution.map((item) => (
                    <div key={item.label} className="distribution-row">
                      <div className="distribution-top">
                        <span>{item.label}</span>
                        <strong>{item.value}%</strong>
                      </div>
                      <div className="distribution-track">
                        <div className="distribution-fill" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="librarian-stats librarian-secondary-stats">
              <article className="librarian-stat-card compact">
                <FaUsers />
                <div>
                  <h3>{activeMembersCount}</h3>
                  <p>Active Members</p>
                </div>
              </article>
              <article className="librarian-stat-card compact">
                <FaClock />
                <div>
                  <h3>{dueSoonCount}</h3>
                  <p>Due Soon (14 days)</p>
                </div>
              </article>
              <article className="librarian-stat-card compact">
                <FaUndoAlt />
                <div>
                  <h3>{totalReturned}</h3>
                  <p>Total Returned (6 months)</p>
                </div>
              </article>
              <article className="librarian-stat-card compact">
                <FaHandHolding />
                <div>
                  <h3>{totalIssued}</h3>
                  <p>Total Issued (6 months)</p>
                </div>
              </article>
            </section>

            <section className="librarian-grid">
              <article className="librarian-panel">
                <div className="librarian-panel-head">
                  <h3>Recent Borrowing Activity</h3>
                </div>
                <div className="librarian-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Book</th>
                        <th>Due</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {borrowingRecords.map((row) => (
                        <tr key={row.id}>
                          <td>{row.member}</td>
                          <td>{row.book}</td>
                          <td>{row.dueDate}</td>
                          <td><span className={`librarian-badge ${row.status.toLowerCase()}`}>{row.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="librarian-panel">
                <div className="librarian-panel-head">
                  <h3>Quick Actions</h3>
                </div>
                <div className="librarian-form-actions">
                  <button type="button" className="primary" onClick={() => setActiveView('add-book')}>Add New Book</button>
                  <button type="button" className="secondary" onClick={() => setActiveView('issue-book')}>Issue Book</button>
                  <button type="button" className="secondary" onClick={() => setActiveView('overdue-books')}>View Overdue</button>
                </div>
                <div className="librarian-chip-list" style={{ marginTop: 12 }}>
                  <span>Automation: Active</span>
                  <span>SMS Reminders: Enabled</span>
                  <span>Data Sync: Healthy</span>
                </div>
              </article>
            </section>
          </>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <LibrarianSidebar
        active={activeView}
        onSelect={handleSidebarSelect}
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}
      />

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <Header
        onToggleMenu={() => setSidebarOpen((prev) => !prev)}
        onLogout={onLogout}
        profile={profile}
        notificationCount={unreadNotificationCount}
        notifications={notificationItems}
        onNotificationSelect={() => setActiveView('overdue-books')}
        onMarkAllNotificationsRead={() => setNotice('Overdue notifications marked as reviewed.')}
        onViewAllNotifications={() => setActiveView('overdue-books')}
      />

      <main className="librarian-dashboard-main">
        {renderMain()}
      </main>

      <footer className="dashboard-footer">
        <a
          href="https://www.youtube.com/results?search_query=how+to+use+librarian+dashboard"
          target="_blank"
          rel="noreferrer"
        >
          Learn how to use your dashboard
        </a>
        <button type="button" onClick={() => setShowSupportForm(true)}>Support</button>
      </footer>

      {showSupportForm && (
        <div className="support-modal-overlay" role="dialog" aria-modal="true">
          <div className="support-modal">
            <h3>Support</h3>
            <p>
              Thank you for using this system. Your support helps us maintain and improve the dashboard with better features and faster updates.
            </p>
            <form onSubmit={submitSupportForm}>
              <label>
                Payment Method
                <select value={supportPaymentMethod} onChange={(e) => setSupportPaymentMethod(e.target.value)}>
                  <option>Orange Money</option>
                  <option>Mobile Money</option>
                </select>
              </label>
              <label>
                Amount
                <input
                  type="number"
                  min="1"
                  value={supportAmount}
                  onChange={(e) => setSupportAmount(e.target.value)}
                  placeholder="Enter support amount"
                />
              </label>
              <label>
                Phone Number
                <input
                  type="tel"
                  value={supporterNumber}
                  onChange={(e) => setSupporterNumber(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </label>
              <label>
                Message
                <textarea
                  rows={3}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Write a short appreciation message"
                />
              </label>

              <div className="support-modal-actions">
                <button type="button" className="ghost" onClick={() => setShowSupportForm(false)}>Cancel</button>
                <button type="submit" className="primary">Submit Support</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianDashboard;
