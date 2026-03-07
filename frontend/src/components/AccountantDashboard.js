import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  FaChartLine,
  FaUsers,
  FaFileInvoiceDollar,
  FaBell
} from 'react-icons/fa';
import Header from './Header';
import AccountantSidebar from './AccountantSidebar';
import EditProfile from './EditProfile';
import './TeacherDashboard.css';
import './ParentDashboard.css';
import './AccountantDashboard.css';

const buildAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f6feb&color=fff&bold=true`;

const DEFAULT_ACCOUNTANT_SETTINGS = {
  emailNotifications: true,
  smsNotifications: true,
  autoInvoiceGeneration: false,
  invoicePrefix: 'INV-2026',
  lateFeePercent: '5',
  timezone: 'Africa/Douala',
  reportCycle: 'Weekly'
};

const initialStudents = [
  {
    id: 1,
    name: 'Emily Johnson',
    className: 'Grade 5',
    guardian: 'Mary Johnson',
    phone: '+237 677 000 444',
    status: 'Active',
    totalBilled: 175000,
    totalPaid: 90000,
    lastPayment: '2026-02-10'
  },
  {
    id: 2,
    name: 'Daniel Johnson',
    className: 'Grade 3',
    guardian: 'Mary Johnson',
    phone: '+237 677 000 444',
    status: 'Active',
    totalBilled: 143000,
    totalPaid: 75000,
    lastPayment: '2026-02-09'
  },
  {
    id: 3,
    name: 'Michael Tabi',
    className: 'Grade 6',
    guardian: 'Anna Tabi',
    phone: '+237 677 211 100',
    status: 'At Risk',
    totalBilled: 180000,
    totalPaid: 40000,
    lastPayment: '2026-01-25'
  },
  {
    id: 4,
    name: 'Rita Nsame',
    className: 'Grade 4',
    guardian: 'Joseph Nsame',
    phone: '+237 677 332 221',
    status: 'Cleared',
    totalBilled: 150000,
    totalPaid: 150000,
    lastPayment: '2026-03-02'
  }
];

const initialFeeStructure = [
  { id: 1, item: 'Tuition Fee', level: 'All', term: 'Term 2', amount: 120000, dueDay: '15', mandatory: true, active: true },
  { id: 2, item: 'Transport Fee', level: 'Grade 3-6', term: 'Term 2', amount: 30000, dueDay: '20', mandatory: false, active: true },
  { id: 3, item: 'Laboratory Levy', level: 'Grade 5-7', term: 'Term 2', amount: 15000, dueDay: '10', mandatory: true, active: true },
  { id: 4, item: 'PTA Contribution', level: 'All', term: 'Term 2', amount: 10000, dueDay: '25', mandatory: false, active: true }
];

const initialInvoices = [
  {
    id: 1,
    invoiceNo: 'INV-2026-301',
    studentName: 'Emily Johnson',
    className: 'Grade 5',
    title: 'Term 2 Tuition',
    term: 'Term 2',
    dueDate: '2026-03-15',
    amount: 120000,
    status: 'Unpaid',
    createdAt: '2026-03-01'
  },
  {
    id: 2,
    invoiceNo: 'INV-2026-302',
    studentName: 'Daniel Johnson',
    className: 'Grade 3',
    title: 'Transport Fee',
    term: 'Term 2',
    dueDate: '2026-03-20',
    amount: 30000,
    status: 'Unpaid',
    createdAt: '2026-03-01'
  },
  {
    id: 3,
    invoiceNo: 'INV-2026-289',
    studentName: 'Rita Nsame',
    className: 'Grade 4',
    title: 'Exam Registration',
    term: 'Term 2',
    dueDate: '2026-02-26',
    amount: 25000,
    status: 'Paid',
    createdAt: '2026-02-10'
  }
];

const initialPaymentHistory = [
  { id: 1, studentName: 'Emily Johnson', date: '2026-02-10', amount: 90000, method: 'Mobile Money', reference: 'TXN-92451', status: 'Successful' },
  { id: 2, studentName: 'Daniel Johnson', date: '2026-02-09', amount: 75000, method: 'Orange Money', reference: 'OM-22451', status: 'Successful' },
  { id: 3, studentName: 'Rita Nsame', date: '2026-03-02', amount: 150000, method: 'Bank Transfer', reference: 'TRF-44309', status: 'Successful' }
];

const initialAnnouncements = [
  {
    id: 1,
    title: 'Fee Collection Window Update',
    message: 'Term 2 fee collection remains open until March 20, 2026.',
    date: '2026-03-20',
    type: 'Finance'
  },
  {
    id: 2,
    title: 'Bursary List Published',
    message: 'Approved bursary beneficiaries have been published for review.',
    date: '2026-03-12',
    type: 'Important'
  }
];

const initialMessages = [
  {
    id: 1,
    from: 'Principal Office',
    preview: 'Please prepare an updated fee arrears summary before Friday.',
    date: '2026-03-06',
    priority: 'High'
  },
  {
    id: 2,
    from: 'Parent Helpdesk',
    preview: 'Several parents requested invoice copies for transport fees.',
    date: '2026-03-05',
    priority: 'Normal'
  }
];

const initialNotifications = [
  { id: 1, title: '2 new payments received', date: '2026-03-06', unread: true, view: 'financial-reports' },
  { id: 2, title: 'Invoice batch due tomorrow', date: '2026-03-06', unread: true, view: 'invoices' },
  { id: 3, title: 'Message from Principal Office', date: '2026-03-06', unread: true, view: 'messages' },
  { id: 4, title: 'Announcement updated: Fee Collection', date: '2026-03-05', unread: false, view: 'announcements' }
];

const AccountantDashboard = ({ profile, onSaveProfile = () => {}, onLogout = () => {} }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [students] = useState(initialStudents);
  const [feeStructure, setFeeStructure] = useState(initialFeeStructure);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [paymentHistory] = useState(initialPaymentHistory);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [messages, setMessages] = useState(initialMessages);
  const [notifications, setNotifications] = useState(initialNotifications);

  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState(initialAnnouncements[0]?.id || null);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudents[0]?.id || null);

  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('All Status');
  const [studentClassFilter, setStudentClassFilter] = useState('All Classes');
  const [studentSortBy, setStudentSortBy] = useState('balanceDesc');

  const [feeSearch, setFeeSearch] = useState('');
  const [feeLevelFilter, setFeeLevelFilter] = useState('All Levels');
  const [feeStatusFilter, setFeeStatusFilter] = useState('All');
  const [newFeeItemDraft, setNewFeeItemDraft] = useState({
    item: '',
    level: 'All',
    term: 'Term 2',
    amount: '',
    dueDay: '15',
    mandatory: true,
    active: true
  });

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All');
  const [invoiceTermFilter, setInvoiceTermFilter] = useState('All Terms');
  const [invoiceSortBy, setInvoiceSortBy] = useState('dueDate');
  const [invoiceDraft, setInvoiceDraft] = useState({
    studentId: String(initialStudents[0]?.id || ''),
    title: 'Term 2 Tuition',
    term: 'Term 2',
    dueDate: '2026-03-25',
    amount: ''
  });

  const [reportPeriod, setReportPeriod] = useState('This Term');
  const [reportType, setReportType] = useState('All');

  const [announcementDraft, setAnnouncementDraft] = useState({
    title: '',
    type: 'Finance',
    message: ''
  });

  const [messageDraft, setMessageDraft] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [messagePriorityFilter, setMessagePriorityFilter] = useState('All');

  const [notificationSearch, setNotificationSearch] = useState('');
  const [notificationStatusFilter, setNotificationStatusFilter] = useState('All');
  const [notice, setNotice] = useState('');

  const [settingsDraft, setSettingsDraft] = useState({ ...DEFAULT_ACCOUNTANT_SETTINGS });
  const [savedSettingsSnapshot, setSavedSettingsSnapshot] = useState({ ...DEFAULT_ACCOUNTANT_SETTINGS });
  const [settingsLastSavedAt, setSettingsLastSavedAt] = useState('Not saved yet');

  const profileForEdit = useMemo(() => ({
    matricule: profile?.matricule || 'ACC2026',
    name: profile?.name || 'Accountant User',
    avatar: profile?.avatar || buildAvatar(profile?.name || 'Accountant User'),
    password: profile?.password || 'accountant123',
    phone: profile?.phone || '677000555'
  }), [profile]);

  const selectedAnnouncement = announcements.find((item) => item.id === selectedAnnouncementId) || announcements[0] || null;

  const classOptions = useMemo(
    () => ['All Classes', ...Array.from(new Set(students.map((item) => item.className)))],
    [students]
  );

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    return students
      .filter((item) => {
        const statusMatch = studentStatusFilter === 'All Status' || item.status === studentStatusFilter;
        const classMatch = studentClassFilter === 'All Classes' || item.className === studentClassFilter;
        const queryMatch = !query || `${item.name} ${item.className} ${item.guardian} ${item.phone}`.toLowerCase().includes(query);
        return statusMatch && classMatch && queryMatch;
      })
      .sort((left, right) => {
        const leftBalance = left.totalBilled - left.totalPaid;
        const rightBalance = right.totalBilled - right.totalPaid;
        if (studentSortBy === 'name') return left.name.localeCompare(right.name);
        if (studentSortBy === 'class') return left.className.localeCompare(right.className);
        if (studentSortBy === 'balanceAsc') return leftBalance - rightBalance;
        return rightBalance - leftBalance;
      });
  }, [students, studentSearch, studentStatusFilter, studentClassFilter, studentSortBy]);

  const studentSummary = useMemo(() => {
    const totalBilled = students.reduce((sum, item) => sum + item.totalBilled, 0);
    const totalPaid = students.reduce((sum, item) => sum + item.totalPaid, 0);
    return {
      total: students.length,
      active: students.filter((item) => item.status === 'Active').length,
      atRisk: students.filter((item) => item.status === 'At Risk').length,
      totalBalance: totalBilled - totalPaid
    };
  }, [students]);

  const selectedStudent = students.find((item) => item.id === Number(selectedStudentId)) || students[0] || null;

  const feeLevelOptions = useMemo(
    () => ['All Levels', ...Array.from(new Set(feeStructure.map((item) => item.level)))],
    [feeStructure]
  );

  const filteredFeeStructure = useMemo(() => {
    const query = feeSearch.trim().toLowerCase();

    return feeStructure
      .filter((item) => {
        const levelMatch = feeLevelFilter === 'All Levels' || item.level === feeLevelFilter;
        const activeMatch = feeStatusFilter === 'All' || (feeStatusFilter === 'Active' ? item.active : !item.active);
        const queryMatch = !query || `${item.item} ${item.term} ${item.level}`.toLowerCase().includes(query);
        return levelMatch && activeMatch && queryMatch;
      })
      .sort((left, right) => right.amount - left.amount);
  }, [feeStructure, feeSearch, feeLevelFilter, feeStatusFilter]);

  const feeSummary = useMemo(() => ({
    totalItems: feeStructure.length,
    activeItems: feeStructure.filter((item) => item.active).length,
    mandatoryItems: feeStructure.filter((item) => item.mandatory).length,
    avgAmount: feeStructure.length
      ? Math.round(feeStructure.reduce((sum, item) => sum + item.amount, 0) / feeStructure.length)
      : 0
  }), [feeStructure]);

  const invoiceTermOptions = useMemo(
    () => ['All Terms', ...Array.from(new Set(invoices.map((item) => item.term)))],
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch.trim().toLowerCase();

    return invoices
      .filter((item) => {
        const statusMatch = invoiceStatusFilter === 'All' || item.status === invoiceStatusFilter;
        const termMatch = invoiceTermFilter === 'All Terms' || item.term === invoiceTermFilter;
        const queryMatch = !query || `${item.invoiceNo} ${item.studentName} ${item.title} ${item.className}`.toLowerCase().includes(query);
        return statusMatch && termMatch && queryMatch;
      })
      .sort((left, right) => {
        if (invoiceSortBy === 'amountDesc') return right.amount - left.amount;
        if (invoiceSortBy === 'student') return left.studentName.localeCompare(right.studentName);
        return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
      });
  }, [invoices, invoiceSearch, invoiceStatusFilter, invoiceTermFilter, invoiceSortBy]);

  const invoiceSummary = useMemo(() => ({
    total: invoices.length,
    unpaid: invoices.filter((item) => item.status === 'Unpaid').length,
    paid: invoices.filter((item) => item.status === 'Paid').length,
    unpaidAmount: invoices.filter((item) => item.status === 'Unpaid').reduce((sum, item) => sum + item.amount, 0)
  }), [invoices]);

  const reportRows = useMemo(() => {
    const rows = invoices.map((invoice) => ({
      ...invoice,
      period: new Date(invoice.createdAt).getMonth() < 6 ? 'This Term' : 'Last Term'
    }));

    return rows.filter((item) => {
      const periodMatch = reportPeriod === 'All Periods' || item.period === reportPeriod;
      const typeMatch = reportType === 'All'
        ? true
        : reportType === 'Collections'
          ? item.status === 'Paid'
          : item.status === 'Unpaid';
      return periodMatch && typeMatch;
    });
  }, [invoices, reportPeriod, reportType]);

  const reportSummary = useMemo(() => ({
    rows: reportRows.length,
    billed: reportRows.reduce((sum, item) => sum + item.amount, 0),
    collected: reportRows.filter((item) => item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0),
    pending: reportRows.filter((item) => item.status === 'Unpaid').reduce((sum, item) => sum + item.amount, 0)
  }), [reportRows]);

  const reportCollectionRate = reportSummary.billed
    ? Math.round((reportSummary.collected / reportSummary.billed) * 100)
    : 0;

  const monthlyCollections = useMemo(() => {
    const map = paymentHistory.reduce((accumulator, item) => {
      const month = item.date.slice(0, 7);
      accumulator[month] = (accumulator[month] || 0) + item.amount;
      return accumulator;
    }, {});

    return Object.entries(map)
      .map(([month, amount]) => ({ month, amount }))
      .sort((left, right) => left.month.localeCompare(right.month));
  }, [paymentHistory]);

  const maxCollection = monthlyCollections.length
    ? Math.max(...monthlyCollections.map((item) => item.amount))
    : 1;

  const filteredMessages = useMemo(() => {
    const query = messageSearch.trim().toLowerCase();
    return messages
      .filter((item) => {
        const priorityMatch = messagePriorityFilter === 'All' || item.priority === messagePriorityFilter;
        const queryMatch = !query || `${item.from} ${item.preview} ${item.date}`.toLowerCase().includes(query);
        return priorityMatch && queryMatch;
      })
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [messages, messageSearch, messagePriorityFilter]);

  const filteredNotifications = useMemo(() => {
    const query = notificationSearch.trim().toLowerCase();
    return notifications
      .filter((item) => {
        const statusMatch = notificationStatusFilter === 'All'
          || (notificationStatusFilter === 'Unread' ? item.unread : !item.unread);
        const queryMatch = !query || `${item.title} ${item.date}`.toLowerCase().includes(query);
        return statusMatch && queryMatch;
      })
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [notifications, notificationSearch, notificationStatusFilter]);

  const notificationItems = notifications.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    unread: item.unread
  }));

  const unreadNotificationCount = notificationItems.filter((item) => item.unread).length;

  const hasUnsavedSettings = useMemo(
    () => JSON.stringify(settingsDraft) !== JSON.stringify(savedSettingsSnapshot),
    [settingsDraft, savedSettingsSnapshot]
  );

  const handleSidebarSelect = (viewKey) => {
    setActiveView(viewKey);
    setSidebarOpen(false);
    setNotice('');
  };

  const handleNotificationSelect = (notificationId) => {
    const selected = notifications.find((item) => item.id === notificationId);
    setNotifications((prev) => prev.map((item) => (
      item.id === notificationId ? { ...item, unread: false } : item
    )));

    if (selected?.view) {
      setActiveView(selected.view);
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    setNotice('All notifications marked as read.');
  };

  const resetStudentFilters = () => {
    setStudentSearch('');
    setStudentStatusFilter('All Status');
    setStudentClassFilter('All Classes');
    setStudentSortBy('balanceDesc');
  };

  const resetFeeFilters = () => {
    setFeeSearch('');
    setFeeLevelFilter('All Levels');
    setFeeStatusFilter('All');
  };

  const resetInvoiceFilters = () => {
    setInvoiceSearch('');
    setInvoiceStatusFilter('All');
    setInvoiceTermFilter('All Terms');
    setInvoiceSortBy('dueDate');
  };

  const resetReportFilters = () => {
    setReportPeriod('This Term');
    setReportType('All');
  };

  const resetMessageFilters = () => {
    setMessageSearch('');
    setMessagePriorityFilter('All');
  };

  const resetNotificationFilters = () => {
    setNotificationSearch('');
    setNotificationStatusFilter('All');
  };

  const addFeeItem = (event) => {
    event.preventDefault();

    const item = newFeeItemDraft.item.trim();
    const amount = Number(newFeeItemDraft.amount);
    if (!item || !Number.isFinite(amount) || amount <= 0) {
      alert('Please enter a valid fee item and amount.');
      return;
    }

    setFeeStructure((prev) => ([
      {
        id: Date.now(),
        item,
        level: newFeeItemDraft.level,
        term: newFeeItemDraft.term,
        amount,
        dueDay: newFeeItemDraft.dueDay,
        mandatory: newFeeItemDraft.mandatory,
        active: newFeeItemDraft.active
      },
      ...prev
    ]));

    setNewFeeItemDraft({
      item: '',
      level: 'All',
      term: 'Term 2',
      amount: '',
      dueDay: '15',
      mandatory: true,
      active: true
    });
    setNotice(`Fee item "${item}" added successfully.`);
  };

  const toggleFeeItemStatus = (id) => {
    let updatedLabel = '';
    let updatedStatus = false;
    setFeeStructure((prev) => prev.map((item) => {
      if (item.id === id) {
        updatedLabel = item.item;
        updatedStatus = !item.active;
        return { ...item, active: !item.active };
      }
      return item;
    }));
    setNotice(`Fee item "${updatedLabel}" is now ${updatedStatus ? 'active' : 'inactive'}.`);
  };

  const createInvoice = (event) => {
    event.preventDefault();

    const selected = students.find((item) => String(item.id) === invoiceDraft.studentId);
    const amount = Number(invoiceDraft.amount);

    if (!selected || !invoiceDraft.title.trim() || !invoiceDraft.dueDate || !Number.isFinite(amount) || amount <= 0) {
      alert('Please complete invoice fields with valid values.');
      return;
    }

    const sequence = invoices.length + 301;
    const invoiceNo = `${settingsDraft.invoicePrefix}-${sequence}`;

    const newInvoice = {
      id: Date.now(),
      invoiceNo,
      studentName: selected.name,
      className: selected.className,
      title: invoiceDraft.title.trim(),
      term: invoiceDraft.term,
      dueDate: invoiceDraft.dueDate,
      amount,
      status: 'Unpaid',
      createdAt: new Date().toISOString().slice(0, 10)
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    setNotifications((prev) => ([
      {
        id: Date.now() + 1,
        title: `New invoice generated for ${selected.name}`,
        date: new Date().toISOString().slice(0, 10),
        unread: true,
        view: 'invoices'
      },
      ...prev
    ]));

    setInvoiceDraft((prev) => ({
      ...prev,
      amount: ''
    }));
    setNotice(`Invoice ${invoiceNo} created for ${selected.name}.`);
  };

  const markInvoicePaid = (id) => {
    let invoiceLabel = '';
    setInvoices((prev) => prev.map((item) => {
      if (item.id === id) {
        invoiceLabel = item.invoiceNo;
        return { ...item, status: 'Paid' };
      }
      return item;
    }));

    setNotifications((prev) => ([
      {
        id: Date.now(),
        title: 'Invoice marked as paid',
        date: new Date().toISOString().slice(0, 10),
        unread: true,
        view: 'invoices'
      },
      ...prev
    ]));
    setNotice(`Invoice ${invoiceLabel} marked as paid.`);
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
      date: new Date().toISOString().slice(0, 10),
      priority: 'Normal'
    };

    setMessages((prev) => [newMessage, ...prev]);
    setMessageDraft('');
    setNotice('Message sent successfully.');
  };

  const postAnnouncement = (event) => {
    event.preventDefault();

    const title = announcementDraft.title.trim();
    const message = announcementDraft.message.trim();

    if (!title || !message) {
      alert('Please enter announcement title and message.');
      return;
    }

    const newAnnouncement = {
      id: Date.now(),
      title,
      message,
      type: announcementDraft.type,
      date: new Date().toISOString().slice(0, 10)
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);
    setSelectedAnnouncementId(newAnnouncement.id);
    setAnnouncementDraft({ title: '', type: 'Finance', message: '' });
    setNotice('Announcement posted successfully.');
  };

  const saveSettings = (event) => {
    event.preventDefault();
    setSavedSettingsSnapshot({ ...settingsDraft });
    setSettingsLastSavedAt(new Date().toLocaleString());
    setNotice('Accountant settings saved successfully.');
  };

  const revertSettings = () => {
    setSettingsDraft({ ...savedSettingsSnapshot });
    setNotice('Settings reverted to last saved snapshot.');
  };

  const loadDefaultSettings = () => {
    setSettingsDraft({ ...DEFAULT_ACCOUNTANT_SETTINGS });
    setNotice('Default settings template loaded.');
  };

  const exportFinancialCsv = () => {
    const rows = [
      ['Invoice No', 'Student', 'Class', 'Title', 'Term', 'Due Date', 'Amount', 'Status'],
      ...reportRows.map((item) => [
        item.invoiceNo,
        item.studentName,
        item.className,
        item.title,
        item.term,
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
    link.download = `financial_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFinancialPdf = () => {
    if (!reportRows.length) {
      alert('No report rows available for export.');
      return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Financial Report', 14, 14);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);

    let y = 28;
    doc.setFontSize(10);
    doc.text(`Rows: ${reportSummary.rows}`, 14, y);
    doc.text(`Billed: ${reportSummary.billed.toLocaleString()} FCFA`, 60, y);
    doc.text(`Collected: ${reportSummary.collected.toLocaleString()} FCFA`, 120, y);

    y += 8;
    doc.setFontSize(9);
    doc.text('Invoice No', 14, y);
    doc.text('Student', 44, y);
    doc.text('Amount', 100, y);
    doc.text('Status', 130, y);
    doc.text('Due Date', 160, y);

    y += 4;
    reportRows.slice(0, 22).forEach((item) => {
      y += 6;
      doc.text(item.invoiceNo, 14, y);
      doc.text(item.studentName.slice(0, 24), 44, y);
      doc.text(String(item.amount), 100, y);
      doc.text(item.status, 130, y);
      doc.text(item.dueDate, 160, y);
    });

    doc.save(`financial_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const renderMain = () => {
    switch (activeView) {
      case 'students':
        return (
          <section className="analytics-card parent-panel accountant-panel">
            <div className="section-header">
              <div>
                <h2>Students</h2>
                <p>Review account standing, identify arrears quickly, and focus follow-up by class or status.</p>
              </div>
            </div>

            {notice && <p className="accountant-notice">{notice}</p>}

            <div className="parent-results-summary">
              <div><span>Total Students</span><strong>{studentSummary.total}</strong></div>
              <div><span>At Risk Accounts</span><strong>{studentSummary.atRisk}</strong></div>
              <div><span>Total Balance</span><strong>{studentSummary.totalBalance.toLocaleString()} FCFA</strong></div>
            </div>

            <div className="parent-results-controls">
              <label>
                Search Student
                <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Name, guardian, class" />
              </label>
              <label>
                Status
                <select value={studentStatusFilter} onChange={(event) => setStudentStatusFilter(event.target.value)}>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>At Risk</option>
                  <option>Cleared</option>
                </select>
              </label>
              <label>
                Class
                <select value={studentClassFilter} onChange={(event) => setStudentClassFilter(event.target.value)}>
                  {classOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Sort
                <select value={studentSortBy} onChange={(event) => setStudentSortBy(event.target.value)}>
                  <option value="balanceDesc">Balance (High to Low)</option>
                  <option value="balanceAsc">Balance (Low to High)</option>
                  <option value="name">Name</option>
                  <option value="class">Class</option>
                </select>
              </label>
              <button type="button" className="row-action" onClick={resetStudentFilters}>Reset Filters</button>
            </div>

            <div className="parent-table-wrap">
              <table className="parent-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Guardian</th>
                    <th>Phone</th>
                    <th>Billed</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((item) => {
                    const balance = item.totalBilled - item.totalPaid;
                    return (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.className}</td>
                        <td>{item.guardian}</td>
                        <td>{item.phone}</td>
                        <td>{item.totalBilled.toLocaleString()} FCFA</td>
                        <td>{item.totalPaid.toLocaleString()} FCFA</td>
                        <td>{balance.toLocaleString()} FCFA</td>
                        <td><span className={`fee-status ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>{item.status}</span></td>
                        <td><button type="button" className="row-action" onClick={() => setSelectedStudentId(item.id)}>Set Active</button></td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="9" className="attendance-empty">No student matches the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedStudent && (
              <div className="accountant-highlight-card">
                <strong>Selected Student: {selectedStudent.name}</strong>
                <p>
                  Last payment: {selectedStudent.lastPayment} • Balance:
                  {' '}
                  {(selectedStudent.totalBilled - selectedStudent.totalPaid).toLocaleString()} FCFA
                </p>
              </div>
            )}
          </section>
        );

      case 'fees-structure':
        return (
          <section className="analytics-card parent-panel accountant-panel">
            <div className="section-header">
              <div>
                <h2>Fees Structure</h2>
                <p>Maintain billable items, due windows, and mandatory flags for cleaner invoicing.</p>
              </div>
            </div>

            {notice && <p className="accountant-notice">{notice}</p>}

            <div className="parent-results-summary">
              <div><span>Total Fee Items</span><strong>{feeSummary.totalItems}</strong></div>
              <div><span>Mandatory Items</span><strong>{feeSummary.mandatoryItems}</strong></div>
              <div><span>Average Fee</span><strong>{feeSummary.avgAmount.toLocaleString()} FCFA</strong></div>
            </div>

            <div className="parent-results-controls">
              <label>
                Search Fee Item
                <input value={feeSearch} onChange={(event) => setFeeSearch(event.target.value)} placeholder="Tuition, transport..." />
              </label>
              <label>
                Level
                <select value={feeLevelFilter} onChange={(event) => setFeeLevelFilter(event.target.value)}>
                  {feeLevelOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Status
                <select value={feeStatusFilter} onChange={(event) => setFeeStatusFilter(event.target.value)}>
                  <option>All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>
              <button type="button" className="row-action" onClick={resetFeeFilters}>Reset Filters</button>
            </div>

            <form className="parent-results-controls accountant-grid-form" onSubmit={addFeeItem}>
              <label>
                Fee Item
                <input value={newFeeItemDraft.item} onChange={(event) => setNewFeeItemDraft((prev) => ({ ...prev, item: event.target.value }))} placeholder="Fee item name" />
              </label>
              <label>
                Level
                <input value={newFeeItemDraft.level} onChange={(event) => setNewFeeItemDraft((prev) => ({ ...prev, level: event.target.value }))} placeholder="All / Grade range" />
              </label>
              <label>
                Term
                <input value={newFeeItemDraft.term} onChange={(event) => setNewFeeItemDraft((prev) => ({ ...prev, term: event.target.value }))} />
              </label>
              <label>
                Amount
                <input type="number" min="1" value={newFeeItemDraft.amount} onChange={(event) => setNewFeeItemDraft((prev) => ({ ...prev, amount: event.target.value }))} />
              </label>
              <label>
                Due Day
                <input type="number" min="1" max="31" value={newFeeItemDraft.dueDay} onChange={(event) => setNewFeeItemDraft((prev) => ({ ...prev, dueDay: event.target.value }))} />
              </label>
              <label className="accountant-inline-check">
                <input type="checkbox" checked={newFeeItemDraft.mandatory} onChange={(event) => setNewFeeItemDraft((prev) => ({ ...prev, mandatory: event.target.checked }))} />
                Mandatory
              </label>
              <button type="submit">Add Fee Item</button>
            </form>

            <div className="parent-table-wrap">
              <table className="parent-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Level</th>
                    <th>Term</th>
                    <th>Amount</th>
                    <th>Due Day</th>
                    <th>Mandatory</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeeStructure.map((item) => (
                    <tr key={item.id}>
                      <td>{item.item}</td>
                      <td>{item.level}</td>
                      <td>{item.term}</td>
                      <td>{item.amount.toLocaleString()} FCFA</td>
                      <td>{item.dueDay}</td>
                      <td>{item.mandatory ? 'Yes' : 'No'}</td>
                      <td><span className={`fee-status ${item.active ? 'paid' : 'unpaid'}`}>{item.active ? 'Active' : 'Inactive'}</span></td>
                      <td><button type="button" className="row-action" onClick={() => toggleFeeItemStatus(item.id)}>{item.active ? 'Disable' : 'Enable'}</button></td>
                    </tr>
                  ))}
                  {filteredFeeStructure.length === 0 && (
                    <tr>
                      <td colSpan="8" className="attendance-empty">No fee item matches your current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );

      case 'invoices':
        return (
          <section className="analytics-card parent-panel accountant-panel">
            <div className="section-header">
              <div>
                <h2>Invoices</h2>
                <p>Create, track, and settle invoices with fast filtering and clear payment statuses.</p>
              </div>
            </div>

            {notice && <p className="accountant-notice">{notice}</p>}

            <div className="parent-results-summary">
              <div><span>Total Invoices</span><strong>{invoiceSummary.total}</strong></div>
              <div><span>Unpaid Amount</span><strong>{invoiceSummary.unpaidAmount.toLocaleString()} FCFA</strong></div>
              <div><span>Paid Invoices</span><strong>{invoiceSummary.paid}</strong></div>
            </div>

            <div className="parent-results-controls">
              <label>
                Search
                <input value={invoiceSearch} onChange={(event) => setInvoiceSearch(event.target.value)} placeholder="Invoice, student, class" />
              </label>
              <label>
                Status
                <select value={invoiceStatusFilter} onChange={(event) => setInvoiceStatusFilter(event.target.value)}>
                  <option>All</option>
                  <option>Paid</option>
                  <option>Unpaid</option>
                </select>
              </label>
              <label>
                Term
                <select value={invoiceTermFilter} onChange={(event) => setInvoiceTermFilter(event.target.value)}>
                  {invoiceTermOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Sort
                <select value={invoiceSortBy} onChange={(event) => setInvoiceSortBy(event.target.value)}>
                  <option value="dueDate">Due Date</option>
                  <option value="amountDesc">Amount</option>
                  <option value="student">Student</option>
                </select>
              </label>
              <button type="button" className="row-action" onClick={resetInvoiceFilters}>Reset Filters</button>
            </div>

            <form className="parent-results-controls accountant-grid-form" onSubmit={createInvoice}>
              <label>
                Student
                <select value={invoiceDraft.studentId} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, studentId: event.target.value }))}>
                  {students.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.className})</option>
                  ))}
                </select>
              </label>
              <label>
                Title
                <input value={invoiceDraft.title} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, title: event.target.value }))} />
              </label>
              <label>
                Term
                <input value={invoiceDraft.term} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, term: event.target.value }))} />
              </label>
              <label>
                Due Date
                <input type="date" value={invoiceDraft.dueDate} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, dueDate: event.target.value }))} />
              </label>
              <label>
                Amount
                <input type="number" min="1" value={invoiceDraft.amount} onChange={(event) => setInvoiceDraft((prev) => ({ ...prev, amount: event.target.value }))} />
              </label>
              <button type="submit">Create Invoice</button>
            </form>

            <div className="parent-table-wrap">
              <table className="parent-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Title</th>
                    <th>Term</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((item) => (
                    <tr key={item.id}>
                      <td>{item.invoiceNo}</td>
                      <td>{item.studentName}</td>
                      <td>{item.className}</td>
                      <td>{item.title}</td>
                      <td>{item.term}</td>
                      <td>{item.dueDate}</td>
                      <td>{item.amount.toLocaleString()} FCFA</td>
                      <td><span className={`fee-status ${item.status.toLowerCase()}`}>{item.status}</span></td>
                      <td>
                        {item.status === 'Unpaid'
                          ? <button type="button" className="row-action" onClick={() => markInvoicePaid(item.id)}>Mark Paid</button>
                          : <span className="row-tag">Paid</span>}
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan="9" className="attendance-empty">No invoice matches your selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );

      case 'financial-reports':
        return (
          <section className="analytics-card parent-panel accountant-panel accountant-financial-tab">
            <div className="section-header">
              <div>
                <h2>Financial Reports</h2>
                <p>Monitor collections, pending balances, and export ready-to-share finance snapshots.</p>
              </div>
              <div className="parent-attendance-actions">
                <button type="button" className="row-action" onClick={exportFinancialCsv}>Export CSV</button>
                <button type="button" className="row-action" onClick={exportFinancialPdf}>Export PDF</button>
              </div>
            </div>

            {notice && <p className="accountant-notice">{notice}</p>}

            <div className="parent-results-summary accountant-kpi-cards">
              <div><span>Total Billed</span><strong>{reportSummary.billed.toLocaleString()} FCFA</strong></div>
              <div><span>Total Collected</span><strong>{reportSummary.collected.toLocaleString()} FCFA</strong></div>
              <div><span>Collection Rate</span><strong>{reportCollectionRate}%</strong></div>
            </div>

            <div className="parent-results-controls accountant-filter-grid">
              <label>
                Report Period
                <select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)}>
                  <option>This Term</option>
                  <option>Last Term</option>
                  <option>All Periods</option>
                </select>
              </label>
              <label>
                Report Type
                <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
                  <option>All</option>
                  <option>Collections</option>
                  <option>Pending</option>
                </select>
              </label>
              <button type="button" className="row-action" onClick={resetReportFilters}>Reset</button>
            </div>

            <div className="accountant-chart-grid">
              {monthlyCollections.map((item) => (
                <article key={item.month}>
                  <span>{item.month}</span>
                  <div>
                    <i style={{ height: `${Math.max(8, (item.amount / maxCollection) * 100)}%` }} />
                  </div>
                  <strong>{item.amount.toLocaleString()}</strong>
                </article>
              ))}
              {monthlyCollections.length === 0 && <p className="attendance-empty">No collection trend data available.</p>}
            </div>

            <div className="parent-table-wrap">
              <table className="parent-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Student</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((item) => (
                    <tr key={item.id}>
                      <td>{item.invoiceNo}</td>
                      <td>{item.studentName}</td>
                      <td>{item.amount.toLocaleString()} FCFA</td>
                      <td>{item.status}</td>
                      <td>{item.dueDate}</td>
                    </tr>
                  ))}
                  {reportRows.length === 0 && (
                    <tr>
                      <td colSpan="5" className="attendance-empty">No report row found for the selected period/type.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );

      case 'announcements':
        return (
          <section className="analytics-card parent-panel accountant-panel accountant-announcements-tab">
            <div className="section-header">
              <div>
                <h2>Announcements</h2>
                <p>Publish important finance notices and keep stakeholders aligned.</p>
              </div>
            </div>

            {notice && <p className="accountant-notice">{notice}</p>}

            <form className="parent-message-form accountant-compose-form" onSubmit={postAnnouncement}>
              <input
                value={announcementDraft.title}
                onChange={(event) => setAnnouncementDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Announcement title"
              />
              <select
                value={announcementDraft.type}
                onChange={(event) => setAnnouncementDraft((prev) => ({ ...prev, type: event.target.value }))}
              >
                <option>Finance</option>
                <option>Important</option>
                <option>System</option>
              </select>
              <textarea
                rows={3}
                value={announcementDraft.message}
                onChange={(event) => setAnnouncementDraft((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Write announcement details"
              />
              <button type="submit">Post Announcement</button>
            </form>

            <div className="parent-announcement-layout accountant-announcement-layout">
              <ul className="parent-announcement-list">
                {announcements.map((item) => (
                  <li key={item.id} className={selectedAnnouncementId === item.id ? 'active' : ''} onClick={() => setSelectedAnnouncementId(item.id)}>
                    <strong>{item.title}</strong>
                    <small>{item.date}</small>
                  </li>
                ))}
                {announcements.length === 0 && <li className="attendance-empty">No announcement posted yet.</li>}
              </ul>

              {selectedAnnouncement && (
                <div className="parent-announcement-preview">
                  <h3>{selectedAnnouncement.title}</h3>
                  <p>{selectedAnnouncement.message}</p>
                  <span>{selectedAnnouncement.date} • {selectedAnnouncement.type}</span>
                </div>
              )}
            </div>
          </section>
        );

      case 'messages':
        return (
          <section className="analytics-card parent-panel accountant-panel accountant-messages-tab">
            <div className="section-header">
              <div>
                <h2>Messages</h2>
                <p>Communicate quickly with offices and staff using searchable message history.</p>
              </div>
            </div>

            {notice && <p className="accountant-notice">{notice}</p>}

            <div className="parent-results-controls accountant-filter-grid">
              <label>
                Search Messages
                <input value={messageSearch} onChange={(event) => setMessageSearch(event.target.value)} placeholder="Sender, content, date" />
              </label>
              <label>
                Priority
                <select value={messagePriorityFilter} onChange={(event) => setMessagePriorityFilter(event.target.value)}>
                  <option>All</option>
                  <option>High</option>
                  <option>Normal</option>
                  <option>Low</option>
                </select>
              </label>
              <button type="button" className="row-action" onClick={resetMessageFilters}>Reset Filters</button>
            </div>

            <form className="parent-message-form accountant-compose-form" onSubmit={sendMessage}>
              <textarea
                rows={3}
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="Write a message to principal, bursar, or class teachers..."
              />
              <button type="submit">Send Message</button>
            </form>

            <ul className="parent-message-list">
              {filteredMessages.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.from}</strong>
                    <p>{item.preview}</p>
                    <small>Priority: {item.priority}</small>
                  </div>
                  <small>{item.date}</small>
                </li>
              ))}
              {filteredMessages.length === 0 && (
                <li className="attendance-empty">No message matches the selected criteria.</li>
              )}
            </ul>
          </section>
        );

      case 'notifications':
        return (
          <section className="analytics-card parent-panel accountant-panel accountant-notifications-tab">
            <div className="section-header">
              <div>
                <h2>Notifications</h2>
                <p>Track system alerts and act on unread finance updates quickly.</p>
              </div>
              <button type="button" className="view-all" onClick={markAllNotificationsAsRead}>Mark all as read</button>
            </div>

            {notice && <p className="accountant-notice">{notice}</p>}

            <div className="parent-results-summary accountant-kpi-cards">
              <div><span>Total</span><strong>{notifications.length}</strong></div>
              <div><span>Unread</span><strong>{unreadNotificationCount}</strong></div>
              <div><span>Read</span><strong>{notifications.length - unreadNotificationCount}</strong></div>
            </div>

            <div className="parent-results-controls accountant-filter-grid">
              <label>
                Search
                <input value={notificationSearch} onChange={(event) => setNotificationSearch(event.target.value)} placeholder="Title or date" />
              </label>
              <label>
                Status
                <select value={notificationStatusFilter} onChange={(event) => setNotificationStatusFilter(event.target.value)}>
                  <option>All</option>
                  <option>Unread</option>
                  <option>Read</option>
                </select>
              </label>
              <button type="button" className="row-action" onClick={resetNotificationFilters}>Reset Filters</button>
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
                <li className="attendance-empty">No notification matches your selected filters.</li>
              )}
            </ul>
          </section>
        );

      case 'profile':
        return (
          <div className="accountant-profile-layout">
            <section className="analytics-card parent-panel accountant-panel accountant-profile-tab">
              <div className="section-header">
                <div>
                  <h2>Profile</h2>
                  <p>Update account identity and credentials used for finance operations.</p>
                </div>
              </div>
              {notice && <p className="accountant-notice">{notice}</p>}
              <EditProfile profile={profileForEdit} onSaveProfile={onSaveProfile} />
            </section>
            <section className="analytics-card parent-panel accountant-panel accountant-profile-side accountant-profile-tab">
              <div className="section-header"><h2>Account Summary</h2></div>
              <div className="accountant-highlight-card">
                <strong>{profileForEdit.name}</strong>
                <p>{profileForEdit.matricule} • Finance Office</p>
              </div>
              <div className="parent-mini-list accountant-mini-list">
                <li><strong>Students managed</strong><span>{students.length}</span></li>
                <li><strong>Unpaid invoices</strong><span>{invoiceSummary.unpaid}</span></li>
                <li><strong>Unread notifications</strong><span>{unreadNotificationCount}</span></li>
              </div>
            </section>
          </div>
        );

      case 'settings':
        return (
          <section className="analytics-card parent-panel accountant-panel accountant-settings-tab">
            <div className="section-header">
              <div>
                <h2>Settings</h2>
                <p>Configure notifications, invoice behavior, and reporting preferences.</p>
              </div>
            </div>

            {notice && <p className="accountant-notice">{notice}</p>}

            <div className="parent-results-summary accountant-kpi-cards">
              <div><span>Invoice Prefix</span><strong>{settingsDraft.invoicePrefix}</strong></div>
              <div><span>Late Fee</span><strong>{settingsDraft.lateFeePercent}%</strong></div>
              <div><span>Last Saved</span><strong>{settingsLastSavedAt}</strong></div>
            </div>

            <form className="parent-settings-form accountant-settings-form" onSubmit={saveSettings}>
              <div className="accountant-settings-grid">
                <article className="accountant-settings-box">
                  <h3>Notifications & Automation</h3>
                  <label>
                    <input type="checkbox" checked={settingsDraft.emailNotifications} onChange={(event) => setSettingsDraft((prev) => ({ ...prev, emailNotifications: event.target.checked }))} />
                    Email notifications
                  </label>
                  <label>
                    <input type="checkbox" checked={settingsDraft.smsNotifications} onChange={(event) => setSettingsDraft((prev) => ({ ...prev, smsNotifications: event.target.checked }))} />
                    SMS notifications
                  </label>
                  <label>
                    <input type="checkbox" checked={settingsDraft.autoInvoiceGeneration} onChange={(event) => setSettingsDraft((prev) => ({ ...prev, autoInvoiceGeneration: event.target.checked }))} />
                    Auto invoice generation
                  </label>
                </article>

                <article className="accountant-settings-box">
                  <h3>Invoicing Preferences</h3>
                  <label className="select-label">
                    Invoice Prefix
                    <input value={settingsDraft.invoicePrefix} onChange={(event) => setSettingsDraft((prev) => ({ ...prev, invoicePrefix: event.target.value }))} />
                  </label>
                  <label className="select-label">
                    Late Fee Percentage
                    <input type="number" min="0" max="50" value={settingsDraft.lateFeePercent} onChange={(event) => setSettingsDraft((prev) => ({ ...prev, lateFeePercent: event.target.value }))} />
                  </label>
                  <label className="select-label">
                    Timezone
                    <select value={settingsDraft.timezone} onChange={(event) => setSettingsDraft((prev) => ({ ...prev, timezone: event.target.value }))}>
                      <option>Africa/Douala</option>
                      <option>Africa/Lagos</option>
                      <option>Europe/Paris</option>
                    </select>
                  </label>
                  <label className="select-label">
                    Report Cycle
                    <select value={settingsDraft.reportCycle} onChange={(event) => setSettingsDraft((prev) => ({ ...prev, reportCycle: event.target.value }))}>
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </label>
                </article>
              </div>

              <div className={`accountant-settings-status ${hasUnsavedSettings ? 'pending' : 'synced'}`}>
                {hasUnsavedSettings ? 'Unsaved changes detected' : `Settings synced • ${settingsLastSavedAt}`}
              </div>

              <div className="parent-attendance-actions">
                <button type="submit">Save Settings</button>
                <button type="button" className="row-action" onClick={revertSettings}>Revert</button>
                <button type="button" className="row-action" onClick={loadDefaultSettings}>Load Defaults</button>
              </div>
            </form>
          </section>
        );

      default:
        return (
          <>
            <section className="welcome">
              <div className="welcome-text">
                <h1>Welcome, {profileForEdit.name}!</h1>
                <p>Accountant Portal • Finance operations, invoicing, and reporting center</p>
              </div>
              <img className="welcome-avatar" src={profileForEdit.avatar} alt={profileForEdit.name} />
            </section>

            <section className="stats-cards">
              <div className="card" onClick={() => setActiveView('students')}>
                <div className="card-icon"><FaUsers /></div>
                <div><h3>{students.length} Students</h3><p>Managed Accounts</p></div>
              </div>
              <div className="card" onClick={() => setActiveView('invoices')}>
                <div className="card-icon"><FaFileInvoiceDollar /></div>
                <div><h3>{invoiceSummary.unpaid} Unpaid</h3><p>Invoice Queue</p></div>
              </div>
              <div className="card" onClick={() => setActiveView('financial-reports')}>
                <div className="card-icon"><FaChartLine /></div>
                <div><h3>{reportCollectionRate}% Collected</h3><p>Collection Efficiency</p></div>
              </div>
              <div className="card" onClick={() => setActiveView('notifications')}>
                <div className="card-icon"><FaBell /></div>
                <div><h3>{unreadNotificationCount} Alerts</h3><p>Unread Notifications</p></div>
              </div>
            </section>

            <section className="analytics-section">
              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="section-header"><h2>Top Outstanding Students</h2></div>
                  <div className="chart-list">
                    {students
                      .map((item) => ({ ...item, balance: item.totalBilled - item.totalPaid }))
                      .sort((left, right) => right.balance - left.balance)
                      .slice(0, 5)
                      .map((item) => (
                        <div key={item.id} className="chart-row">
                          <div className="chart-row-top"><span>{item.name}</span><strong>{item.balance.toLocaleString()} FCFA</strong></div>
                          <div className="chart-track"><div className="chart-fill" style={{ width: `${Math.min(100, (item.balance / 180000) * 100)}%` }} /></div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="section-header"><h2>Recent Payments</h2></div>
                  <ul className="parent-mini-list">
                    {paymentHistory.slice(0, 4).map((item) => (
                      <li key={item.id}>
                        <strong>{item.studentName}</strong>
                        <span>{item.amount.toLocaleString()} FCFA • {item.date}</span>
                      </li>
                    ))}
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
    students: 'Students',
    'fees-structure': 'Fees Structure',
    invoices: 'Invoices',
    'financial-reports': 'Financial Reports',
    announcements: 'Announcements',
    messages: 'Messages',
    notifications: 'Notifications',
    profile: 'Profile',
    settings: 'Settings'
  };

  const showRightColumn = activeView === 'dashboard';

  return (
    <div className="dashboard-container">
      <AccountantSidebar active={activeView} onSelect={handleSidebarSelect} onClose={() => setSidebarOpen(false)} open={sidebarOpen} />
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
        <div className="left-content">{renderMain()}</div>

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
                    <div className="announcement-top"><strong>{item.title}</strong><span>{item.date}</span></div>
                    <p>{item.message}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="quick-links">
              <div className="section-header"><h2>Quick Links</h2></div>
              <ul>
                <li onClick={() => setActiveView('students')}>Open Students</li>
                <li onClick={() => setActiveView('fees-structure')}>Manage Fee Structure</li>
                <li onClick={() => setActiveView('invoices')}>Generate Invoices</li>
                <li onClick={() => setActiveView('financial-reports')}>Open Financial Reports</li>
              </ul>
            </section>

            <section className="recent-messages">
              <div className="section-header"><h2>Alerts</h2></div>
              <div className="message-item">
                <div className="message-text">
                  <strong><FaBell /> {unreadNotificationCount} unread</strong>
                  <p>Open Notifications tab to review all latest alerts.</p>
                </div>
              </div>
            </section>
          </aside>
        )}
      </main>

      <footer className="dashboard-footer">
        <a href="https://www.youtube.com/results?search_query=how+to+use+accountant+dashboard" target="_blank" rel="noreferrer">
          Learn how to use your accountant dashboard
        </a>
        <button
          type="button"
          onClick={() => window.open('mailto:support@eduignite.edu?subject=Accountant%20Dashboard%20Support', '_blank')}
        >
          Support
        </button>
      </footer>
    </div>
  );
};

export default AccountantDashboard;
