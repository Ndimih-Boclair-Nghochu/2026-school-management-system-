import React, { useState } from 'react';
import './MyClasses.css';

const sampleClasses = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  title: `Grade ${i + 1}`,
  students: 25 + ((i * 3) % 15),
  sub: i % 2 === 0 ? `Grade ${i + 1} Science` : `Grade ${i + 1} Math`,
}));

const getUniqueSubjects = () => {
  const subjects = [...new Set(sampleClasses.map(c => c.sub))];
  return subjects;
};

const getClassesBySubject = (subject) => {
  return sampleClasses.filter(c => c.sub === subject);
};

const MyClasses = ({ onManageClass = () => {} }) => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const subjects = getUniqueSubjects();
  const allClassesToDisplay = selectedSubject ? getClassesBySubject(selectedSubject) : [];

  // Calculate pagination
  const totalItems = selectedSubject ? allClassesToDisplay.length : subjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const displayedItems = selectedSubject
    ? allClassesToDisplay.slice(startIndex, endIndex)
    : subjects.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handlePageClick = (pageNum) => {
    setCurrentPage(pageNum);
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setCurrentPage(1);
  };

  return (
    <div className="myclasses-root">
      <div className="mc-top">
        <h2>{selectedSubject ? selectedSubject : 'My Classes'}</h2>
        <div className="mc-search">
          <input placeholder="Search classes..." />
        </div>
      </div>

      {selectedSubject && (
        <button className="back-button" onClick={() => {
          setSelectedSubject(null);
          setCurrentPage(1);
        }}>
          ← Back to Subjects
        </button>
      )}

      {!selectedSubject ? (
        // Display Subjects
        <div className="classes-grid">
          {displayedItems.map((subject, idx) => (
            <div
              className="class-box subject-box"
              key={subject}
              onClick={() => handleSubjectSelect(subject)}
            >
              <div className={`class-top color-${(idx % 8) + 1}`} />
              <div className="class-body">
                <h3>{subject}</h3>
                <p className="count">
                  {sampleClasses.filter(c => c.sub === subject).length} classes
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Display Classes for Selected Subject
        <div className="classes-grid">
          {displayedItems.map((c, idx) => (
            <div className="class-box" key={c.id}>
              <div className={`class-top color-${(idx % 8) + 1}`} />
              <div className="class-body">
                <h3>{c.title}</h3>
                <p className="count">{c.students} students</p>
                <div className="sub">{c.sub}</div>
                <button className="manage" onClick={() => onManageClass(c)}>
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mc-footer">
        <div>
          Showing {Math.min(startIndex + 1, totalItems)} to {Math.min(endIndex, totalItems)} of {totalItems} entries
        </div>
        <div className="pagination">
          <button
            className="nav-btn"
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              className={`page ${pageNum === currentPage ? 'active' : ''}`}
              onClick={() => handlePageClick(pageNum)}
            >
              {pageNum}
            </button>
          ))}
          <button
            className="nav-btn"
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyClasses;
