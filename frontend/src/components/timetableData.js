export const TIMETABLE_STORAGE_KEY = 'eduignite.timetableEntries';
export const TIMETABLE_UPDATED_EVENT = 'eduignite:timetable-updated';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_TIMETABLE_ENTRIES = [
  {
    id: 1,
    audienceType: 'class',
    day: 'Monday',
    period: '08:00 - 09:00',
    className: 'Grade 5',
    section: 'English School',
    subject: 'Mathematics',
    teacher: 'John Smith',
    room: 'Primary Block A • Room 12'
  },
  {
    id: 2,
    audienceType: 'class',
    day: 'Tuesday',
    period: '09:00 - 10:00',
    className: 'Grade 6',
    section: 'English School',
    subject: 'Integrated Science',
    teacher: 'Peter Nsom',
    room: 'Primary Block A • Room 18'
  },
  {
    id: 3,
    audienceType: 'personal',
    day: 'Wednesday',
    period: '13:30 - 14:30',
    staffName: 'Grace Librarian',
    staffRole: 'Staff',
    activity: 'Library Catalog Review',
    room: 'Library Office'
  }
];

const normalizeText = (value, fallback = '') => String(value || fallback).trim();

const ensureAudienceType = (value) => {
  const normalized = normalizeText(value, 'class').toLowerCase();
  return normalized === 'personal' ? 'personal' : 'class';
};

const normalizeDay = (value) => {
  const normalized = normalizeText(value, 'Monday');
  return WEEK_DAYS.includes(normalized) ? normalized : 'Monday';
};

const normalizeRole = (value) => {
  const role = normalizeText(value, 'Staff').toLowerCase();
  if (role === 'teacher') return 'Teacher';
  return 'Staff';
};

const normalizeTimetableEntry = (entry = {}) => {
  const audienceType = ensureAudienceType(entry.audienceType);
  const base = {
    id: Number(entry.id) || Date.now(),
    audienceType,
    day: normalizeDay(entry.day),
    period: normalizeText(entry.period, '08:00 - 09:00'),
    room: normalizeText(entry.room, '')
  };

  if (audienceType === 'class') {
    return {
      ...base,
      className: normalizeText(entry.className, ''),
      section: normalizeText(entry.section, ''),
      subject: normalizeText(entry.subject, ''),
      teacher: normalizeText(entry.teacher, '')
    };
  }

  return {
    ...base,
    staffName: normalizeText(entry.staffName, ''),
    staffRole: normalizeRole(entry.staffRole),
    activity: normalizeText(entry.activity || entry.subject, '')
  };
};

const sortEntries = (entries = []) => {
  const dayIndex = new Map(WEEK_DAYS.map((day, index) => [day, index]));
  return [...entries].sort((left, right) => {
    const dayDelta = (dayIndex.get(left.day) || 99) - (dayIndex.get(right.day) || 99);
    if (dayDelta !== 0) return dayDelta;
    return String(left.period || '').localeCompare(String(right.period || ''));
  });
};

export const getDefaultTimetableEntries = () => DEFAULT_TIMETABLE_ENTRIES.map((item) => normalizeTimetableEntry(item));

export const getTimetableEntries = () => {
  if (typeof window === 'undefined') {
    return getDefaultTimetableEntries();
  }

  const raw = window.localStorage.getItem(TIMETABLE_STORAGE_KEY);
  if (!raw) {
    return getDefaultTimetableEntries();
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return getDefaultTimetableEntries();
    }

    const normalized = parsed
      .map((item) => normalizeTimetableEntry(item))
      .filter((item) => (item.audienceType === 'class' ? item.className : item.staffName));

    return normalized.length ? normalized : getDefaultTimetableEntries();
  } catch (error) {
    return getDefaultTimetableEntries();
  }
};

export const saveTimetableEntries = (entries = []) => {
  const normalized = Array.isArray(entries)
    ? entries
      .map((item) => normalizeTimetableEntry(item))
      .filter((item) => (item.audienceType === 'class' ? item.className : item.staffName))
    : [];

  const sorted = sortEntries(normalized);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(sorted));
    window.dispatchEvent(new CustomEvent(TIMETABLE_UPDATED_EVENT, { detail: sorted }));
  }

  return sorted;
};

export const getClassTimetable = ({ className, section } = {}) => {
  const targetClass = normalizeText(className).toLowerCase();
  const targetSection = normalizeText(section).toLowerCase();

  return sortEntries(
    getTimetableEntries().filter((item) => (
      item.audienceType === 'class'
      && String(item.className || '').toLowerCase() === targetClass
      && (!targetSection || String(item.section || '').toLowerCase() === targetSection)
    ))
  );
};

export const getPersonalTimetable = ({ name, role } = {}) => {
  const targetName = normalizeText(name).toLowerCase();
  const normalizedRole = normalizeRole(role).toLowerCase();

  return sortEntries(
    getTimetableEntries().filter((item) => (
      item.audienceType === 'personal'
      && String(item.staffName || '').toLowerCase() === targetName
      && (!normalizedRole || String(item.staffRole || '').toLowerCase() === normalizedRole)
    ))
  );
};

export const groupTimetableByDay = (entries = []) => {
  return WEEK_DAYS.map((day) => ({
    day,
    sessions: entries.filter((item) => item.day === day)
  }));
};

export const TIMETABLE_DAYS = WEEK_DAYS;
