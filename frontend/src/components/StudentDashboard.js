import React, { useEffect, useMemo, useState } from 'react';
import {
  FaBookOpen,
  FaTasks,
  FaBell,
  FaChartLine,
  FaExclamationTriangle,
  FaHistory,
  FaUpload,
  FaClipboardCheck,
  FaClock,
  FaCheckCircle,
  FaVideo,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideoSlash,
  FaHandPaper,
  FaPaperPlane,
  FaChalkboardTeacher,
  FaCalendarCheck,
  FaExpand,
  FaCompress
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import Header from './Header';
import StudentSidebar from './StudentSidebar';
import Announcements from './Announcements';
import Library from './Library';
import Messages from './Messages';
import EditProfile from './EditProfile';
import './StudentDashboard.css';
import './Materials.css';

const buildAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f6feb&color=fff&bold=true`;
const formatAcronym = (format) => (format || '').toUpperCase().slice(0, 4);

const getAcceptedFiles = (format) => {
  if (format === 'PDF') return '.pdf,application/pdf';
  if (format === 'MS Word') {
    return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (format === 'Image') return 'image/*';
  return '';
};

const StudentDashboard = ({ profile, onSaveProfile = () => {}, onLogout = () => {} }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [assignmentNotice, setAssignmentNotice] = useState('');
  const [studentAssignments, setStudentAssignments] = useState([
    {
      id: 1,
      className: 'Grade 5 Math',
      teacher: 'Mr. John Smith',
      title: 'Algebra Practice Set 1',
      instructions: 'Solve questions 1-20 and show all steps clearly.',
      dueDate: '2026-03-12',
      formats: ['Typed', 'PDF', 'MS Word', 'Image'],
      createdAt: '2026-03-05',
      submittedAt: '',
      submittedFormat: '',
      submissionText: '',
      submissionFileName: '',
      submissionImagePreview: '',
      score: '',
      feedback: ''
    },
    {
      id: 2,
      className: 'Grade 6 English',
      teacher: 'Mr. Peter B.',
      title: 'Essay: My Community',
      instructions: 'Write 500 words about your community and include real examples.',
      dueDate: '2026-03-15',
      formats: ['Typed', 'MS Word'],
      createdAt: '2026-03-05',
      submittedAt: '2026-03-10T08:03:00',
      submittedFormat: 'Typed',
      submissionText: 'Essay submitted through the platform.',
      submissionFileName: '',
      submissionImagePreview: '',
      score: '16',
      feedback: 'Strong structure. Improve paragraph transitions.'
    },
    {
      id: 3,
      className: 'Grade 5 Science',
      teacher: 'Mrs. Grace N.',
      title: 'Chemistry Worksheet',
      instructions: 'Complete sections A and B and upload your workings.',
      dueDate: '2026-03-09',
      formats: ['PDF', 'Image'],
      createdAt: '2026-03-03',
      submittedAt: '2026-03-10T09:21:00',
      submittedFormat: 'Image',
      submissionText: '',
      submissionFileName: 'chemistry_work.jpg',
      submissionImagePreview: 'https://via.placeholder.com/140x90.png?text=Chemistry+Work',
      score: '',
      feedback: ''
    }
  ]);
  const [selectedStudentAssignmentId, setSelectedStudentAssignmentId] = useState(1);
  const [submissionFormat, setSubmissionFormat] = useState('Typed');
  const [typedSubmission, setTypedSubmission] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionFilePreview, setSubmissionFilePreview] = useState('');
  const [onlineClassFilter, setOnlineClassFilter] = useState('all');
  const [selectedOnlineClassId, setSelectedOnlineClassId] = useState(1);
  const [joinedOnlineClassId, setJoinedOnlineClassId] = useState(null);
  const [onlineClassNotice, setOnlineClassNotice] = useState('');
  const [studentMicOn, setStudentMicOn] = useState(false);
  const [studentCameraOn, setStudentCameraOn] = useState(false);
  const [studentHandRaised, setStudentHandRaised] = useState(false);
  const [studentOnlineMessage, setStudentOnlineMessage] = useState('');
  const [studentOnlineNoteDraft, setStudentOnlineNoteDraft] = useState('');
  const [studentOnlineNotes, setStudentOnlineNotes] = useState({});
  const [isOnlineMeetingEnlarged, setIsOnlineMeetingEnlarged] = useState(false);
  const [studentOnlineChat, setStudentOnlineChat] = useState([
    { id: 1, sender: 'Mr. John Smith', message: 'Welcome to class. Please open your notes.' },
    { id: 2, sender: 'Class Moderator', message: 'Attendance will be auto-marked when you join.' }
  ]);
  const [studentOnlineClasses, setStudentOnlineClasses] = useState([
    {
      id: 1,
      className: 'Grade 5 Math',
      topic: 'Linear Equations Live Revision',
      teacher: 'Mr. John Smith',
      date: '2026-03-06',
      time: '10:00',
      duration: 60,
      meetingCode: 'G5M-LIVE-01',
      status: 'live',
      attendanceMarked: false,
      description: 'Revision and Q&A before the sequence test.',
      resources: ['Slides: Linear Equations', 'Worksheet PDF', 'Class Recording (after class)']
    },
    {
      id: 2,
      className: 'Grade 6 English',
      topic: 'Essay Structure Workshop',
      teacher: 'Mr. Peter B.',
      date: '2026-03-07',
      time: '14:00',
      duration: 45,
      meetingCode: 'G6E-WRITE-02',
      status: 'cancelled',
      attendanceMarked: false,
      description: 'Cancelled by teacher due to staff briefing. New date will be announced.',
      resources: ['Essay Rubric', 'Model Essay', 'Grammar Checklist']
    },
    {
      id: 3,
      className: 'Grade 5 Science',
      topic: 'Cell Structure Recap',
      teacher: 'Mrs. Grace N.',
      date: '2026-03-04',
      time: '08:30',
      duration: 40,
      meetingCode: 'G5S-CELL-03',
      status: 'completed',
      attendanceMarked: true,
      description: 'Microscope observations and diagram labeling.',
      resources: ['Lesson Notes', 'Diagram Practice', 'Mini Quiz']
    }
  ]);
  const [onlineExamFilter, setOnlineExamFilter] = useState('all');
  const [selectedOnlineExamId, setSelectedOnlineExamId] = useState(1);
  const [onlineExamNotice, setOnlineExamNotice] = useState('');
  const [demoExamAnswers, setDemoExamAnswers] = useState({});
  const [demoExamResult, setDemoExamResult] = useState(null);
  const [showDemoResultPage, setShowDemoResultPage] = useState(false);
  const [demoQuestionIndex, setDemoQuestionIndex] = useState(0);
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');
  const [materialsClassFilter, setMaterialsClassFilter] = useState('All Classes');
  const [materialsFilter, setMaterialsFilter] = useState('All Subjects');
  const [materialsTypeFilter, setMaterialsTypeFilter] = useState('All Types');
  const [materialsSearch, setMaterialsSearch] = useState('');
  const [materialsNotice, setMaterialsNotice] = useState('');
  const [financeNotice, setFinanceNotice] = useState('');
  const [financeStatusFilter, setFinanceStatusFilter] = useState('all');
  const [financeSearch, setFinanceSearch] = useState('');
  const [selectedStudentAnnouncementId, setSelectedStudentAnnouncementId] = useState(null);
  const [selectedResultYear, setSelectedResultYear] = useState('All Years');
  const [selectedResultTerm, setSelectedResultTerm] = useState('All Terms');
  const [selectedResultSequence, setSelectedResultSequence] = useState('All Sequences');
  const [resultsSubjectSearch, setResultsSubjectSearch] = useState('');
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportPaymentMethod, setSupportPaymentMethod] = useState('Orange Money');
  const [supportAmount, setSupportAmount] = useState('');
  const [supporterNumber, setSupporterNumber] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const onlineExams = useMemo(() => [
    {
      id: 1,
      title: 'History Quiz - Colonial Era',
      className: 'Grade 5',
      subject: 'History',
      teacher: 'Mr. Martin E.',
      openDate: '2026-03-06',
      duration: 35,
      questions: 25,
      status: 'open',
      attempts: 1,
      maxAttempts: 2,
      bestScore: 14,
      instructions: 'Answer all objective questions and submit before the timer ends.',
      demo: false
    },
    {
      id: 2,
      title: 'Chemistry Mock Test',
      className: 'Grade 5',
      subject: 'Chemistry',
      teacher: 'Mrs. Linda K.',
      openDate: '2026-03-08',
      duration: 75,
      questions: 50,
      status: 'upcoming',
      attempts: 0,
      maxAttempts: 1,
      bestScore: null,
      instructions: 'Read each question carefully. Calculators are allowed for section B.',
      demo: false
    },
    {
      id: 3,
      title: 'English Grammar Challenge',
      className: 'Grade 6',
      subject: 'English',
      teacher: 'Mr. Peter B.',
      openDate: '2026-03-01',
      duration: 30,
      questions: 20,
      status: 'completed',
      attempts: 1,
      maxAttempts: 1,
      bestScore: 17,
      instructions: 'Complete all grammar correction questions and submit once.',
      demo: false
    },
    {
      id: 4,
      title: 'Demo UI Exam - Mathematics Practice',
      className: 'Grade 5',
      subject: 'Mathematics',
      teacher: 'Mr. John Smith',
      openDate: '2026-03-05',
      duration: 20,
      questions: 12,
      status: 'open',
      attempts: 0,
      maxAttempts: 3,
      bestScore: null,
      instructions: 'This is a demo exam to preview the UI. Attempt it to test the exam workflow.',
      previewQuestions: [
        {
          id: 1,
          question: 'What is 8 + 7?',
          options: ['13', '14', '15', '16'],
          answer: '15'
        },
        {
          id: 2,
          question: 'Solve for x: 2x = 18',
          options: ['6', '7', '8', '9'],
          answer: '9'
        },
        {
          id: 3,
          question: 'Which fraction is equivalent to 1/2?',
          options: ['2/3', '3/6', '4/5', '5/8'],
          answer: '3/6'
        }
      ],
      demo: true
    }
  ], []);

  const timetableByDay = useMemo(() => ([
    { day: 'Monday', sessions: ['08:00 Mathematics', '10:00 Physics', '13:30 ICT'] },
    { day: 'Tuesday', sessions: ['08:00 English', '09:45 Biology', '13:00 Literature'] },
    { day: 'Wednesday', sessions: ['08:00 Chemistry', '10:00 History', '14:00 Sports'] },
    { day: 'Thursday', sessions: ['08:00 Mathematics', '10:00 Civic Education', '13:30 Practical Science'] },
    { day: 'Friday', sessions: ['08:00 English', '09:45 Physics Lab', '12:30 Club Activities'] }
  ]), []);

  const attendanceBySubject = useMemo(() => ([
    { subject: 'Mathematics', present: 22, absent: 1, late: 0 },
    { subject: 'Physics', present: 20, absent: 2, late: 1 },
    { subject: 'English', present: 21, absent: 1, late: 1 },
    { subject: 'Biology', present: 19, absent: 3, late: 1 }
  ]), []);

  const attendanceRecords = useMemo(() => ([
    {
      id: 1,
      date: '2026-03-03',
      subject: 'Mathematics',
      teacher: 'Mr. John Smith',
      time: '08:00 - 08:50',
      status: 'present',
      remark: 'On time and participated actively.'
    },
    {
      id: 2,
      date: '2026-03-04',
      subject: 'Physics',
      teacher: 'Mrs. Grace N.',
      time: '10:00 - 10:50',
      status: 'late',
      remark: 'Joined class 10 minutes late.'
    },
    {
      id: 3,
      date: '2026-03-05',
      subject: 'English',
      teacher: 'Mr. Peter B.',
      time: '08:00 - 08:50',
      status: 'present',
      remark: 'Attended and submitted in-class exercise.'
    },
    {
      id: 4,
      date: '2026-03-06',
      subject: 'Biology',
      teacher: 'Mrs. Stella A.',
      time: '09:45 - 10:35',
      status: 'absent',
      remark: 'Absent. Parent note pending.'
    },
    {
      id: 5,
      date: '2026-03-07',
      subject: 'Chemistry',
      teacher: 'Mrs. Linda K.',
      time: '11:00 - 11:50',
      status: 'present',
      remark: 'Good participation in practical session.'
    }
  ]), []);

  const resultRecords = useMemo(() => ([
    { id: 1, academicYear: '2023/2024', term: 'Term 1', sequence: 'Sequence 1', subject: 'Mathematics', mark: 12, coeff: 5, teacher: 'Mr. John Smith', examType: 'Sequence Test', publishedAt: '2023-10-05' },
    { id: 2, academicYear: '2023/2024', term: 'Term 1', sequence: 'Sequence 1', subject: 'English', mark: 14, coeff: 3, teacher: 'Mr. Peter B.', examType: 'Sequence Test', publishedAt: '2023-10-06' },
    { id: 3, academicYear: '2023/2024', term: 'Term 1', sequence: 'Sequence 1', subject: 'Physics', mark: 11, coeff: 4, teacher: 'Mrs. Grace N.', examType: 'Sequence Test', publishedAt: '2023-10-06' },
    { id: 4, academicYear: '2023/2024', term: 'Term 1', sequence: 'Sequence 2', subject: 'Mathematics', mark: 13, coeff: 5, teacher: 'Mr. John Smith', examType: 'Continuous Assessment', publishedAt: '2023-11-15' },
    { id: 5, academicYear: '2023/2024', term: 'Term 1', sequence: 'Sequence 2', subject: 'English', mark: 15, coeff: 3, teacher: 'Mr. Peter B.', examType: 'Continuous Assessment', publishedAt: '2023-11-16' },
    { id: 6, academicYear: '2023/2024', term: 'Term 1', sequence: 'Sequence 2', subject: 'Biology', mark: 12, coeff: 4, teacher: 'Mrs. Stella A.', examType: 'Continuous Assessment', publishedAt: '2023-11-16' },

    { id: 7, academicYear: '2024/2025', term: 'Term 2', sequence: 'Sequence 1', subject: 'Mathematics', mark: 14, coeff: 5, teacher: 'Mr. John Smith', examType: 'Sequence Test', publishedAt: '2025-02-08' },
    { id: 8, academicYear: '2024/2025', term: 'Term 2', sequence: 'Sequence 1', subject: 'Chemistry', mark: 12, coeff: 4, teacher: 'Mrs. Linda K.', examType: 'Sequence Test', publishedAt: '2025-02-08' },
    { id: 9, academicYear: '2024/2025', term: 'Term 2', sequence: 'Sequence 1', subject: 'History', mark: 13, coeff: 2, teacher: 'Mr. Martin E.', examType: 'Sequence Test', publishedAt: '2025-02-09' },
    { id: 10, academicYear: '2024/2025', term: 'Term 2', sequence: 'Sequence 2', subject: 'Mathematics', mark: 15, coeff: 5, teacher: 'Mr. John Smith', examType: 'Mid-Term Exam', publishedAt: '2025-03-19' },
    { id: 11, academicYear: '2024/2025', term: 'Term 2', sequence: 'Sequence 2', subject: 'Chemistry', mark: 13, coeff: 4, teacher: 'Mrs. Linda K.', examType: 'Mid-Term Exam', publishedAt: '2025-03-19' },
    { id: 12, academicYear: '2024/2025', term: 'Term 2', sequence: 'Sequence 2', subject: 'English', mark: 15, coeff: 3, teacher: 'Mr. Peter B.', examType: 'Mid-Term Exam', publishedAt: '2025-03-20' },

    { id: 13, academicYear: '2025/2026', term: 'Term 1', sequence: 'Sequence 1', subject: 'Mathematics', mark: 15, coeff: 5, teacher: 'Mr. John Smith', examType: 'Sequence Test', publishedAt: '2025-10-10' },
    { id: 14, academicYear: '2025/2026', term: 'Term 1', sequence: 'Sequence 1', subject: 'Physics', mark: 14, coeff: 4, teacher: 'Mrs. Grace N.', examType: 'Sequence Test', publishedAt: '2025-10-11' },
    { id: 15, academicYear: '2025/2026', term: 'Term 1', sequence: 'Sequence 1', subject: 'English', mark: 16, coeff: 3, teacher: 'Mr. Peter B.', examType: 'Sequence Test', publishedAt: '2025-10-11' },
    { id: 16, academicYear: '2025/2026', term: 'Term 2', sequence: 'Sequence 1', subject: 'Mathematics', mark: 16, coeff: 5, teacher: 'Mr. John Smith', examType: 'Sequence Test', publishedAt: '2026-02-12' },
    { id: 17, academicYear: '2025/2026', term: 'Term 2', sequence: 'Sequence 1', subject: 'Chemistry', mark: 11, coeff: 4, teacher: 'Mrs. Linda K.', examType: 'Sequence Test', publishedAt: '2026-02-12' },
    { id: 18, academicYear: '2025/2026', term: 'Term 2', sequence: 'Sequence 1', subject: 'History', mark: 13, coeff: 2, teacher: 'Mr. Martin E.', examType: 'Sequence Test', publishedAt: '2026-02-13' }
  ]), []);

  const financeRecords = useMemo(() => ([
    { id: 1, type: 'Tuition Fee', expected: 200000, paid: 180000, dueDate: '2026-03-20', status: 'Partial' },
    { id: 2, type: 'PTA Contribution', expected: 15000, paid: 15000, dueDate: '2026-02-28', status: 'Paid' },
    { id: 3, type: 'Exam Registration', expected: 10000, paid: 10000, dueDate: '2026-03-02', status: 'Paid' }
  ]), []);

  const onlineMaterials = useMemo(() => ([
    {
      id: 1,
      title: 'Linear Equations Revision Pack',
      className: 'Grade 5 Math',
      subject: 'Mathematics',
      type: 'Notes',
      format: 'PDF',
      size: '2.4 MB',
      updatedAt: '2026-03-04',
      published: true,
      uploadedBy: { name: 'Mr. John Smith', role: 'Teacher', avatar: 'https://via.placeholder.com/40' },
      fileName: 'linear_equations_revision_pack.pdf'
    },
    {
      id: 2,
      title: 'Physics Practical Demonstration',
      className: 'Grade 5 Science',
      subject: 'Physics',
      type: 'Slides',
      format: 'PPT',
      size: '4.8 MB',
      updatedAt: '2026-03-02',
      published: true,
      uploadedBy: { name: 'Mrs. Grace N.', role: 'Teacher', avatar: 'https://via.placeholder.com/40' },
      fileName: 'physics_practical_demonstration.ppt'
    },
    {
      id: 3,
      title: 'English Essay Template',
      className: 'Grade 6 English',
      subject: 'English',
      type: 'Guide',
      format: 'DOCX',
      size: '0.4 MB',
      updatedAt: '2026-03-01',
      published: true,
      uploadedBy: { name: 'Mr. Peter B.', role: 'Teacher', avatar: 'https://via.placeholder.com/40' },
      fileName: 'english_essay_template.docx'
    },
    {
      id: 4,
      title: 'Cell Structure Diagram Sheet',
      className: 'Grade 5 Science',
      subject: 'Biology',
      type: 'Worksheet',
      format: 'PDF',
      size: '1.2 MB',
      updatedAt: '2026-02-28',
      published: true,
      uploadedBy: { name: 'Mrs. Stella A.', role: 'Teacher', avatar: 'https://via.placeholder.com/40' },
      fileName: 'cell_structure_diagram_sheet.pdf'
    }
  ]), []);

  const announcements = useMemo(() => [
    { id: 1, title: 'Mid-Term Exams Start Next Week', date: '2026-03-12' },
    { id: 2, title: 'Physics Practical Moved to Friday', date: '2026-03-08' },
    { id: 3, title: 'Library: New Biology Resources Added', date: '2026-03-06' }
  ], []);

  const subjectPerformance = useMemo(() => [
    {
      subject: 'Mathematics',
      score: 15.2,
      teacher: 'Mr. John Smith',
      progress: '+1.1 this sequence',
      completionRate: 91,
      resources: ['Video Lessons (14)', 'Revision Notes (22)', 'Past Questions (9)'],
      recommendation: 'Practice algebra word problems 20 mins daily.'
    },
    {
      subject: 'Physics',
      score: 14.4,
      teacher: 'Mrs. Grace N.',
      progress: '+0.6 this sequence',
      completionRate: 86,
      resources: ['Lab Simulations (7)', 'Class Slides (16)', 'Quiz Bank (12)'],
      recommendation: 'Revise practical formulas before Friday lab.'
    },
    {
      subject: 'English',
      score: 13.9,
      teacher: 'Mr. Peter B.',
      progress: '+0.2 this sequence',
      completionRate: 88,
      resources: ['Reading Packs (11)', 'Grammar Exercises (19)', 'Essay Samples (8)'],
      recommendation: 'Focus on thesis statements in essay writing.'
    },
    {
      subject: 'Chemistry',
      score: 9.6,
      teacher: 'Mrs. Linda K.',
      progress: '-0.8 this sequence',
      completionRate: 62,
      resources: ['Reaction Videos (9)', 'Formula Sheets (10)', 'Practice MCQ (15)'],
      recommendation: 'Prioritize balancing equations and valency drills.'
    },
    {
      subject: 'History',
      score: 10.2,
      teacher: 'Mr. Martin E.',
      progress: '+0.1 this sequence',
      completionRate: 73,
      resources: ['Topic Summaries (13)', 'Timeline Cards (6)', 'Source Analysis (5)'],
      recommendation: 'Create date timelines for key events.'
    },
    {
      subject: 'Biology',
      score: 8.7,
      teacher: 'Mrs. Stella A.',
      progress: '-1.0 this sequence',
      completionRate: 58,
      resources: ['Diagrams Library (21)', 'Practical Guides (7)', 'Flashcards (18)'],
      recommendation: 'Revise labeled diagrams and functions daily.'
    }
  ], []);

  const sequenceTrend = useMemo(() => [
    { label: 'T1-S1', value: 12.1 },
    { label: 'T1-S2', value: 13.3 },
    { label: 'T2-S1', value: 14.1 },
    { label: 'T2-S2', value: 14.8 }
  ], []);

  const recentActivities = useMemo(() => [
    { id: 1, title: 'Submitted Chemistry Worksheet', time: 'Today • 08:45 AM' },
    { id: 2, title: 'Joined Mathematics Online Class', time: 'Yesterday • 10:05 AM' },
    { id: 3, title: 'Scored 16/20 in English Quiz', time: 'Yesterday • 04:20 PM' },
    { id: 4, title: 'Borrowed Physics Revision Book', time: '2 days ago • 01:10 PM' }
  ], []);

  const weakSubjects = subjectPerformance.filter((item) => item.score < 10);
  const averageScore =
    subjectPerformance.reduce((sum, item) => sum + item.score, 0) / subjectPerformance.length;
  const attendanceRate = 94;
  const repeatProbability = Math.max(
    5,
    Math.min(95, Math.round(48 - averageScore * 2 - attendanceRate * 0.12 + weakSubjects.length * 9))
  );
  const repeatRiskLabel = repeatProbability >= 40 ? 'High Risk' : repeatProbability >= 25 ? 'Medium Risk' : 'Low Risk';

  const onlineClassSummary = useMemo(() => {
    const live = studentOnlineClasses.filter((item) => item.status === 'live').length;
    const scheduled = studentOnlineClasses.filter((item) => item.status === 'scheduled').length;
    const completed = studentOnlineClasses.filter((item) => item.status === 'completed').length;
    const cancelled = studentOnlineClasses.filter((item) => item.status === 'cancelled').length;
    const attended = studentOnlineClasses.filter((item) => item.attendanceMarked).length;

    return {
      live,
      scheduled,
      completed,
      cancelled,
      attended,
      total: studentOnlineClasses.length
    };
  }, [studentOnlineClasses]);

  const filteredOnlineClasses = studentOnlineClasses.filter((item) => (
    onlineClassFilter === 'all' ? true : item.status === onlineClassFilter
  ));

  const selectedOnlineClass =
    studentOnlineClasses.find((item) => item.id === selectedOnlineClassId) || studentOnlineClasses[0];

  const joinedOnlineClass =
    studentOnlineClasses.find((item) => item.id === joinedOnlineClassId) || null;

  const joinOnlineClass = (classItem) => {
    if (classItem.status === 'cancelled') {
      setOnlineClassNotice('This class has been cancelled and cannot be joined.');
      return;
    }

    if (classItem.status === 'completed') {
      setOnlineClassNotice('This class is already completed.');
      return;
    }

    setJoinedOnlineClassId(classItem.id);
    setIsOnlineMeetingEnlarged(classItem.status === 'live');
    setStudentMicOn(false);
    setStudentCameraOn(false);
    setStudentHandRaised(false);
    setStudentOnlineMessage('');
    setStudentOnlineNoteDraft(studentOnlineNotes[classItem.id] || '');
    setOnlineClassNotice('You joined the online class successfully.');

    setStudentOnlineClasses((prev) => prev.map((item) => (
      item.id === classItem.id ? { ...item, attendanceMarked: true } : item
    )));
  };

  const leaveOnlineClass = () => {
    setJoinedOnlineClassId(null);
    setIsOnlineMeetingEnlarged(false);
    setStudentHandRaised(false);
    setOnlineClassNotice('You left the class. Attendance remains recorded.');
  };

  useEffect(() => {
    document.body.style.overflow = isOnlineMeetingEnlarged ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOnlineMeetingEnlarged]);

  const saveOnlineClassNote = () => {
    if (!joinedOnlineClass) return;
    setStudentOnlineNotes((prev) => ({
      ...prev,
      [joinedOnlineClass.id]: studentOnlineNoteDraft.trim()
    }));
    setOnlineClassNotice('Class note saved.');
  };

  const sendOnlineClassMessage = () => {
    const cleanMessage = studentOnlineMessage.trim();
    if (!cleanMessage) return;

    setStudentOnlineChat((prev) => ([
      ...prev,
      { id: Date.now(), sender: profile?.name || 'Student', message: cleanMessage }
    ]));
    setStudentOnlineMessage('');
  };

  const setOnlineReminder = (classItem) => {
    setOnlineClassNotice(`Reminder set for ${classItem.topic} on ${classItem.date} at ${classItem.time}.`);
  };

  const getAssignmentStatus = (assignment) => {
    if (assignment.score) return 'graded';
    if (assignment.submittedAt) {
      const dueEnd = new Date(`${assignment.dueDate}T23:59:59`);
      const submitted = new Date(assignment.submittedAt);
      return submitted > dueEnd ? 'late-submitted' : 'submitted';
    }

    const dueEnd = new Date(`${assignment.dueDate}T23:59:59`);
    return new Date() > dueEnd ? 'late' : 'pending';
  };

  const selectedStudentAssignment =
    studentAssignments.find((item) => item.id === selectedStudentAssignmentId) || studentAssignments[0];

  const assignmentCounts = useMemo(
    () => ({
      pending: studentAssignments.filter((item) => getAssignmentStatus(item) === 'pending').length,
      submitted: studentAssignments.filter((item) => getAssignmentStatus(item) === 'submitted').length,
      graded: studentAssignments.filter((item) => getAssignmentStatus(item) === 'graded').length,
      late:
        studentAssignments.filter((item) => ['late', 'late-submitted'].includes(getAssignmentStatus(item))).length
    }),
    [studentAssignments]
  );

  const filteredAssignments = studentAssignments.filter((item) => {
    if (assignmentFilter === 'all') return true;
    if (assignmentFilter === 'late') return ['late', 'late-submitted'].includes(getAssignmentStatus(item));
    return getAssignmentStatus(item) === assignmentFilter;
  });

  useEffect(() => {
    if (!selectedStudentAssignment) return;

    if (!selectedStudentAssignment.formats.includes(submissionFormat)) {
      setSubmissionFormat(selectedStudentAssignment.formats[0]);
      setSubmissionFile(null);
      setSubmissionFilePreview('');
      setTypedSubmission('');
    }
  }, [selectedStudentAssignment, submissionFormat]);

  const handleSubmissionFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      setSubmissionFile(null);
      setSubmissionFilePreview('');
      return;
    }

    setSubmissionFile(file);
    if (submissionFormat === 'Image') {
      setSubmissionFilePreview(URL.createObjectURL(file));
      return;
    }

    setSubmissionFilePreview('');
  };

  const submitAssignment = () => {
    if (!selectedStudentAssignment) return;

    const cleanText = typedSubmission.trim();

    if (submissionFormat === 'Typed' && !cleanText) {
      setAssignmentNotice('Please enter your typed assignment before submitting.');
      return;
    }

    if (submissionFormat !== 'Typed' && !submissionFile) {
      setAssignmentNotice(`Please attach a ${submissionFormat} file before submitting.`);
      return;
    }

    setStudentAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === selectedStudentAssignment.id
          ? {
              ...assignment,
              submittedAt: new Date().toISOString(),
              submittedFormat: submissionFormat,
              submissionText: submissionFormat === 'Typed' ? cleanText : '',
              submissionFileName: submissionFormat === 'Typed' ? '' : submissionFile.name,
              submissionImagePreview: submissionFormat === 'Image' ? submissionFilePreview : '',
              score: '',
              feedback: assignment.feedback
            }
          : assignment
      )
    );

    setAssignmentNotice('Assignment submitted successfully.');
    setTypedSubmission('');
    setSubmissionFile(null);
    setSubmissionFilePreview('');
  };

  const clearSubmissionDraft = () => {
    setTypedSubmission('');
    setSubmissionFile(null);
    setSubmissionFilePreview('');
    setAssignmentNotice('Submission draft cleared.');
  };

  const withdrawSubmission = () => {
    if (!selectedStudentAssignment?.submittedAt) {
      setAssignmentNotice('There is no submitted assignment to withdraw.');
      return;
    }

    setStudentAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === selectedStudentAssignment.id
          ? {
              ...assignment,
              submittedAt: '',
              submittedFormat: '',
              submissionText: '',
              submissionFileName: '',
              submissionImagePreview: '',
              score: '',
              feedback: ''
            }
          : assignment
      )
    );

    setAssignmentNotice('Submission withdrawn. You can resubmit before the due date.');
  };

  const notificationItems = announcements.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    unread: !readNotificationIds.includes(item.id)
  }));

  const unreadNotificationCount = notificationItems.filter((item) => item.unread).length;

  const filteredOnlineExams = onlineExams.filter((exam) => (
    onlineExamFilter === 'all' ? true : exam.status === onlineExamFilter
  ));

  const selectedOnlineExam = onlineExams.find((exam) => exam.id === selectedOnlineExamId) || onlineExams[0];
  const selectedDemoAnswers = selectedOnlineExam ? (demoExamAnswers[selectedOnlineExam.id] || {}) : {};
  const demoQuestions = selectedOnlineExam?.previewQuestions || [];
  const activeDemoQuestion = demoQuestions[demoQuestionIndex] || null;

  const filteredAttendanceRecords = attendanceRecords.filter((record) => (
    attendanceStatusFilter === 'all' ? true : record.status === attendanceStatusFilter
  ));

  const attendanceSummary = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter((item) => item.status === 'present').length;
    const absent = attendanceRecords.filter((item) => item.status === 'absent').length;
    const late = attendanceRecords.filter((item) => item.status === 'late').length;
    const rate = total ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, late, rate };
  }, [attendanceRecords]);

  const onlineExamSummary = useMemo(() => ({
    total: onlineExams.length,
    open: onlineExams.filter((exam) => exam.status === 'open').length,
    upcoming: onlineExams.filter((exam) => exam.status === 'upcoming').length,
    completed: onlineExams.filter((exam) => exam.status === 'completed').length
  }), [onlineExams]);

  const resultYearOptions = useMemo(() => (
    ['All Years', ...Array.from(new Set(resultRecords.map((item) => item.academicYear))).sort((a, b) => b.localeCompare(a))]
  ), [resultRecords]);

  const resultTermOptions = useMemo(() => [
    'All Terms',
    'Term 1',
    'Term 2',
    'Term 3'
  ], []);

  const resultSequenceOptions = useMemo(() => [
    'All Sequences',
    'Sequence 1',
    'Sequence 2'
  ], []);

  useEffect(() => {
    if (!resultTermOptions.includes(selectedResultTerm)) {
      setSelectedResultTerm('All Terms');
    }
  }, [resultTermOptions, selectedResultTerm]);

  useEffect(() => {
    if (!resultSequenceOptions.includes(selectedResultSequence)) {
      setSelectedResultSequence('All Sequences');
    }
  }, [resultSequenceOptions, selectedResultSequence]);

  const filteredResultRecords = useMemo(() => resultRecords.filter((item) => (
    (selectedResultYear === 'All Years' || item.academicYear === selectedResultYear)
    && (selectedResultTerm === 'All Terms' || item.term === selectedResultTerm)
    && (selectedResultSequence === 'All Sequences' || item.sequence === selectedResultSequence)
    && item.subject.toLowerCase().includes(resultsSubjectSearch.toLowerCase())
  )), [resultRecords, selectedResultYear, selectedResultTerm, selectedResultSequence, resultsSubjectSearch]);

  const sortedFilteredResultRecords = useMemo(() => ([...filteredResultRecords].sort((a, b) => (
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ))), [filteredResultRecords]);

  const sortedAllResultRecords = useMemo(() => ([...resultRecords].sort((a, b) => (
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ))), [resultRecords]);

  const classRankByPeriod = useMemo(() => ({
    '2023/2024|Term 1|Sequence 1': '18 / 62',
    '2023/2024|Term 1|Sequence 2': '14 / 62',
    '2024/2025|Term 2|Sequence 1': '11 / 60',
    '2024/2025|Term 2|Sequence 2': '9 / 60',
    '2025/2026|Term 1|Sequence 1': '7 / 58',
    '2025/2026|Term 2|Sequence 1': '6 / 58'
  }), []);

  const getClassRankForRecord = (record) => {
    const key = `${record.academicYear}|${record.term}|${record.sequence}`;
    return classRankByPeriod[key] || 'N/A';
  };

  const filteredResultsTotalCoeff = filteredResultRecords.reduce((sum, row) => sum + row.coeff, 0);
  const filteredWeightedAverage = filteredResultsTotalCoeff
    ? filteredResultRecords.reduce((sum, row) => sum + row.mark * row.coeff, 0) / filteredResultsTotalCoeff
    : 0;

  const filteredPassCount = filteredResultRecords.filter((item) => item.mark >= 10).length;
  const filteredFailCount = filteredResultRecords.filter((item) => item.mark < 10).length;

  const selectedPeriodClassRank = useMemo(() => {
    if (
      selectedResultYear === 'All Years'
      || selectedResultTerm === 'All Terms'
      || selectedResultSequence === 'All Sequences'
    ) {
      return 'Select Year/Term/Sequence';
    }

    const key = `${selectedResultYear}|${selectedResultTerm}|${selectedResultSequence}`;
    return classRankByPeriod[key] || 'Not Published';
  }, [selectedResultYear, selectedResultTerm, selectedResultSequence, classRankByPeriod]);

  const cumulativeTotalCoeff = resultRecords.reduce((sum, row) => sum + row.coeff, 0);
  const cumulativeAverage = cumulativeTotalCoeff
    ? resultRecords.reduce((sum, row) => sum + row.mark * row.coeff, 0) / cumulativeTotalCoeff
    : 0;

  const bestResult = filteredResultRecords.length
    ? filteredResultRecords.reduce((best, item) => (item.mark > best.mark ? item : best), filteredResultRecords[0])
    : null;
  const lowestResult = filteredResultRecords.length
    ? filteredResultRecords.reduce((lowest, item) => (item.mark < lowest.mark ? item : lowest), filteredResultRecords[0])
    : null;

  const academicHistoryByYear = useMemo(() => resultYearOptions
    .filter((year) => year !== 'All Years')
    .map((year) => {
      const records = resultRecords.filter((item) => item.academicYear === year);
      const coeff = records.reduce((sum, row) => sum + row.coeff, 0);
      const average = coeff
        ? records.reduce((sum, row) => sum + row.mark * row.coeff, 0) / coeff
        : 0;
      return {
        year,
        average,
        total: records.length,
        best: records.reduce((best, row) => (row.mark > best.mark ? row : best), records[0])
      };
    }), [resultRecords, resultYearOptions]);

  const totalExpected = financeRecords.reduce((sum, row) => sum + row.expected, 0);
  const totalPaid = financeRecords.reduce((sum, row) => sum + row.paid, 0);
  const outstandingBalance = totalExpected - totalPaid;
  const paidCoverageRate = totalExpected ? Math.round((totalPaid / totalExpected) * 100) : 0;

  const filteredFinanceRecords = financeRecords.filter((row) => {
    const statusMatch = financeStatusFilter === 'all' ? true : row.status.toLowerCase() === financeStatusFilter;
    const searchMatch = `${row.type} ${row.status}`.toLowerCase().includes(financeSearch.toLowerCase());
    return statusMatch && searchMatch;
  });

  const financeSummary = useMemo(() => ({
    paid: financeRecords.filter((row) => row.status === 'Paid').length,
    partial: financeRecords.filter((row) => row.status === 'Partial').length,
    outstandingItems: financeRecords.filter((row) => row.paid < row.expected).length
  }), [financeRecords]);

  const dueSoonFinanceItems = useMemo(() => {
    const today = new Date();
    return financeRecords.filter((row) => {
      if (row.paid >= row.expected) return false;
      const dueDate = new Date(row.dueDate);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff <= 14;
    });
  }, [financeRecords]);

  const materialsClassOptions = useMemo(() => (
    ['All Classes', ...Array.from(new Set(onlineMaterials.map((item) => item.className)))]
  ), [onlineMaterials]);

  const materialsSubjectOptions = useMemo(() => (
    ['All Subjects', ...Array.from(new Set(onlineMaterials.map((item) => item.subject)))]
  ), [onlineMaterials]);

  const materialsTypeOptions = useMemo(() => (
    ['All Types', ...Array.from(new Set(onlineMaterials.map((item) => item.type)))]
  ), [onlineMaterials]);

  const filteredMaterials = onlineMaterials.filter((item) => {
    const matchesClass = materialsClassFilter === 'All Classes' ? true : item.className === materialsClassFilter;
    const matchesSubject = materialsFilter === 'All Subjects' ? true : item.subject === materialsFilter;
    const matchesType = materialsTypeFilter === 'All Types' ? true : item.type === materialsTypeFilter;
    const matchesSearch = `${item.title} ${item.subject} ${item.className} ${item.type} ${item.uploadedBy?.name || ''}`
      .toLowerCase()
      .includes(materialsSearch.toLowerCase());
    return matchesClass && matchesSubject && matchesType && matchesSearch;
  });

  const handleSidebarSelect = (viewKey) => {
    setActiveView(viewKey);
    setSidebarOpen(false);
  };

  const handleNotificationSelect = (notificationId) => {
    setReadNotificationIds((prev) => (prev.includes(notificationId) ? prev : [...prev, notificationId]));
    setSelectedStudentAnnouncementId(notificationId);
    setActiveView('announcements');
  };

  const markAllNotificationsAsRead = () => {
    setReadNotificationIds(announcements.map((item) => item.id));
  };

  const startOnlineExam = (exam) => {
    if (exam.status !== 'open') return;
    setMaterialsNotice('');
    setFinanceNotice('');
    setOnlineExamNotice(`Exam session opened: ${exam.title}. Good luck!`);
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

  const selectDemoAnswer = (questionId, option) => {
    if (!selectedOnlineExam) return;

    setDemoExamAnswers((prev) => ({
      ...prev,
      [selectedOnlineExam.id]: {
        ...(prev[selectedOnlineExam.id] || {}),
        [questionId]: option
      }
    }));
  };

  const submitDemoAnswers = () => {
    if (!selectedOnlineExam?.previewQuestions?.length) return;

    const currentAnswers = demoExamAnswers[selectedOnlineExam.id] || {};
    if (Object.keys(currentAnswers).length < selectedOnlineExam.previewQuestions.length) {
      setOnlineExamNotice('Please answer all demo questions before submitting.');
      return;
    }

    const score = selectedOnlineExam.previewQuestions.reduce((total, question) => (
      currentAnswers[question.id] === question.answer ? total + 1 : total
    ), 0);

    setDemoExamResult({ score, total: selectedOnlineExam.previewQuestions.length });
    setShowDemoResultPage(true);
    setOnlineExamNotice(`Demo submitted. You scored ${score}/${selectedOnlineExam.previewQuestions.length}.`);
  };

  const resetDemoAnswers = () => {
    if (!selectedOnlineExam) return;

    setDemoExamAnswers((prev) => {
      const updated = { ...prev };
      delete updated[selectedOnlineExam.id];
      return updated;
    });
    setDemoExamResult(null);
    setShowDemoResultPage(false);
    setDemoQuestionIndex(0);
    setOnlineExamNotice('Demo answers cleared.');
  };

  const getDemoResultComment = (result) => {
    if (!result || !result.total) return '';
    const percent = (result.score / result.total) * 100;

    if (percent >= 85) return 'Excellent performance. Keep this consistency in your full exams.';
    if (percent >= 65) return 'Good effort. Review one or two weak areas to improve further.';
    if (percent >= 40) return 'Fair attempt. Practice more questions and revise core concepts.';
    return 'Needs improvement. Please revise the topic and try the demo again.';
  };

  const downloadDemoCertificate = async () => {
    if (!selectedOnlineExam || !demoExamResult) return;

    const comment = getDemoResultComment(demoExamResult);
    const scorePercent = Math.round((demoExamResult.score / demoExamResult.total) * 100);
    const schoolName = 'School Management System 2026';
    const getLogoDataUrl = () => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(null);
          return;
        }
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => resolve(null);
      image.src = '/assets/image.png';
    });

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 34;

    pdf.setFillColor(245, 247, 251);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setDrawColor(23, 92, 211);
    pdf.setLineWidth(5);
    pdf.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 16, 16, 'S');

    const logoDataUrl = await getLogoDataUrl();
    if (logoDataUrl) {
      const logoSize = 58;
      pdf.addImage(logoDataUrl, 'PNG', (pageWidth - logoSize) / 2, 62, logoSize, logoSize);
    }

    pdf.setTextColor(15, 47, 118);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(30);
    pdf.text(schoolName, pageWidth / 2, 150, { align: 'center' });

    pdf.setTextColor(23, 92, 211);
    pdf.setFontSize(18);
    pdf.text('Exam Performance Certificate', pageWidth / 2, 177, { align: 'center' });

    pdf.setDrawColor(191, 212, 255);
    pdf.setLineWidth(1);
    pdf.line(100, 194, pageWidth - 100, 194);

    pdf.setTextColor(52, 64, 84);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(16);
    pdf.text('This certifies that', pageWidth / 2, 238, { align: 'center' });

    pdf.setTextColor(15, 47, 118);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(34);
    pdf.text(profile?.name || 'Student', pageWidth / 2, 276, { align: 'center' });

    pdf.setTextColor(52, 64, 84);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(15);
    pdf.text('has successfully completed', pageWidth / 2, 305, { align: 'center' });

    pdf.setTextColor(29, 41, 57);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.text(selectedOnlineExam.title, pageWidth / 2, 332, { align: 'center' });

    pdf.setTextColor(6, 118, 71);
    pdf.setFontSize(25);
    pdf.text(`Score: ${demoExamResult.score}/${demoExamResult.total} (${scorePercent}%)`, pageWidth / 2, 372, { align: 'center' });

    pdf.setFillColor(248, 250, 255);
    pdf.setDrawColor(219, 232, 255);
    pdf.roundedRect(120, 392, pageWidth - 240, 52, 8, 8, 'FD');
    pdf.setTextColor(52, 64, 84);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    pdf.text(comment, pageWidth / 2, 423, { align: 'center', maxWidth: pageWidth - 280 });

    pdf.setTextColor(102, 112, 133);
    pdf.setFontSize(12);
    pdf.text(`Issued on ${new Date().toLocaleDateString()} • ${schoolName}`, pageWidth / 2, pageHeight - 56, { align: 'center' });

    pdf.save(`exam-certificate-${selectedOnlineExam.id}.pdf`);
  };

  const goToPreviousDemoQuestion = () => {
    setDemoQuestionIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToNextDemoQuestion = () => {
    setDemoQuestionIndex((prev) => Math.min(prev + 1, Math.max(demoQuestions.length - 1, 0)));
  };

  useEffect(() => {
    setDemoQuestionIndex(0);
  }, [selectedOnlineExamId]);

  useEffect(() => {
    setShowDemoResultPage(false);
  }, [selectedOnlineExamId]);

  const requestFinanceReceipt = (recordType) => {
    setFinanceNotice(`Receipt request submitted for ${recordType}. You will receive it in messages.`);
  };

  const setFinanceReminder = (recordType, dueDate) => {
    setFinanceNotice(`Reminder set for ${recordType} due on ${dueDate}.`);
  };

  const downloadFinanceStatement = () => {
    const statementLines = [
      'Student Finance Statement',
      `Student: ${profile?.name || 'Student'}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      ...filteredFinanceRecords.map((row) => (
        `${row.type} | Expected: ${row.expected} XAF | Paid: ${row.paid} XAF | Balance: ${row.expected - row.paid} XAF | Due: ${row.dueDate} | Status: ${row.status}`
      )),
      '',
      `Total Expected: ${totalExpected} XAF`,
      `Total Paid: ${totalPaid} XAF`,
      `Outstanding: ${outstandingBalance} XAF`
    ].join('\n');

    const blob = new Blob([statementLines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'finance-statement.txt';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setFinanceNotice('Finance statement downloaded successfully.');
  };

  const downloadMaterial = (material) => {
    const content = `Material: ${material.title}\nClass: ${material.className}\nSubject: ${material.subject}\nType: ${material.type}\nFormat: ${material.format}\nPublished by: ${material.uploadedBy?.name || 'Teacher'}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = material.fileName || `${material.title.replace(/\s+/g, '_')}.${material.format.toLowerCase()}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMaterialsNotice(`Downloading: ${material.title}`);
  };

  const todayWeekday = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    []
  );

  const profileForEdit = {
    name: profile?.name || 'Student Name',
    avatar: profile?.avatar || 'https://via.placeholder.com/80',
    matricule: profile?.matricule || 'N/A',
    password: profile?.password || ''
  };

  const renderPanel = (title, subtitle, cards) => (
    <section className="student-panel">
      <div className="student-panel-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="student-grid">
        {cards.map((card) => (
          <article key={card.title} className="student-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            {card.meta && <span>{card.meta}</span>}
          </article>
        ))}
      </div>
    </section>
  );

  const getStrengthLevel = (score) => {
    if (score >= 15) return { label: 'Strong', tone: 'strong' };
    if (score >= 12) return { label: 'Good', tone: 'good' };
    if (score >= 10) return { label: 'Fair', tone: 'fair' };
    return { label: 'Weak', tone: 'weak' };
  };

  const getResultGrade = (mark) => {
    if (mark >= 16) return { label: 'Excellent', tone: 'excellent' };
    if (mark >= 14) return { label: 'Very Good', tone: 'very-good' };
    if (mark >= 12) return { label: 'Good', tone: 'good' };
    if (mark >= 10) return { label: 'Pass', tone: 'pass' };
    return { label: 'Needs Support', tone: 'support' };
  };

  const renderMain = () => {
    switch (activeView) {
      case 'my-subjects':
        return (
          <>
            <section className="student-panel">
              <div className="student-panel-head">
                <h2>My Subjects</h2>
                <p>Performance, teacher guidance and learning resources for each subject.</p>
              </div>

              <div className="subjects-summary-grid">
                <article className="subjects-summary-card">
                  <strong>{subjectPerformance.length}</strong>
                  <span>Total Subjects</span>
                </article>
                <article className="subjects-summary-card">
                  <strong>{subjectPerformance.filter((item) => item.score >= 12).length}</strong>
                  <span>Strong / Good Subjects</span>
                </article>
                <article className="subjects-summary-card warning">
                  <strong>{subjectPerformance.filter((item) => item.score < 10).length}</strong>
                  <span>Subjects Needing Support</span>
                </article>
                <article className="subjects-summary-card">
                  <strong>
                    {subjectPerformance.reduce((sum, item) => sum + item.resources.length, 0)}
                  </strong>
                  <span>Available Resources</span>
                </article>
              </div>
            </section>

            <section className="subject-cards-grid">
              {subjectPerformance.map((item) => {
                const strength = getStrengthLevel(item.score);
                return (
                  <article key={item.subject} className="subject-detail-card">
                    <div className="subject-detail-head">
                      <div>
                        <h3>{item.subject}</h3>
                        <p>Teacher: {item.teacher}</p>
                      </div>
                      <span className={`subject-strength-badge ${strength.tone}`}>{strength.label}</span>
                    </div>

                    <div className="subject-score-row">
                      <strong>{item.score}/20</strong>
                      <span>{item.progress}</span>
                    </div>

                    <div className="subject-chart-track">
                      <div
                        className={`subject-chart-fill ${item.score < 10 ? 'weak' : ''}`}
                        style={{ width: `${(item.score / 20) * 100}%` }}
                      />
                    </div>

                    <div className="subject-completion-row">
                      <span>Resource Completion</span>
                      <strong>{item.completionRate}%</strong>
                    </div>

                    <div className="subject-resource-list">
                      {item.resources.map((resource) => (
                        <span key={resource}>{resource}</span>
                      ))}
                    </div>

                    <p className="subject-recommendation">Tip: {item.recommendation}</p>
                  </article>
                );
              })}
            </section>
          </>
        );
      case 'assignments':
        return (
          <div className="student-assignments-root">
            <section className="student-panel">
              <div className="student-panel-head">
                <h2>Assignments</h2>
                <p>View teacher assignments, track status and submit in accepted formats.</p>
              </div>

              <div className="student-assignment-stats">
                <article>
                  <FaClipboardCheck />
                  <div>
                    <strong>{assignmentCounts.pending}</strong>
                    <span>Pending</span>
                  </div>
                </article>
                <article>
                  <FaUpload />
                  <div>
                    <strong>{assignmentCounts.submitted}</strong>
                    <span>Submitted</span>
                  </div>
                </article>
                <article>
                  <FaCheckCircle />
                  <div>
                    <strong>{assignmentCounts.graded}</strong>
                    <span>Graded</span>
                  </div>
                </article>
                <article>
                  <FaClock />
                  <div>
                    <strong>{assignmentCounts.late}</strong>
                    <span>Late</span>
                  </div>
                </article>
              </div>
            </section>

            <section className="student-assignment-grid">
              <article className="student-panel student-assignment-list">
                <div className="student-panel-head">
                  <h2>Teacher Assignments</h2>
                  <p>Assignments sent by teachers with due dates and accepted formats.</p>
                </div>

                <div className="student-assignment-filters">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'submitted', label: 'Submitted' },
                    { key: 'graded', label: 'Graded' },
                    { key: 'late', label: 'Late' }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className={assignmentFilter === filter.key ? 'active' : ''}
                      onClick={() => setAssignmentFilter(filter.key)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="student-assignment-items">
                  {filteredAssignments.map((assignment) => {
                    const status = getAssignmentStatus(assignment);
                    return (
                      <button
                        key={assignment.id}
                        type="button"
                        className={`student-assignment-item ${assignment.id === selectedStudentAssignment?.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedStudentAssignmentId(assignment.id);
                          setAssignmentNotice('');
                        }}
                      >
                        <div>
                          <strong>{assignment.title}</strong>
                          <p>{assignment.className} • {assignment.teacher}</p>
                        </div>
                        <div className="student-assignment-meta">
                          <span>Due: {assignment.dueDate}</span>
                          <span className={`student-status-pill ${status}`}>{status.replace('-', ' ')}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </article>

              <article className="student-panel student-assignment-detail">
                {selectedStudentAssignment && (
                  <>
                    <div className="student-panel-head">
                      <h2>{selectedStudentAssignment.title}</h2>
                      <p>{selectedStudentAssignment.className} • {selectedStudentAssignment.teacher}</p>
                    </div>

                    <div className="student-assignment-info-grid">
                      <div>
                        <span>Created</span>
                        <strong>{selectedStudentAssignment.createdAt}</strong>
                      </div>
                      <div>
                        <span>Due Date</span>
                        <strong>{selectedStudentAssignment.dueDate}</strong>
                      </div>
                      <div>
                        <span>Status</span>
                        <strong className="capitalize">{getAssignmentStatus(selectedStudentAssignment).replace('-', ' ')}</strong>
                      </div>
                    </div>

                    <p className="student-assignment-instructions">{selectedStudentAssignment.instructions}</p>

                    <div className="student-assignment-formats">
                      {selectedStudentAssignment.formats.map((format) => (
                        <span key={format}>{format}</span>
                      ))}
                    </div>

                    {selectedStudentAssignment.score || getAssignmentStatus(selectedStudentAssignment) === 'late-submitted' ? (
                      <div className="student-submit-box teacher-evaluation-box">
                        {selectedStudentAssignment.score ? (
                          <>
                            <h3>Teacher Evaluation</h3>
                            <div className="teacher-evaluation-grid">
                              <div>
                                <span>Grade</span>
                                <strong>{selectedStudentAssignment.score}/20</strong>
                              </div>
                              <div>
                                <span>Status</span>
                                <strong>Graded</strong>
                              </div>
                            </div>
                            <p>
                              <strong>Teacher Comment:</strong>{' '}
                              {selectedStudentAssignment.feedback || 'No comment provided yet.'}
                            </p>
                          </>
                        ) : (
                          <>
                            <h3>Submission Closed</h3>
                            <div className="teacher-evaluation-grid">
                              <div>
                                <span>Status</span>
                                <strong>Late Submitted</strong>
                              </div>
                              <div>
                                <span>Submitted At</span>
                                <strong>{new Date(selectedStudentAssignment.submittedAt).toLocaleString()}</strong>
                              </div>
                            </div>
                            <p>
                              This assignment was submitted late. Resubmission is disabled and only details are visible.
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="student-submit-box">
                        <h3>Submit Assignment</h3>

                        <div className="student-submit-fields">
                          <label>
                            Submission Format
                            <select
                              value={submissionFormat}
                              onChange={(event) => {
                                setSubmissionFormat(event.target.value);
                                setTypedSubmission('');
                                setSubmissionFile(null);
                                setSubmissionFilePreview('');
                                setAssignmentNotice('');
                              }}
                            >
                              {selectedStudentAssignment.formats.map((format) => (
                                <option key={format} value={format}>{format}</option>
                              ))}
                            </select>
                          </label>

                          {submissionFormat === 'Typed' ? (
                            <label>
                              Typed Response
                              <textarea
                                rows={4}
                                value={typedSubmission}
                                onChange={(event) => {
                                  setTypedSubmission(event.target.value);
                                  setAssignmentNotice('');
                                }}
                                placeholder="Write your assignment response here..."
                              />
                            </label>
                          ) : (
                            <label>
                              Attach File
                              <input
                                type="file"
                                accept={getAcceptedFiles(submissionFormat)}
                                onChange={handleSubmissionFileChange}
                              />
                            </label>
                          )}

                          {submissionFilePreview && (
                            <img src={submissionFilePreview} alt="Submission preview" className="student-submission-preview" />
                          )}
                        </div>

                        <div className="student-submit-actions">
                          <button type="button" className="primary" onClick={submitAssignment}>Submit / Resubmit</button>
                          <button type="button" className="secondary" onClick={clearSubmissionDraft}>Clear Draft</button>
                          <button type="button" className="secondary" onClick={withdrawSubmission}>Withdraw</button>
                        </div>

                        {assignmentNotice && <p className="student-assignment-notice">{assignmentNotice}</p>}
                      </div>
                    )}

                    <div className="student-submission-history">
                      <h3>Submission Record</h3>
                      {selectedStudentAssignment.submittedAt ? (
                        <>
                          <p><strong>Submitted:</strong> {new Date(selectedStudentAssignment.submittedAt).toLocaleString()}</p>
                          <p><strong>Format:</strong> {selectedStudentAssignment.submittedFormat}</p>
                          {selectedStudentAssignment.submissionText && (
                            <p><strong>Content:</strong> {selectedStudentAssignment.submissionText}</p>
                          )}
                          {selectedStudentAssignment.submissionFileName && (
                            <p><strong>File:</strong> {selectedStudentAssignment.submissionFileName}</p>
                          )}
                          {selectedStudentAssignment.score && (
                            <p><strong>Score:</strong> {selectedStudentAssignment.score}/20</p>
                          )}
                          {selectedStudentAssignment.feedback && (
                            <p><strong>Teacher Feedback:</strong> {selectedStudentAssignment.feedback}</p>
                          )}
                        </>
                      ) : (
                        <p>No submission yet for this assignment.</p>
                      )}
                    </div>
                  </>
                )}
              </article>
            </section>
          </div>
        );
      case 'online-classes':
        return (
          <div className="student-online-root">
            <section className="student-panel">
              <div className="student-panel-head">
                <h2>Online Classes</h2>
                <p>Join live sessions, review upcoming classes, and manage class participation tools.</p>
              </div>

              <div className="student-online-stats">
                <article>
                  <FaVideo />
                  <div>
                    <strong>{onlineClassSummary.total}</strong>
                    <span>Total Classes</span>
                  </div>
                </article>
                <article>
                  <FaChalkboardTeacher />
                  <div>
                    <strong>{onlineClassSummary.live}</strong>
                    <span>Live Now</span>
                  </div>
                </article>
                <article>
                  <FaCalendarCheck />
                  <div>
                    <strong>{onlineClassSummary.scheduled}</strong>
                    <span>Scheduled</span>
                  </div>
                </article>
                <article>
                  <FaHistory />
                  <div>
                    <strong>{onlineClassSummary.cancelled}</strong>
                    <span>Cancelled</span>
                  </div>
                </article>
                <article>
                  <FaClipboardCheck />
                  <div>
                    <strong>{onlineClassSummary.attended}</strong>
                    <span>Attendance Marked</span>
                  </div>
                </article>
              </div>
            </section>

            {joinedOnlineClass ? (
              <section className={`student-online-live-shell ${isOnlineMeetingEnlarged ? 'full-screen' : ''}`}>
                <div className="student-online-live-top">
                  <div>
                    <h3>{joinedOnlineClass.topic}</h3>
                    <p>{joinedOnlineClass.className} • {joinedOnlineClass.teacher} • Code: {joinedOnlineClass.meetingCode}</p>
                  </div>
                  <span className="student-live-badge">Live</span>
                </div>

                <div className="student-online-live-grid">
                  <div className="student-online-stage">
                    <div className="student-online-main-tile">
                      <img
                        src={buildAvatar(joinedOnlineClass.teacher)}
                        alt={joinedOnlineClass.teacher}
                        className="student-online-avatar teacher"
                      />
                      <strong>{joinedOnlineClass.teacher}</strong>
                      <span>Teacher Presentation</span>
                    </div>
                    <div className="student-online-small-tiles">
                      <div>
                        <img
                          src={buildAvatar(profile?.name || 'Student')}
                          alt={profile?.name || 'Student'}
                          className="student-online-avatar"
                        />
                        <strong>{profile?.name || 'Student'}</strong>
                        <span>You</span>
                      </div>
                      <div>
                        <strong>Class Chat</strong>
                        <span>{studentOnlineChat.length} messages</span>
                      </div>
                    </div>
                  </div>

                  <aside className="student-online-side-panel">
                    <h4>Class Chat</h4>
                    <div className="student-online-chat-log">
                      {studentOnlineChat.map((chat) => (
                        <p key={chat.id}><strong>{chat.sender}:</strong> {chat.message}</p>
                      ))}
                    </div>

                    <div className="student-online-chat-input">
                      <input
                        type="text"
                        placeholder="Type your message"
                        value={studentOnlineMessage}
                        onChange={(event) => setStudentOnlineMessage(event.target.value)}
                      />
                      <button type="button" onClick={sendOnlineClassMessage}><FaPaperPlane /></button>
                    </div>

                    <h4>Quick Notes</h4>
                    <textarea
                      rows={4}
                      value={studentOnlineNoteDraft}
                      onChange={(event) => setStudentOnlineNoteDraft(event.target.value)}
                      placeholder="Write key points from the class..."
                    />
                    <button type="button" className="save-note-btn" onClick={saveOnlineClassNote}>Save Note</button>
                  </aside>
                </div>

                <div className="student-online-controls">
                  <button
                    type="button"
                    onClick={() => setIsOnlineMeetingEnlarged((prev) => !prev)}
                  >
                    {isOnlineMeetingEnlarged ? <FaCompress /> : <FaExpand />} {isOnlineMeetingEnlarged ? 'Exit Full Screen' : 'Enlarge View'}
                  </button>
                  <button type="button" onClick={() => setStudentMicOn((prev) => !prev)}>
                    {studentMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />} {studentMicOn ? 'Mic On' : 'Mic Off'}
                  </button>
                  <button type="button" onClick={() => setStudentCameraOn((prev) => !prev)}>
                    {studentCameraOn ? <FaVideo /> : <FaVideoSlash />} {studentCameraOn ? 'Camera On' : 'Camera Off'}
                  </button>
                  <button
                    type="button"
                    className={studentHandRaised ? 'active' : ''}
                    onClick={() => setStudentHandRaised((prev) => !prev)}
                  >
                    <FaHandPaper /> {studentHandRaised ? 'Lower Hand' : 'Raise Hand'}
                  </button>
                  <button type="button" className="leave-class-btn" onClick={leaveOnlineClass}>Leave Class</button>
                </div>
              </section>
            ) : (
              <section className="student-online-grid">
                <article className="student-panel student-online-list-panel">
                  <div className="student-panel-head">
                    <h2>Class Sessions</h2>
                    <p>Choose a class to view details or join.</p>
                  </div>

                  <div className="student-online-filters">
                    {[
                      ['all', 'All'],
                      ['live', 'Live'],
                      ['scheduled', 'Scheduled'],
                      ['completed', 'Completed'],
                      ['cancelled', 'Cancelled']
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={onlineClassFilter === key ? 'active' : ''}
                        onClick={() => setOnlineClassFilter(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="student-online-list">
                    {filteredOnlineClasses.map((classItem) => (
                      <button
                        key={classItem.id}
                        type="button"
                        className={`student-online-item ${selectedOnlineClass?.id === classItem.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedOnlineClassId(classItem.id);
                          setOnlineClassNotice('');
                        }}
                      >
                        <div>
                          <strong>{classItem.topic}</strong>
                          <p>{classItem.className} • {classItem.teacher}</p>
                        </div>
                        <div className="student-online-item-meta">
                          <span>{classItem.date} • {classItem.time}</span>
                          <span className={`student-online-status ${classItem.status}`}>{classItem.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="student-panel student-online-detail-panel">
                  {selectedOnlineClass && (
                    <>
                      <div className="student-panel-head">
                        <h2>{selectedOnlineClass.topic}</h2>
                        <p>{selectedOnlineClass.className} • {selectedOnlineClass.teacher}</p>
                      </div>

                      <div className="student-online-detail-grid">
                        <div>
                          <span>Date</span>
                          <strong>{selectedOnlineClass.date}</strong>
                        </div>
                        <div>
                          <span>Time</span>
                          <strong>{selectedOnlineClass.time}</strong>
                        </div>
                        <div>
                          <span>Duration</span>
                          <strong>{selectedOnlineClass.duration} mins</strong>
                        </div>
                        <div>
                          <span>Meeting Code</span>
                          <strong>{selectedOnlineClass.meetingCode}</strong>
                        </div>
                      </div>

                      <p className="student-online-description">{selectedOnlineClass.description}</p>

                      <div className="student-online-resources">
                        {selectedOnlineClass.resources.map((resource) => (
                          <span key={resource}>{resource}</span>
                        ))}
                      </div>

                      <div className="student-online-actions">
                        <button
                          type="button"
                          className="primary"
                          onClick={() => joinOnlineClass(selectedOnlineClass)}
                          disabled={selectedOnlineClass.status === 'completed' || selectedOnlineClass.status === 'cancelled'}
                        >
                          {selectedOnlineClass.status === 'cancelled'
                            ? 'Class Cancelled'
                            : selectedOnlineClass.status === 'live'
                              ? 'Join Live Class'
                              : 'Open Class Room'}
                        </button>
                        <button type="button" onClick={() => setOnlineReminder(selectedOnlineClass)}>Set Reminder</button>
                        <button type="button" onClick={() => setOnlineClassNotice('Resources downloaded for offline revision.')}>Download Resources</button>
                      </div>

                      {onlineClassNotice && <p className="student-online-notice">{onlineClassNotice}</p>}
                    </>
                  )}
                </article>
              </section>
            )}
          </div>
        );
      case 'online-exams':
        return (
          <div className="student-generic-root">
            <section className="student-panel">
              <div className="student-panel-head">
                <h2>Online Exams</h2>
                <p>Track exam availability, attempts, duration and best scores.</p>
              </div>

              <div className="student-online-exam-stats">
                <article>
                  <strong>{onlineExamSummary.total}</strong>
                  <span>Total Exams</span>
                </article>
                <article>
                  <strong>{onlineExamSummary.open}</strong>
                  <span>Open</span>
                </article>
                <article>
                  <strong>{onlineExamSummary.upcoming}</strong>
                  <span>Upcoming</span>
                </article>
                <article>
                  <strong>{onlineExamSummary.completed}</strong>
                  <span>Completed</span>
                </article>
              </div>

              <div className="student-assignment-filters">
                {[
                  ['all', 'All'],
                  ['open', 'Open'],
                  ['upcoming', 'Upcoming'],
                  ['completed', 'Completed']
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={onlineExamFilter === key ? 'active' : ''}
                    onClick={() => setOnlineExamFilter(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="student-online-exam-layout">
              <article className="student-panel student-online-exam-list-panel">
                <div className="student-panel-head">
                  <h2>Exam List</h2>
                  <p>Select an exam to view full details.</p>
                </div>

                <div className="student-online-exam-list">
                  {filteredOnlineExams.map((exam) => (
                    <button
                      key={exam.id}
                      type="button"
                      className={`student-online-exam-item ${selectedOnlineExam?.id === exam.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedOnlineExamId(exam.id);
                        setOnlineExamNotice('');
                        setDemoExamResult(null);
                        setShowDemoResultPage(false);
                        setDemoQuestionIndex(0);
                      }}
                    >
                      <div className="student-online-exam-item-head">
                        <strong>{exam.title}</strong>
                        {exam.demo && <span className="student-online-exam-demo">Demo</span>}
                      </div>
                      <p>{exam.className} • {exam.subject} • {exam.teacher}</p>
                      <div className="student-online-exam-item-meta">
                        <span>{exam.openDate}</span>
                        <span>{exam.duration} mins</span>
                        <span className={`student-online-status ${exam.status}`}>{exam.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </article>

              <article className="student-panel student-online-exam-detail-panel">
                {selectedOnlineExam && (
                  <>
                <div className="student-panel-head">
                  <h2>{selectedOnlineExam.title}</h2>
                  <p>{selectedOnlineExam.className} • {selectedOnlineExam.subject} • {selectedOnlineExam.teacher}</p>
                </div>
                <div className="student-online-detail-grid">
                  <div><span>Open Date</span><strong>{selectedOnlineExam.openDate}</strong></div>
                  <div><span>Questions</span><strong>{selectedOnlineExam.questions}</strong></div>
                  <div><span>Duration</span><strong>{selectedOnlineExam.duration} mins</strong></div>
                  <div><span>Attempts</span><strong>{selectedOnlineExam.attempts}/{selectedOnlineExam.maxAttempts}</strong></div>
                  <div><span>Best Score</span><strong>{selectedOnlineExam.bestScore !== null ? `${selectedOnlineExam.bestScore}/20` : 'N/A'}</strong></div>
                  <div><span>Status</span><strong className="capitalize">{selectedOnlineExam.status}</strong></div>
                </div>

                <p className="student-online-description">{selectedOnlineExam.instructions}</p>

                {selectedOnlineExam.previewQuestions?.length > 0 && showDemoResultPage && demoExamResult && (
                  <div className="student-online-exam-result-page">
                    <h3>Detailed Result Page</h3>
                    <p className="student-online-exam-result-score">
                      Score: {demoExamResult.score}/{demoExamResult.total}
                    </p>
                    <p className="student-online-exam-result-comment">
                      {getDemoResultComment(demoExamResult)}
                    </p>

                    <div className="student-online-exam-corrections">
                      {(selectedOnlineExam.previewQuestions || []).map((question) => {
                        const selected = selectedDemoAnswers[question.id] || 'Not answered';
                        const correct = question.answer;
                        const isCorrect = selected === correct;

                        return (
                          <article key={question.id} className="student-online-exam-correction-item">
                            <strong>Q{question.id}. {question.question}</strong>
                            <p><span>Your Answer:</span> {selected}</p>
                            <p><span>Correct Answer:</span> {correct}</p>
                            <span className={`student-online-exam-correction-status ${isCorrect ? 'correct' : 'wrong'}`}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </article>
                        );
                      })}
                    </div>

                    <div className="student-online-exam-result-actions">
                      <button type="button" className="primary" onClick={downloadDemoCertificate}>Download Certificate</button>
                      <button type="button" onClick={() => setShowDemoResultPage(false)}>Back to Questions</button>
                      <button type="button" onClick={resetDemoAnswers}>Retake Demo</button>
                    </div>
                  </div>
                )}

                {selectedOnlineExam.previewQuestions?.length > 0 && !showDemoResultPage && activeDemoQuestion && (
                  <div className="student-online-exam-preview">
                    <h3>Demo Multiple Choice Questions</h3>
                    <p className="student-online-exam-progress">
                      Question {demoQuestionIndex + 1} of {demoQuestions.length}
                    </p>
                    <div className="student-online-exam-preview-list">
                      <article key={activeDemoQuestion.id} className="student-online-exam-preview-item">
                        <strong>Q{activeDemoQuestion.id}. {activeDemoQuestion.question}</strong>
                        <ul>
                          {activeDemoQuestion.options.map((option) => (
                            <li key={option}>
                              <button
                                type="button"
                                className={`student-online-exam-option ${selectedDemoAnswers[activeDemoQuestion.id] === option ? 'selected' : ''} ${demoExamResult && option === activeDemoQuestion.answer ? 'correct' : ''} ${demoExamResult && selectedDemoAnswers[activeDemoQuestion.id] === option && option !== activeDemoQuestion.answer ? 'wrong' : ''}`}
                                onClick={() => selectDemoAnswer(activeDemoQuestion.id, option)}
                              >
                                {option}
                              </button>
                            </li>
                          ))}
                        </ul>
                        {demoExamResult && <p><span>Correct Answer:</span> {activeDemoQuestion.answer}</p>}
                      </article>
                    </div>

                    <div className="student-online-exam-question-nav">
                      <button type="button" onClick={goToPreviousDemoQuestion} disabled={demoQuestionIndex === 0}>Back</button>
                      <button
                        type="button"
                        onClick={goToNextDemoQuestion}
                        disabled={demoQuestionIndex >= demoQuestions.length - 1}
                      >
                        Preview Next
                      </button>
                    </div>

                    <div className="student-online-exam-preview-actions">
                      <button type="button" className="primary" onClick={submitDemoAnswers}>Submit Answers</button>
                      <button type="button" onClick={resetDemoAnswers}>Reset</button>
                    </div>

                    {demoExamResult && (
                      <p className="student-online-exam-result">
                        Result: {demoExamResult.score}/{demoExamResult.total}
                      </p>
                    )}
                  </div>
                )}

                <div className="student-online-actions">
                  <button
                    type="button"
                    className="primary"
                    disabled={selectedOnlineExam.status !== 'open'}
                    onClick={() => startOnlineExam(selectedOnlineExam)}
                  >
                    Start Exam
                  </button>
                  <button type="button" onClick={() => setOnlineExamNotice('Demo preview loaded. You can proceed when ready.')}>Preview</button>
                </div>

                {onlineExamNotice && <p className="student-online-notice">{onlineExamNotice}</p>}
                  </>
                )}
              </article>
            </section>
          </div>
        );
      case 'timetable':
        return (
          <section className="student-panel">
            <div className="student-panel-head">
              <h2>Timetable</h2>
              <p>Weekly schedule synced with your classes and online sessions.</p>
            </div>

            <div className="student-timetable-grid">
              {timetableByDay.map((day) => (
                <article key={day.day} className={`student-timetable-card ${day.day === todayWeekday ? 'today' : ''}`}>
                  <header className="student-timetable-head">
                    <h3>{day.day}</h3>
                    {day.day === todayWeekday && <span>Today</span>}
                  </header>

                  <div className="student-timetable-sessions">
                    {day.sessions.map((session) => {
                      const [time, ...subjectParts] = session.split(' ');
                      const subject = subjectParts.join(' ');

                      return (
                        <div key={session} className="student-timetable-session">
                          <strong>{time}</strong>
                          <p>{subject}</p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      case 'attendance':
        return (
          <div className="student-generic-root">
            <section className="student-panel">
              <div className="student-panel-head">
                <h2>Attendance</h2>
                <p>Track daily attendance with dates, class details and teacher remarks.</p>
              </div>

              <div className="student-attendance-stats">
                <article><strong>{attendanceSummary.total}</strong><span>Total Sessions</span></article>
                <article><strong>{attendanceSummary.present}</strong><span>Present</span></article>
                <article><strong>{attendanceSummary.late}</strong><span>Late</span></article>
                <article><strong>{attendanceSummary.absent}</strong><span>Absent</span></article>
                <article><strong>{attendanceSummary.rate}%</strong><span>Attendance Rate</span></article>
              </div>

              <div className="student-assignment-filters">
                {[
                  ['all', 'All'],
                  ['present', 'Present'],
                  ['late', 'Late'],
                  ['absent', 'Absent']
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={attendanceStatusFilter === key ? 'active' : ''}
                    onClick={() => setAttendanceStatusFilter(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="student-panel">
              <div className="student-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Subject</th>
                      <th>Teacher</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.date}</td>
                        <td>{record.subject}</td>
                        <td>{record.teacher}</td>
                        <td>{record.time}</td>
                        <td>
                          <span className={`student-attendance-status ${record.status}`}>
                            {record.status}
                          </span>
                        </td>
                        <td>{record.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="student-panel">
              <div className="student-panel-head">
                <h2>Attendance by Subject</h2>
                <p>Summary aligned with class registers for each subject.</p>
              </div>
              <div className="student-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceBySubject.map((item) => {
                      const total = item.present + item.absent + item.late;
                      const rate = total ? Math.round((item.present / total) * 100) : 0;
                      return (
                        <tr key={item.subject}>
                          <td>{item.subject}</td>
                          <td>{item.present}</td>
                          <td>{item.absent}</td>
                          <td>{item.late}</td>
                          <td>{rate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      case 'results':
        return (
          <div className="student-generic-root">
            <section className="student-panel">
              <div className="student-panel-head">
                <h2>Results</h2>
                <p>View results by academic year, term and sequence, including your full school history.</p>
              </div>

              <div className="student-results-filter-grid">
                <select value={selectedResultYear} onChange={(event) => setSelectedResultYear(event.target.value)}>
                  {resultYearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select value={selectedResultTerm} onChange={(event) => setSelectedResultTerm(event.target.value)}>
                  {resultTermOptions.map((term) => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
                <select value={selectedResultSequence} onChange={(event) => setSelectedResultSequence(event.target.value)}>
                  {resultSequenceOptions.map((sequence) => (
                    <option key={sequence} value={sequence}>{sequence}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={resultsSubjectSearch}
                  onChange={(event) => setResultsSubjectSearch(event.target.value)}
                  placeholder="Search by subject"
                />
              </div>

              <div className="student-results-stats">
                <article><strong>{filteredResultRecords.length}</strong><span>Filtered Results</span></article>
                <article><strong>{filteredWeightedAverage.toFixed(2)}/20</strong><span>Filtered Average</span></article>
                <article><strong>{selectedPeriodClassRank}</strong><span>Class Rank</span></article>
                <article><strong>{filteredPassCount}</strong><span>Passed Subjects</span></article>
                <article><strong>{filteredFailCount}</strong><span>Needs Support</span></article>
                <article><strong>{cumulativeAverage.toFixed(2)}/20</strong><span>All-Time Average</span></article>
                <article><strong>{resultRecords.length}</strong><span>All Published Results</span></article>
              </div>
            </section>

            <section className="student-panel">
              <div className="student-panel-head">
                <h2>Filtered Results</h2>
                <p>Detailed results for the selected academic period.</p>
              </div>

              <div className="student-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Academic Year</th>
                      <th>Term</th>
                      <th>Sequence</th>
                      <th>Subject</th>
                      <th>Teacher</th>
                      <th>Exam Type</th>
                      <th>Mark</th>
                      <th>Grade</th>
                      <th>Coeff</th>
                      <th>Weighted</th>
                      <th>Class Rank</th>
                      <th>Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFilteredResultRecords.map((row) => {
                      const grade = getResultGrade(row.mark);
                      return (
                      <tr key={row.id}>
                        <td>{row.academicYear}</td>
                        <td>{row.term}</td>
                        <td>{row.sequence}</td>
                        <td>{row.subject}</td>
                        <td>{row.teacher}</td>
                        <td>{row.examType}</td>
                        <td>{row.mark}/20</td>
                        <td>
                          <span className={`student-result-grade ${grade.tone}`}>{grade.label}</span>
                        </td>
                        <td>{row.coeff}</td>
                        <td>{row.mark * row.coeff}</td>
                        <td>{getClassRankForRecord(row)}</td>
                        <td>{row.publishedAt}</td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>

              {sortedFilteredResultRecords.length === 0 && (
                <p className="student-results-empty">No result records found for the selected filters.</p>
              )}
            </section>

            <section className="student-panel">
              <div className="student-panel-head">
                <h2>Performance Summary</h2>
                <p>Best, lowest and yearly performance trend since admission.</p>
              </div>

              <div className="student-online-detail-grid">
                <div><span>Best Subject</span><strong>{bestResult ? `${bestResult.subject} (${bestResult.mark}/20)` : 'N/A'}</strong></div>
                <div><span>Lowest Subject</span><strong>{lowestResult ? `${lowestResult.subject} (${lowestResult.mark}/20)` : 'N/A'}</strong></div>
                <div><span>Promotion Signal</span><strong>{filteredWeightedAverage >= 10 ? 'On Track' : 'At Risk'}</strong></div>
                <div><span>Principal Comment</span><strong>{filteredWeightedAverage >= 12 ? 'Consistent Progress' : 'Support Required'}</strong></div>
                <div><span>Current Period Class Rank</span><strong>{selectedPeriodClassRank}</strong></div>
              </div>

              <div className="student-results-yearly-grid">
                {academicHistoryByYear.map((yearRow) => (
                  <article key={yearRow.year} className="student-results-year-card">
                    <h3>{yearRow.year}</h3>
                    <p><strong>Average:</strong> {yearRow.average.toFixed(2)}/20</p>
                    <p><strong>Records:</strong> {yearRow.total}</p>
                    <p><strong>Best:</strong> {yearRow.best.subject} ({yearRow.best.mark}/20)</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="student-panel">
              <div className="student-panel-head">
                <h2>All Results History</h2>
                <p>Complete result archive since joining the school.</p>
              </div>

              <div className="student-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Academic Year</th>
                      <th>Term</th>
                      <th>Sequence</th>
                      <th>Subject</th>
                      <th>Mark</th>
                      <th>Coeff</th>
                      <th>Class Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAllResultRecords.map((row) => (
                      <tr key={`history-${row.id}`}>
                        <td>{row.publishedAt}</td>
                        <td>{row.academicYear}</td>
                        <td>{row.term}</td>
                        <td>{row.sequence}</td>
                        <td>{row.subject}</td>
                        <td>{row.mark}/20</td>
                        <td>{row.coeff}</td>
                        <td>{getClassRankForRecord(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      case 'finance':
        return (
          <div className="student-generic-root">
            <section className="student-panel">
              <div className="student-panel-head">
                <h2>Finance</h2>
                <p>Track fees, balances, due dates and payment status professionally.</p>
              </div>

              <div className="student-online-stats">
                <article><div><strong>{totalExpected.toLocaleString()} XAF</strong><span>Total Expected</span></div></article>
                <article><div><strong>{totalPaid.toLocaleString()} XAF</strong><span>Total Paid</span></div></article>
                <article><div><strong>{outstandingBalance.toLocaleString()} XAF</strong><span>Outstanding</span></div></article>
                <article><div><strong>{paidCoverageRate}%</strong><span>Payment Coverage</span></div></article>
                <article><div><strong>{financeSummary.paid}</strong><span>Paid Items</span></div></article>
                <article><div><strong>{financeSummary.partial}</strong><span>Partial Items</span></div></article>
                <article><div><strong>{financeSummary.outstandingItems}</strong><span>Outstanding Items</span></div></article>
              </div>

              <div className="student-tool-row">
                <input
                  type="text"
                  value={financeSearch}
                  onChange={(event) => setFinanceSearch(event.target.value)}
                  placeholder="Search fee item or status"
                />
                <select value={financeStatusFilter} onChange={(event) => setFinanceStatusFilter(event.target.value)}>
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </select>
                <button type="button" className="table-action-btn" onClick={downloadFinanceStatement}>Download Statement</button>
              </div>
            </section>

            <section className="student-panel">
              <div className="student-panel-head">
                <h2>Due Soon</h2>
                <p>Outstanding fee items due within the next 14 days.</p>
              </div>

              {dueSoonFinanceItems.length > 0 ? (
                <div className="student-finance-due-list">
                  {dueSoonFinanceItems.map((row) => (
                    <article key={`due-${row.id}`} className="student-finance-due-item">
                      <strong>{row.type}</strong>
                      <p>Due: {row.dueDate}</p>
                      <p>Balance: {(row.expected - row.paid).toLocaleString()} XAF</p>
                      <button type="button" className="table-action-btn" onClick={() => setFinanceReminder(row.type, row.dueDate)}>Set Reminder</button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="student-results-empty">No outstanding items due in the next 14 days.</p>
              )}
            </section>

            <section className="student-panel">
              <div className="student-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Expected</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFinanceRecords.map((row) => (
                      <tr key={row.id}>
                        <td>{row.type}</td>
                        <td>{row.expected.toLocaleString()} XAF</td>
                        <td>{row.paid.toLocaleString()} XAF</td>
                        <td>{(row.expected - row.paid).toLocaleString()} XAF</td>
                        <td>{row.dueDate}</td>
                        <td>
                          <span className={`student-finance-status ${row.status.toLowerCase()}`}>{row.status}</span>
                        </td>
                        <td>
                          <button type="button" className="table-action-btn" onClick={() => requestFinanceReceipt(row.type)}>Request Receipt</button>
                          <button type="button" className="table-action-btn" onClick={() => setFinanceReminder(row.type, row.dueDate)}>Reminder</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {financeNotice && <p className="student-online-notice">{financeNotice}</p>}
            </section>
          </div>
        );
      case 'announcements':
        return (
          <Announcements
            announcements={announcements}
            activeAnnouncementId={selectedStudentAnnouncementId}
            onSelectAnnouncement={handleNotificationSelect}
            canCreateAnnouncement={false}
            canManageAnnouncement={false}
          />
        );
      case 'online-materials':
        return (
          <div className="materials-root">
            <div className="materials-header">
              <h2>Learning Materials</h2>
              <p>Same published materials layout as teachers. Students can view and use published resources only.</p>
            </div>

            <section className="materials-card">
              <div className="materials-tools">
                <input
                  value={materialsSearch}
                  onChange={(event) => setMaterialsSearch(event.target.value)}
                  placeholder="Search materials..."
                />
                <select value={materialsClassFilter} onChange={(event) => setMaterialsClassFilter(event.target.value)}>
                  {materialsClassOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
                <select value={materialsFilter} onChange={(event) => setMaterialsFilter(event.target.value)}>
                  {materialsSubjectOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
                <select value={materialsTypeFilter} onChange={(event) => setMaterialsTypeFilter(event.target.value)}>
                  {materialsTypeOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>

              <div className="materials-grid">
                {filteredMaterials.map((material) => (
                  <article key={material.id} className="material-item-card">
                    <div className="material-top">
                      <div className="format-badge">{formatAcronym(material.format)}</div>
                      <div>
                        <h4>{material.title}</h4>
                        <p>{material.className} • {material.subject}</p>
                      </div>
                    </div>

                    <div className="meta-row">
                      <span>{material.type}</span>
                      <span>{material.size}</span>
                      <span>Updated: {material.updatedAt}</span>
                      <span className="status-chip live">Published</span>
                    </div>

                    <div className="teacher-row">
                      <img src={material.uploadedBy?.avatar} alt={material.uploadedBy?.name} />
                      <div>
                        <strong>{material.uploadedBy?.name}</strong>
                        <p>{material.uploadedBy?.role || 'Teacher'}</p>
                      </div>
                    </div>

                    {material.fileName && <p className="file-name">{material.fileName}</p>}

                    <div className="material-actions action-grid">
                      <button type="button" className="secondary-btn" onClick={() => downloadMaterial(material)}>Download</button>
                      <button type="button" className="secondary-btn" onClick={() => setMaterialsNotice(`Opened: ${material.title}`)}>Use Material</button>
                    </div>
                  </article>
                ))}

                {filteredMaterials.length === 0 && <p className="empty">No materials match your filter.</p>}
              </div>

              {materialsNotice && <p className="student-online-notice">{materialsNotice}</p>}
            </section>
          </div>
        );
      case 'library':
        return <Library />;
      case 'messages':
        return <Messages />;
      case 'profile':
        return <EditProfile profile={profileForEdit} onSaveProfile={onSaveProfile} />;
      default:
        return (
          <>
            <section className="student-welcome">
              <div>
                <h1>Welcome, {profile?.name || 'Student'}!</h1>
                <p>{profile?.className || 'Student Dashboard'} • Keep up the great work.</p>
              </div>
              <img src={profile?.avatar || 'https://via.placeholder.com/64'} alt="Student avatar" />
            </section>

            <section className="student-stats">
              <article className="student-stat-card">
                <FaBookOpen />
                <div>
                  <h3>7 Subjects</h3>
                  <p>2 with upcoming tests</p>
                </div>
              </article>
              <article className="student-stat-card">
                <FaTasks />
                <div>
                  <h3>4 Assignments</h3>
                  <p>2 due this week</p>
                </div>
              </article>
              <article className="student-stat-card">
                <FaBell />
                <div>
                  <h3>{unreadNotificationCount} New Alerts</h3>
                  <p>Announcements and reminders</p>
                </div>
              </article>
              <article className="student-stat-card">
                <FaChartLine />
                <div>
                  <h3>{averageScore.toFixed(1)} / 20</h3>
                  <p>Current average</p>
                </div>
              </article>
            </section>

            <section className="student-analytics-grid">
              <article className="student-panel">
                <div className="student-panel-head">
                  <h2>Performance by Subject</h2>
                  <p>Visual chart of your marks per subject.</p>
                </div>
                <div className="subject-chart-list">
                  {subjectPerformance.map((item) => (
                    <div key={item.subject} className="subject-chart-row">
                      <div className="subject-chart-head">
                        <span>{item.subject}</span>
                        <strong>{item.score}/20</strong>
                      </div>
                      <div className="subject-chart-track">
                        <div
                          className={`subject-chart-fill ${item.score < 10 ? 'weak' : ''}`}
                          style={{ width: `${(item.score / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="student-panel">
                <div className="student-panel-head">
                  <h2>Sequence Trend</h2>
                  <p>How your average is improving over recent sequences.</p>
                </div>
                <div className="trend-bars">
                  {sequenceTrend.map((item) => (
                    <div key={item.label} className="trend-bar-item">
                      <div className="trend-bar-wrap">
                        <div className="trend-bar-fill" style={{ height: `${(item.value / 20) * 120}px` }} />
                      </div>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="student-insights-grid">
              <article className="student-panel">
                <div className="student-panel-head">
                  <h2>Weak Subjects</h2>
                  <p>Subjects currently below the expected pass mark.</p>
                </div>
                <ul className="weak-subject-list">
                  {weakSubjects.length === 0 && <li>Great work. No weak subjects right now.</li>}
                  {weakSubjects.map((item) => (
                    <li key={item.subject}>
                      <FaExclamationTriangle />
                      <span>{item.subject}</span>
                      <strong>{item.score}/20</strong>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="student-panel">
                <div className="student-panel-head">
                  <h2>Probability of Repeating</h2>
                  <p>Estimated academic risk based on results and weak-subject count.</p>
                </div>
                <div className="repeat-risk-box">
                  <div className="repeat-risk-top">
                    <strong>{repeatProbability}%</strong>
                    <span>{repeatRiskLabel}</span>
                  </div>
                  <div className="repeat-risk-track">
                    <div className="repeat-risk-fill" style={{ width: `${repeatProbability}%` }} />
                  </div>
                  <p>
                    Keep attendance high and improve weak subjects to reduce this probability.
                  </p>
                </div>
              </article>

              <article className="student-panel recent-activity-panel">
                <div className="student-panel-head">
                  <h2>Recent Activities</h2>
                  <p>Your latest actions on the platform.</p>
                </div>
                <ul className="recent-activity-list">
                  {recentActivities.map((activity) => (
                    <li key={activity.id}>
                      <FaHistory />
                      <div>
                        <strong>{activity.title}</strong>
                        <span>{activity.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </section>

            {renderPanel('Today Overview', 'Quick snapshot of your day.', [
              { title: 'First Class', description: 'Mathematics at 8:00 AM', meta: 'Room A2' },
              { title: 'Next Assignment', description: 'Chemistry Worksheet due tomorrow', meta: 'Upload before 11:59 PM' },
              { title: 'Attendance', description: 'Present for all classes this week', meta: '100% this week' }
            ])}
          </>
        );
    }
  };

  return (
    <div className="dashboard-container student-dashboard-container">
      <StudentSidebar
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
        onNotificationSelect={handleNotificationSelect}
        onMarkAllNotificationsRead={markAllNotificationsAsRead}
        onViewAllNotifications={() => setActiveView('announcements')}
      />

      <main className="student-dashboard-main">
        {renderMain()}
      </main>

      <footer className="dashboard-footer">
        <a
          href="https://www.youtube.com/results?search_query=how+to+use+student+dashboard"
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

export default StudentDashboard;
