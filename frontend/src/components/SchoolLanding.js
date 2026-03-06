import React, { useEffect, useMemo, useState } from 'react';
import './SchoolLanding.css';

const SCHOOL_LOGO = '/assets/image.png';

const SchoolLanding = ({ profile, role = 'teacher', onOpenDashboard = () => {}, onLogout = () => {} }) => {
  const slides = useMemo(() => ([
    {
      id: 'identity',
      title: 'Welcome to EduIgnite School Portal',
      subtitle: 'Empowering learning communities with one connected school dashboard.',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=80'
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
  ]), []);

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [slides.length]);

  const dashboardLabel = 'Go to your dashboard';

  const userName = profile?.name || 'User';

  return (
    <div className="school-landing-root">
      <div className="school-landing-card">
        <div className="school-landing-slide" style={{ backgroundImage: `url(${slides[activeSlide].image})` }}>
          <div className="school-landing-overlay" />

          <div className="school-landing-content">
            <div className="school-landing-logo-wrap">
              <img src={SCHOOL_LOGO} alt="School logo" className="school-landing-logo" />
              <h1>EduIgnite</h1>
              <p>School Management System</p>
            </div>

            <div className="school-landing-copy-wrap">
              <h2>{slides[activeSlide].title}</h2>
              <p>{slides[activeSlide].subtitle}</p>
              <span className="school-landing-welcome">Hello, {userName}</span>
            </div>
          </div>
        </div>

        <div className="school-landing-dots" aria-label="School slides">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === activeSlide ? 'active' : ''}
              onClick={() => setActiveSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <p className="school-landing-step">Slide {activeSlide + 1} of {slides.length}</p>

        <div className="school-landing-links">
          <button type="button" className="dashboard-link-btn" onClick={onOpenDashboard}>
            {dashboardLabel}
          </button>
          <button type="button" className="dashboard-link-btn secondary" onClick={onLogout}>
            Logout
          </button>
        </div>

        <p className="school-landing-note">Continue to your school dashboard to manage your daily activities.</p>
      </div>
    </div>
  );
};

export default SchoolLanding;