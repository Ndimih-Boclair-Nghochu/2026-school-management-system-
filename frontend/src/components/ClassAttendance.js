import React, { useMemo, useState } from 'react';
import './ClassAttendance.css';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'History'];

const buildStudentPerformance = (studentCount) =>
  Array.from({ length: studentCount }).map((_, i) => {
    const math = 8 + ((i * 3) % 13);
    const science = 9 + ((i * 4) % 12);
    const english = 7 + ((i * 5) % 14);
    const history = 8 + ((i * 2) % 11);
    const average = Number(((math + science + english + history) / 4).toFixed(1));

    return {
      id: i + 1,
      name: `Student ${i + 1}`,
      scores: {
        Mathematics: math,
        Science: science,
        English: english,
        History: history,
      },
      average,
    };
  });

const ClassAttendance = ({ selectedClass }) => {
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [studentPerformance] = useState(buildStudentPerformance(selectedClass.students));

  const classComparisons = useMemo(
    () => [
      { className: selectedClass.title, subject: 'Mathematics', average: 12.8 },
      { className: selectedClass.title, subject: 'Science', average: 13.4 },
      { className: 'Grade 6', subject: 'Mathematics', average: 11.9 },
      { className: 'Grade 7', subject: 'Science', average: 14.1 },
    ],
    [selectedClass.title]
  );

  const displayRows = useMemo(() => {
    if (selectedSubject === 'All Subjects') {
      return studentPerformance;
    }

    return studentPerformance.map((student) => {
      const score = student.scores[selectedSubject];
      return {
        ...student,
        average: score,
      };
    });
  }, [selectedSubject, studentPerformance]);

  const classAverage =
    displayRows.reduce((total, student) => total + student.average, 0) / displayRows.length;

  const topPerformers = displayRows.filter((student) => student.average >= 14).length;
  const supportNeeded = displayRows.filter((student) => student.average < 10).length;

  return (
    <div className="class-attendance-root">
      <div className="attendance-header">
        <h2>{selectedClass.sub} Performance Dashboard</h2>
        <p className="class-info">
          Class: <strong>{selectedClass.title}</strong> • Students: <strong>{selectedClass.students}</strong>
        </p>
      </div>

      <div className="performance-filter-row">
        <label htmlFor="subjectFilter">Subject:</label>
        <select
          id="subjectFilter"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option>All Subjects</option>
          {SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      <div className="attendance-stats">
        <div className="stat-box percentage">
          <h3>{classAverage.toFixed(1)}/20</h3>
          <p>Class Average</p>
        </div>
        <div className="stat-box present">
          <h3>{topPerformers}</h3>
          <p>Top Performers (≥ 14)</p>
        </div>
        <div className="stat-box absent">
          <h3>{supportNeeded}</h3>
          <p>Needs Support (&lt; 10)</p>
        </div>
      </div>

      <div className="attendance-table">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              {selectedSubject === 'All Subjects' && <th>Math</th>}
              {selectedSubject === 'All Subjects' && <th>Science</th>}
              {selectedSubject === 'All Subjects' && <th>English</th>}
              {selectedSubject === 'All Subjects' && <th>History</th>}
              <th>{selectedSubject === 'All Subjects' ? 'Average' : `${selectedSubject} Score`}</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((student) => {
              const performanceLabel =
                student.average >= 14 ? 'Excellent' : student.average >= 10 ? 'Good' : 'Needs Support';

              return (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  {selectedSubject === 'All Subjects' && <td>{student.scores.Mathematics}</td>}
                  {selectedSubject === 'All Subjects' && <td>{student.scores.Science}</td>}
                  {selectedSubject === 'All Subjects' && <td>{student.scores.English}</td>}
                  {selectedSubject === 'All Subjects' && <td>{student.scores.History}</td>}
                  <td>{student.average}</td>
                  <td className={`performance-badge-cell ${performanceLabel.toLowerCase().replace(' ', '-')}`}>
                    <span className="performance-badge">{performanceLabel}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="class-comparison">
        <h3>Performance Across Classes and Subjects</h3>
        <div className="comparison-grid">
          {classComparisons.map((item, index) => (
            <div className="comparison-card" key={`${item.className}-${item.subject}-${index}`}>
              <strong>{item.className}</strong>
              <span>{item.subject}</span>
              <p>{item.average}/20 Average</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassAttendance;
