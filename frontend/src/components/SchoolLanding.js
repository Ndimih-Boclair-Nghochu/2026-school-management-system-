import React, { useEffect, useMemo, useState } from 'react';
import './SchoolLanding.css';
import { useSchoolConfig } from './schoolConfig';

const SchoolLanding = ({
  profile,
  canOpenDashboard = true,
  dashboardBlockedReason = '',
  onOpenDashboard = () => {},
  onLogout = () => {}
}) => {
  const schoolConfig = useSchoolConfig();
  const slides = useMemo(() => schoolConfig.landingSlides || [], [schoolConfig.landingSlides]);

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!slides.length) return undefined;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [slides.length]);

  const dashboardLabel = canOpenDashboard ? 'Go to your dashboard' : 'Dashboard Locked (Platform Fee Pending)';

  const userName = profile?.name || 'User';

  return (
    <div className="school-landing-root">
      <div className="school-landing-card">
        <div className="school-landing-slide" style={{ backgroundImage: `url(${slides[activeSlide]?.image || ''})` }}>
          <div className="school-landing-overlay" />

          <div className="school-landing-content">
            <div className="school-landing-logo-wrap">
              <img src={schoolConfig.logoUrl} alt="School logo" className="school-landing-logo" />
              <h1>{schoolConfig.shortName}</h1>
              <p>{schoolConfig.systemTitle}</p>
            </div>

            <div className="school-landing-copy-wrap">
              <h2>{slides[activeSlide]?.title || 'Welcome'}</h2>
              <p>{slides[activeSlide]?.subtitle || ''}</p>
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
          <button type="button" className="dashboard-link-btn" onClick={onOpenDashboard} disabled={!canOpenDashboard}>
            {dashboardLabel}
          </button>
          <button type="button" className="dashboard-link-btn secondary" onClick={onLogout}>
            Logout
          </button>
        </div>

        {!canOpenDashboard && dashboardBlockedReason && (
          <p className="school-landing-lock-note">{dashboardBlockedReason}</p>
        )}

        <p className="school-landing-note">{schoolConfig.landingNote}</p>
      </div>
    </div>
  );
};

export default SchoolLanding;