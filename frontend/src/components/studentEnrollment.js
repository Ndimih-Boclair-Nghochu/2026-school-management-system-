export const STUDENT_ENROLLMENT_STORAGE_KEY = 'eduignite.studentEnrollments';
export const STUDENT_ENROLLMENT_UPDATED_EVENT = 'eduignite:student-enrollments-updated';

const normalizeText = (value, fallback = '') => String(value || fallback).trim();

const buildCode = (value, max = 4) => {
  const clean = normalizeText(value)
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (!clean.length) {
    return 'GEN';
  }

  const initials = clean.map((part) => part[0]).join('').toUpperCase();
  return initials.slice(0, max) || clean.join('').slice(0, max).toUpperCase();
};

const normalizeEnrollment = (entry = {}) => ({
  matricule: normalizeText(entry.matricule),
  name: normalizeText(entry.name, 'Student'),
  className: normalizeText(entry.className, 'Grade 1'),
  subSchool: normalizeText(entry.subSchool || entry.section, 'General School'),
  parent: normalizeText(entry.parent, 'N/A'),
  gender: normalizeText(entry.gender, 'Not Specified'),
  dateOfBirth: normalizeText(entry.dateOfBirth, ''),
  guardianPhone: normalizeText(entry.guardianPhone || entry.phone, ''),
  address: normalizeText(entry.address, ''),
  schoolCode: normalizeText(entry.schoolCode, 'SCHOOL'),
  platformFeePaid: Boolean(entry.platformFeePaid),
  accountCreated: Boolean(entry.accountCreated),
  password: normalizeText(entry.password, ''),
  enrolledAt: normalizeText(entry.enrolledAt, new Date().toISOString())
});

export const getStudentEnrollments = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(STUDENT_ENROLLMENT_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeEnrollment).filter((item) => item.matricule);
  } catch (error) {
    return [];
  }
};

export const saveStudentEnrollments = (records) => {
  const normalized = Array.isArray(records)
    ? records.map(normalizeEnrollment).filter((item) => item.matricule)
    : [];

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STUDENT_ENROLLMENT_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(STUDENT_ENROLLMENT_UPDATED_EVENT, { detail: normalized }));
  }

  return normalized;
};

export const getStudentEnrollmentByMatricule = (matricule) => {
  const target = normalizeText(matricule).toUpperCase();
  if (!target) {
    return null;
  }
  return getStudentEnrollments().find((item) => item.matricule.toUpperCase() === target) || null;
};

export const generateStudentMatricule = ({ schoolCode, studentName, subSchool }, existing = []) => {
  const schoolPart = buildCode(schoolCode || 'SCHOOL', 6);
  const namePart = buildCode(studentName || 'STUDENT', 5);
  const subSchoolPart = buildCode(subSchool || 'GENERAL', 4);
  const prefix = `${schoolPart}-${namePart}-${subSchoolPart}`;

  const used = existing
    .map((item) => String(item.matricule || ''))
    .filter((value) => value.startsWith(prefix));

  const sequence = String(used.length + 1).padStart(3, '0');
  return `${prefix}-${sequence}`;
};

export const enrollStudentRecord = ({ schoolCode, name, className, subSchool, parent, gender, dateOfBirth, guardianPhone, address }) => {
  const records = getStudentEnrollments();
  const matricule = generateStudentMatricule(
    { schoolCode, studentName: name, subSchool },
    records
  );

  const entry = normalizeEnrollment({
    matricule,
    name,
    className,
    subSchool,
    parent,
    gender,
    dateOfBirth,
    guardianPhone,
    address,
    schoolCode,
    platformFeePaid: false,
    accountCreated: false,
    password: '',
    enrolledAt: new Date().toISOString()
  });

  saveStudentEnrollments([entry, ...records]);
  return entry;
};

export const updateStudentPlatformFee = (matricule, paid) => {
  const records = getStudentEnrollments();
  const normalizedMatricule = normalizeText(matricule).toUpperCase();

  const next = records.map((item) => (
    item.matricule.toUpperCase() === normalizedMatricule
      ? { ...item, platformFeePaid: Boolean(paid) }
      : item
  ));

  saveStudentEnrollments(next);
  return next.find((item) => item.matricule.toUpperCase() === normalizedMatricule) || null;
};

export const updateStudentEnrollmentByMatricule = (matricule, updates = {}) => {
  const records = getStudentEnrollments();
  const normalizedMatricule = normalizeText(matricule).toUpperCase();

  let updatedRecord = null;

  const next = records.map((item) => {
    if (item.matricule.toUpperCase() !== normalizedMatricule) {
      return item;
    }

    updatedRecord = normalizeEnrollment({
      ...item,
      ...updates,
      matricule: item.matricule
    });

    return updatedRecord;
  });

  if (!updatedRecord) {
    return null;
  }

  saveStudentEnrollments(next);
  return updatedRecord;
};

export const createStudentAccountFromMatricule = (matricule, password) => {
  const normalizedMatricule = normalizeText(matricule).toUpperCase();
  const safePassword = normalizeText(password);
  if (!normalizedMatricule || !safePassword) {
    return { success: false, message: 'Matricule and password are required.' };
  }

  const records = getStudentEnrollments();
  const enrollment = records.find((item) => item.matricule.toUpperCase() === normalizedMatricule);

  if (!enrollment) {
    return { success: false, message: 'No enrolled student found for this matricule.' };
  }

  if (enrollment.accountCreated) {
    return { success: false, message: 'Student account already exists for this matricule.' };
  }

  const next = records.map((item) => (
    item.matricule.toUpperCase() === normalizedMatricule
      ? { ...item, accountCreated: true, password: safePassword }
      : item
  ));

  saveStudentEnrollments(next);

  return {
    success: true,
    message: enrollment.platformFeePaid
      ? 'Student account created successfully. You can login now.'
      : 'Student account created. Dashboard access stays locked until platform fee is paid.',
    enrollment: next.find((item) => item.matricule.toUpperCase() === normalizedMatricule)
  };
};
