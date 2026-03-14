import { useEffect, useState } from 'react';

export const SCHOOL_CONFIG_STORAGE_KEY = 'eduignite.schoolConfig';
export const SCHOOL_CONFIG_UPDATED_EVENT = 'eduignite:school-config-updated';

const DEFAULT_LANDING_SLIDES = [
  {
    id: 'identity',
    title: 'Welcome to EduIgnite School Portal',
    subtitle: 'Empowering learning communities with one connected school dashboard.',
    image: '/assets/image.png'
  },
  {
    id: 'motto',
    title: 'School Motto: Learn • Lead • Serve',
    subtitle: 'Every student and staff member works with purpose, discipline, and excellence.',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'community',
    title: 'A Connected School Community',
    subtitle: 'Announcements, classes, exams, and attendance all in one trusted platform.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'vision',
    title: 'Our Vision for 2026 and Beyond',
    subtitle: 'Building future-ready learners through technology, values, and innovation.',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80'
  }
];

const DEFAULT_ACADEMIC_STRUCTURE = [
  { name: 'Term 1', sequenceCount: 2 },
  { name: 'Term 2', sequenceCount: 2 },
  { name: 'Term 3', sequenceCount: 2 }
];

const DEFAULT_SECTIONS = ['English School', 'French School', 'Technical School'];

const buildSequenceLabels = (count) => Array.from(
  { length: Math.max(1, Number(count) || 1) },
  (_, index) => `Sequence ${index + 1}`
);

export const DEFAULT_SCHOOL_CONFIG = {
  schoolName: 'EduIgnite International School',
  shortName: 'EduIgnite',
  schoolCode: 'EIMS-MAIN',
  city: 'Douala',
  principal: 'Dr. Ndi',
  currentSession: '2025 / 2026',
  currentTerm: 'Term 2',
  status: 'Active',
  logoUrl: '/assets/image.png',
  systemTitle: 'School Management System',
  motto: 'Learn • Lead • Serve',
  about: 'A connected school community focused on excellence, values and innovation.',
  contactEmail: 'info@eduignite.edu',
  contactPhone: '+237 677 000 000',
  address: 'Douala, Cameroon',
  landingNote: 'Continue to your school dashboard to manage your daily activities.',
  landingSlides: DEFAULT_LANDING_SLIDES,
  academicStructure: DEFAULT_ACADEMIC_STRUCTURE,
  sections: DEFAULT_SECTIONS
};

const normalizeSlides = (slides) => {
  if (!Array.isArray(slides) || !slides.length) {
    return DEFAULT_LANDING_SLIDES;
  }

  return DEFAULT_LANDING_SLIDES.map((defaultSlide, index) => {
    const candidate = slides[index] || {};
    return {
      id: defaultSlide.id,
      title: candidate.title || defaultSlide.title,
      subtitle: candidate.subtitle || defaultSlide.subtitle,
      image: candidate.image || defaultSlide.image
    };
  });
};

const normalizeAcademicStructure = (structure) => {
  if (!Array.isArray(structure) || !structure.length) {
    return DEFAULT_ACADEMIC_STRUCTURE;
  }

  return structure.map((item, index) => ({
    name: (item?.name || `Term ${index + 1}`).trim() || `Term ${index + 1}`,
    sequenceCount: Math.min(10, Math.max(1, Number(item?.sequenceCount) || 1))
  }));
};

const normalizeSections = (sections) => {
  if (!Array.isArray(sections)) {
    return DEFAULT_SECTIONS;
  }

  const cleaned = sections
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 20);

  return cleaned.length ? Array.from(new Set(cleaned)) : DEFAULT_SECTIONS;
};

export const normalizeSchoolConfig = (input = {}) => ({
  ...DEFAULT_SCHOOL_CONFIG,
  ...input,
  landingSlides: normalizeSlides(input.landingSlides || DEFAULT_SCHOOL_CONFIG.landingSlides),
  academicStructure: normalizeAcademicStructure(input.academicStructure || DEFAULT_SCHOOL_CONFIG.academicStructure),
  sections: normalizeSections(input.sections || DEFAULT_SCHOOL_CONFIG.sections)
});

export const getAcademicTermStructure = (config = DEFAULT_SCHOOL_CONFIG) => {
  const normalized = normalizeSchoolConfig(config);
  return normalized.academicStructure.map((term, index) => ({
    id: index + 1,
    name: term.name,
    sequences: buildSequenceLabels(term.sequenceCount)
  }));
};

export const getSchoolConfig = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_SCHOOL_CONFIG;
  }

  const raw = window.localStorage.getItem(SCHOOL_CONFIG_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SCHOOL_CONFIG;
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeSchoolConfig(parsed);
  } catch (error) {
    return DEFAULT_SCHOOL_CONFIG;
  }
};

export const saveSchoolConfig = (config) => {
  const normalized = normalizeSchoolConfig(config);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SCHOOL_CONFIG_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(SCHOOL_CONFIG_UPDATED_EVENT, { detail: normalized }));
  }

  return normalized;
};

export const resetSchoolConfig = () => saveSchoolConfig(DEFAULT_SCHOOL_CONFIG);

export const useSchoolConfig = () => {
  const [schoolConfig, setSchoolConfig] = useState(getSchoolConfig());

  useEffect(() => {
    const handleUpdate = (event) => {
      if (event?.detail) {
        setSchoolConfig(normalizeSchoolConfig(event.detail));
        return;
      }
      setSchoolConfig(getSchoolConfig());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(SCHOOL_CONFIG_UPDATED_EVENT, handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SCHOOL_CONFIG_UPDATED_EVENT, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, []);

  return schoolConfig;
};
