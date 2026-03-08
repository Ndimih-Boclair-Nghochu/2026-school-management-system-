export const REPORT_CARD_PUBLICATIONS_STORAGE_KEY = 'eduignite.reportCardPublications';
export const REPORT_CARD_PUBLISHED_EVENT = 'eduignite:report-cards-published';

const normalizeText = (value, fallback = '') => String(value || fallback).trim();

const normalizeSubject = (subject = {}) => ({
  subject: normalizeText(subject.subject, 'General Assessment'),
  score: Number(subject.score || 0),
  grade: normalizeText(subject.grade, ''),
  coefficient: Number(subject.coefficient || 1)
});

const normalizeReportCard = (item = {}) => ({
  id: Number(item.id) || Date.now(),
  studentId: Number(item.studentId) || null,
  studentName: normalizeText(item.studentName, 'Student'),
  matricule: normalizeText(item.matricule, ''),
  parentName: normalizeText(item.parentName, ''),
  className: normalizeText(item.className, ''),
  section: normalizeText(item.section, ''),
  academicYear: normalizeText(item.academicYear, ''),
  term: normalizeText(item.term, ''),
  sequence: normalizeText(item.sequence, ''),
  average: Number(item.average || 0),
  grade: normalizeText(item.grade, ''),
  band: normalizeText(item.band, ''),
  rank: Number(item.rank || 0),
  classSize: Number(item.classSize || 0),
  attendance: Number(item.attendance || 0),
  classTeacher: normalizeText(item.classTeacher, ''),
  publishedAt: normalizeText(item.publishedAt, new Date().toISOString().slice(0, 10)),
  publishedBy: normalizeText(item.publishedBy, 'Admin'),
  subjects: Array.isArray(item.subjects)
    ? item.subjects.map((subject) => normalizeSubject(subject))
    : []
});

const byPublishedDateDesc = (left, right) => {
  const leftDate = new Date(left.publishedAt || 0).getTime();
  const rightDate = new Date(right.publishedAt || 0).getTime();
  return rightDate - leftDate;
};

export const getPublishedReportCards = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(REPORT_CARD_PUBLICATIONS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeReportCard(item))
      .filter((item) => item.studentName)
      .sort(byPublishedDateDesc);
  } catch (error) {
    return [];
  }
};

export const savePublishedReportCards = (records = []) => {
  const normalized = Array.isArray(records)
    ? records
      .map((item) => normalizeReportCard(item))
      .filter((item) => item.studentName)
      .sort(byPublishedDateDesc)
    : [];

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(REPORT_CARD_PUBLICATIONS_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(REPORT_CARD_PUBLISHED_EVENT, { detail: normalized }));
  }

  return normalized;
};

export const publishReportCards = (records = []) => {
  const incoming = Array.isArray(records)
    ? records.map((item) => normalizeReportCard(item)).filter((item) => item.studentName)
    : [];

  if (!incoming.length) {
    return getPublishedReportCards();
  }

  const existing = getPublishedReportCards();
  const lookup = new Map();

  existing.forEach((item) => {
    const key = `${item.studentName.toLowerCase()}__${item.academicYear.toLowerCase()}__${item.term.toLowerCase()}__${item.sequence.toLowerCase()}`;
    lookup.set(key, item);
  });

  incoming.forEach((item) => {
    const key = `${item.studentName.toLowerCase()}__${item.academicYear.toLowerCase()}__${item.term.toLowerCase()}__${item.sequence.toLowerCase()}`;
    lookup.set(key, item);
  });

  return savePublishedReportCards(Array.from(lookup.values()));
};
