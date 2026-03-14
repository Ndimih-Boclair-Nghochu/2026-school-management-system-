import React, { useState } from 'react';
import './MyClasses.css';
import AttendanceDetail from './AttendanceDetail';

const sampleClasses = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  title: `Grade ${i + 1}`,
  students: 25 + ((i * 3) % 15),
  sub: i % 2 === 0 ? `Grade ${i + 1} Science` : `Grade ${i + 1} Math`,
}));

const Attendance = ({ onMarkAttendance = () => {} }) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const totalPages = Math.ceil(sampleClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedClasses = sampleClasses.slice(startIndex, endIndex);

  const handleMark = (classInfo) => {
    setSelectedClass(classInfo);
  };

  const handleBack = () => {
    setSelectedClass(null);
  };

  if (selectedClass) {
    return <AttendanceDetail classInfo={selectedClass} onClose={handleBack} />;
  }

  return (
    <div className="myclasses-root">
      <div className="mc-top">
        <h2>Attendance</h2>
        <div className="mc-search">
          <input placeholder="Search classes..." />
        </div>
      </div>

      <div className="classes-grid">
        {displayedClasses.map((c, idx) => (
          <div className="class-box" key={c.id}>
            <div className={`class-top color-${((startIndex + idx) % 8) + 1}`} />
            <div className="class-body">
              <h3>{c.title}</h3>
              <p className="count">{c.students} students</p>
              <div className="sub">{c.sub}</div>
              <button className="manage" onClick={() => handleMark(c)}>Mark</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mc-footer">
        <div>Showing {Math.min(startIndex + 1, sampleClasses.length)} to {Math.min(endIndex, sampleClasses.length)} of {sampleClasses.length} entries</div>
        <div className="pagination">
          <button 
            className="nav-btn" 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button 
              key={pageNum} 
              className={`page ${pageNum === currentPage ? 'active' : ''}`}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}
          <button 
            className="nav-btn" 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
