import React, { useState } from 'react';
import './ExamDetail.css';

const sampleStudents = Array.from({ length: 11 }).map((_, i) => ({
  id: i + 1,
  name: ['Emma Brown','Lily Chen','Noah Johnson','Aiden Martinez','Michael Wilson','Sophia Adams','Lucas Kim','Chloe Harris','Abigail Turner','Ethan White','Olivia Lee'][i % 11],
  studentId: `STU9${850 + i}`,
  coefficient: 1 + (i % 4),
  marks: Math.floor(Math.random() * 100)
}));

const subjects = ['Science', 'Math', 'English', 'History'];

const terms = [
  { id: 1, name: 'Term 1', sequences: ['Sequence 1', 'Sequence 2'] },
  { id: 2, name: 'Term 2', sequences: ['Sequence 1', 'Sequence 2'] },
  { id: 3, name: 'Term 3', sequences: ['Sequence 1', 'Sequence 2'] }
];

const ExamDetail = ({ examInfo = { title: 'Grade 5 Math Test', subject: 'Math' }, onClose = () => {} }) => {
  const [students, setStudents] = useState(sampleStudents);
  const [selectedSubject, setSelectedSubject] = useState(examInfo.subject || 'Math');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedSequence, setSelectedSequence] = useState('Sequence 1');

  const updateMarks = (id, marks) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, marks: Math.max(0, marks) } : s));
  };

  const save = () => {
    const exams = {
      exam: examInfo.title,
      subject: selectedSubject,
      term: selectedTerm,
      sequence: selectedSequence,
      date: new Date().toLocaleDateString(),
      students: students.map((student) => ({
        ...student,
        total: student.marks * student.coefficient
      }))
    };
    console.log('Saved exam results:', exams);
    alert(`Exam results saved for ${examInfo.title}`);
  };

  const averageMarks = (students.reduce((acc, s) => acc + (s.marks || 0), 0) / students.length).toFixed(1);

  return (
    <div className="exam-detail-root">
      <div className="exam-header">
        <div className="exam-title">
          <div className="exam-icon">📝</div>
          <div>
            <h2>{examInfo.title}</h2>
            <div className="exam-meta">Subject grading sheet</div>
          </div>
        </div>
        <div className="exam-actions">
          <button className="back-link" onClick={onClose}>← Back</button>
          <button className="save-btn" onClick={save}>✓ Save Results</button>
        </div>
      </div>

      <div className="exam-subject-section">
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

      <div className="exam-controls">
        <div className="exam-date">Exam Date: {new Date().toLocaleDateString()}</div>
        <div className="exam-stats">
          <span className="stat">Average Marks: <strong>{averageMarks}</strong></span>
          <span className="stat">Total Students: <strong>{students.length}</strong></span>
        </div>
      </div>

      <table className="exam-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Coefficient (Coeff)</th>
            <th>Marks</th>
            <th>Total</th>
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
                  <div className="student-id">{s.studentId}</div>
                </div>
              </td>
              <td className="center">{s.coefficient}</td>
              <td className="center">
                <input 
                  type="number" 
                  min="0" 
                  value={s.marks}
                  onChange={(e) => updateMarks(s.id, parseInt(e.target.value) || 0)}
                  className="marks-input"
                />
              </td>
              <td className="center">{s.marks * s.coefficient}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="exam-footer">
        Showing 1 to {students.length} of {students.length} entries
        <div className="exam-pagination">
          <button className="nav-btn" disabled>Previous</button>
          <button className="page active">1</button>
          <button className="nav-btn" disabled>Next</button>
        </div>
      </div>
    </div>
  );
};

export default ExamDetail;
