import React, { useState } from 'react';
import './Attendance.css';

const sampleStudents = Array.from({ length: 11 }).map((_, i) => ({
  id: i + 1,
  name: ['Emma Brown','Lily Chen','Noah Johnson','Aiden Martinez','Michael Wilson','Sophia Adams','Lucas Kim','Chloe Harris','Abigail Turner','Ethan White','Olivia Lee'][i % 11],
  studentId: `STU9${850 + i}`,
  coefficient: 1 + (i % 4),
  status: 'present'
}));

const subjects = ['Science', 'Math', 'English', 'History'];

const terms = [
  { id: 1, name: 'Term 1', sequences: ['Sequence 1', 'Sequence 2'] },
  { id: 2, name: 'Term 2', sequences: ['Sequence 1', 'Sequence 2'] },
  { id: 3, name: 'Term 3', sequences: ['Sequence 1', 'Sequence 2'] }
];

const AttendanceDetail = ({ classInfo = { title: 'Grade 5', students: 39 }, onClose = () => {} }) => {
  const [students, setStudents] = useState(sampleStudents);
  const [selectedSubject, setSelectedSubject] = useState(classInfo.sub || 'Science');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedSequence, setSelectedSequence] = useState('Sequence 1');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const setStatus = (id, status) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const save = () => {
    const attendance = {
      class: classInfo.title,
      subject: selectedSubject,
      date: new Date().toLocaleDateString(),
      students: students
    };
    console.log('Saved attendance:', attendance);
    alert(`Attendance saved for ${classInfo.title} - ${selectedSubject}`);
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const lateCount = students.filter(s => s.status === 'late').length;

  return (
    <div className="attendance-detail-root">
      <div className="ad-header">
        <div className="ad-title">
          <div className="ad-class-icon">A+</div>
          <div>
            <h2>{classInfo.title}</h2>
            <div className="ad-meta">{classInfo.students} Students &nbsp; • &nbsp; 17 Boys • 22 Girls</div>
          </div>
        </div>
        <div className="ad-actions">
          <button className="back-link" onClick={onClose}>← Back</button>
          <button className="save-btn" onClick={save}>✓ Save Attendance</button>
        </div>
      </div>

      <div className="ad-subject-section">
        <label>Subject:</label>
        <select className="subject-dropdown" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
          {subjects.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
        <label style={{ marginLeft: '20px' }}>Term:</label>
        <select className="subject-dropdown" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
          {terms.map(term => (
            <option key={term.id} value={term.name}>{term.name}</option>
          ))}
        </select>
        <label style={{ marginLeft: '20px' }}>Sequence:</label>
        <select className="subject-dropdown" value={selectedSequence} onChange={(e) => setSelectedSequence(e.target.value)}>
          {terms.find(t => t.name === selectedTerm)?.sequences.map(seq => (
            <option key={seq} value={seq}>{seq}</option>
          ))}
        </select>
      </div>

      <div className="ad-controls">
        <div className="date-picker">Wednesday, April 24, 2024</div>
        <div className="legend">
          <span className="stat">Present <strong>{presentCount}</strong></span>
          <span className="stat">Absent <strong>{absentCount}</strong></span>
          <span className="stat">Late <strong>{lateCount}</strong></span>
        </div>
      </div>

      <table className="ad-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {students.map((s, idx) => (
            <tr key={s.id}>
              <td>{idx + 1}</td>
              <td className="name-col">
                <div className="avatar">{s.name.split(' ')[0][0]}</div>
                <div>
                  <div className="student-name">{s.name}</div>
                  <div className="student-sub">{s.studentId}</div>
                </div>
              </td>
              <td>
                <div className="status-buttons">
                  <button className={`status present ${s.status==='present'?'active':''}`} onClick={() => setStatus(s.id,'present')}>✓ Present</button>
                  <button className={`status absent ${s.status==='absent'?'active':''}`} onClick={() => setStatus(s.id,'absent')}>✗ Absent</button>
                  <button className={`status late ${s.status==='late'?'active':''}`} onClick={() => setStatus(s.id,'late')}>⏱ Late</button>
                </div>
              </td>
              <td>
                <button className="view-btn" onClick={() => setSelectedStudent(s)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedStudent && (
        <div className="student-preview">
          <div className="student-preview-top">
            <h3>Student Details</h3>
            <button className="close-preview" onClick={() => setSelectedStudent(null)}>Close</button>
          </div>
          <div className="student-preview-grid">
            <div><strong>Name:</strong> {selectedStudent.name}</div>
            <div><strong>ID:</strong> {selectedStudent.studentId}</div>
            <div><strong>Subject:</strong> {selectedSubject}</div>
            <div><strong>Term / Sequence:</strong> {selectedTerm} - {selectedSequence}</div>
            <div><strong>Status:</strong> {selectedStudent.status}</div>
            <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      )}

      <div className="ad-footer">
        Showing 1 to {students.length} of {students.length} entries
        <div className="ad-pagination">
          <button className="nav-btn" disabled>Previous</button>
          <button className="page active">1</button>
          <button className="nav-btn" disabled>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetail;
