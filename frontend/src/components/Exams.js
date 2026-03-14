import React, { useState } from 'react';
import './MyClasses.css';
import ExamDetail from './ExamDetail';

const sampleExams = [
  { id: 1, title: 'Grade 5 Math Test', subject: 'Math', due: '2026-03-10', status: 'Pending' },
  { id: 2, title: 'Grade 6 English Quiz', subject: 'English', due: '2026-03-12', status: 'Submitted' },
  { id: 3, title: 'Grade 7 Science Exam', subject: 'Science', due: '2026-03-15', status: 'Pending' },
  { id: 4, title: 'Grade 5 History Test', subject: 'History', due: '2026-03-18', status: 'Pending' },
  { id: 5, title: 'Grade 6 Math Mid-Term', subject: 'Math', due: '2026-03-20', status: 'Pending' },
  { id: 6, title: 'Grade 7 English Final', subject: 'English', due: '2026-03-22', status: 'Pending' },
  { id: 7, title: 'Grade 5 Science Quiz', subject: 'Science', due: '2026-03-25', status: 'Pending' },
  { id: 8, title: 'Grade 6 History Test', subject: 'History', due: '2026-03-28', status: 'Pending' },
];

const Exams = () => {
  const [selectedExam, setSelectedExam] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const totalPages = Math.ceil(sampleExams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedExams = sampleExams.slice(startIndex, endIndex);

  const handleGradeExam = (exam) => {
    setSelectedExam(exam);
  };

  const handleBack = () => {
    setSelectedExam(null);
  };

  if (selectedExam) {
    return <ExamDetail examInfo={selectedExam} onClose={handleBack} />;
  }

  return (
    <div className="myclasses-root">
      <div className="mc-top">
        <h2>Exams to Grade</h2>
        <div className="mc-search">
          <input placeholder="Search exams..." />
        </div>
      </div>

      <div className="classes-grid">
        {displayedExams.map((exam, idx) => (
          <div className="class-box" key={exam.id}>
            <div className={`class-top color-${((startIndex + idx) % 8) + 1}`} />
            <div className="class-body">
              <h3>{exam.title}</h3>
              <p className="count">Due: {exam.due}</p>
              <div className="sub">{exam.subject}</div>
              <button className="manage" onClick={() => handleGradeExam(exam)}>Grade</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mc-footer">
        <div>Showing {Math.min(startIndex + 1, sampleExams.length)} to {Math.min(endIndex, sampleExams.length)} of {sampleExams.length} entries</div>
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

export default Exams;
