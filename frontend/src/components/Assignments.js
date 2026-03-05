import React, { useEffect, useMemo, useState } from 'react';
import './Assignments.css';

const CLASS_OPTIONS = [
  'Grade 4 Science',
  'Grade 5 Math',
  'Grade 6 English',
  'Grade 7 History'
];

const buildSubmission = (id, assignmentId, student, format, submittedAt, content, imagePreview = '') => ({
  id,
  assignmentId,
  student,
  format,
  submittedAt,
  content,
  imagePreview,
  status: 'Submitted',
  score: '',
  comment: '',
  feedbackSent: false
});

const getAcceptedFiles = (format) => {
  if (format === 'PDF') return '.pdf,application/pdf';
  if (format === 'MS Word') return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (format === 'Image') return 'image/*';
  return '';
};

const initialAssignments = [
  {
    id: 1,
    className: 'Grade 5 Math',
    title: 'Algebra Practice Set 1',
    instructions: 'Solve questions 1-20 and show all steps clearly.',
    dueDate: '2026-03-12',
    formats: ['Typed', 'PDF', 'MS Word', 'Image'],
    createdAt: '2026-03-05'
  },
  {
    id: 2,
    className: 'Grade 6 English',
    title: 'Essay: My Community',
    instructions: 'Write 500 words about your community and include examples.',
    dueDate: '2026-03-15',
    formats: ['Typed', 'MS Word'],
    createdAt: '2026-03-05'
  }
];

const initialSubmissions = [
  buildSubmission(1, 1, 'Emma Brown', 'PDF', '2026-03-08 10:12', 'algebra_emma.pdf'),
  buildSubmission(2, 1, 'Lily Chen', 'Typed', '2026-03-08 11:05', 'Typed response submitted in portal'),
  buildSubmission(3, 1, 'Noah Johnson', 'MS Word', '2026-03-09 09:41', 'algebra_noah.docx'),
  buildSubmission(6, 1, 'Lucas Kim', 'Image', '2026-03-09 12:25', 'work_lucas.jpg', 'https://via.placeholder.com/120x80.png?text=Image'),
  buildSubmission(4, 2, 'Aiden Martinez', 'MS Word', '2026-03-09 16:20', 'essay_aiden.docx'),
  buildSubmission(5, 2, 'Sophia Adams', 'Typed', '2026-03-10 08:03', 'Typed essay submitted in portal')
];

const Assignments = () => {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(initialAssignments[0].id);
  const [selectedClass, setSelectedClass] = useState(CLASS_OPTIONS[1]);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formatTyped, setFormatTyped] = useState(true);
  const [formatPdf, setFormatPdf] = useState(true);
  const [formatWord, setFormatWord] = useState(true);
  const [formatImage, setFormatImage] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [studentFormat, setStudentFormat] = useState('Typed');
  const [studentSubmissionText, setStudentSubmissionText] = useState('');
  const [studentFile, setStudentFile] = useState(null);
  const [studentFilePreview, setStudentFilePreview] = useState('');

  const selectedAssignment = assignments.find((assignment) => assignment.id === selectedAssignmentId);

  useEffect(() => {
    if (!selectedAssignment) return;
    if (!selectedAssignment.formats.includes(studentFormat)) {
      setStudentFormat(selectedAssignment.formats[0]);
      setStudentSubmissionText('');
      setStudentFile(null);
      setStudentFilePreview('');
    }
  }, [selectedAssignment, studentFormat]);

  const selectedSubmissions = useMemo(
    () => submissions.filter((submission) => submission.assignmentId === selectedAssignmentId),
    [selectedAssignmentId, submissions]
  );

  const pendingCount = selectedSubmissions.filter((item) => !item.feedbackSent).length;
  const reviewedCount = selectedSubmissions.filter((item) => item.feedbackSent).length;

  const createAssignment = () => {
    const cleanTitle = title.trim();
    const cleanInstructions = instructions.trim();
    const chosenFormats = [
      formatTyped ? 'Typed' : null,
      formatPdf ? 'PDF' : null,
      formatWord ? 'MS Word' : null,
      formatImage ? 'Image' : null
    ].filter(Boolean);

    if (!cleanTitle || !cleanInstructions || !dueDate) {
      alert('Please complete title, instructions and due date.');
      return;
    }

    if (chosenFormats.length === 0) {
      alert('Please select at least one accepted format (Typed, PDF, MS Word, Image).');
      return;
    }

    const newAssignment = {
      id: Date.now(),
      className: selectedClass,
      title: cleanTitle,
      instructions: cleanInstructions,
      dueDate,
      formats: chosenFormats,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    setAssignments((prev) => [newAssignment, ...prev]);
    setSelectedAssignmentId(newAssignment.id);
    setTitle('');
    setInstructions('');
    setDueDate('');
    setFormatTyped(true);
    setFormatPdf(true);
    setFormatWord(true);
    setFormatImage(true);
    alert(`Assignment sent to ${selectedClass} successfully.`);
  };

  const handleStudentFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      setStudentFile(null);
      setStudentFilePreview('');
      return;
    }

    setStudentFile(file);
    if (studentFormat === 'Image') {
      setStudentFilePreview(URL.createObjectURL(file));
    } else {
      setStudentFilePreview('');
    }
  };

  const addStudentSubmission = () => {
    const cleanStudentName = studentName.trim();
    const cleanSubmissionText = studentSubmissionText.trim();

    if (!selectedAssignment) {
      alert('Please select an assignment first.');
      return;
    }

    if (!cleanStudentName) {
      alert('Please enter student name.');
      return;
    }

    if (!selectedAssignment.formats.includes(studentFormat)) {
      alert('Selected format is not accepted for this assignment.');
      return;
    }

    if (studentFormat !== 'Typed' && !studentFile) {
      alert(`Please attach a ${studentFormat} file submission.`);
      return;
    }

    if (studentFormat !== 'Image' && !cleanSubmissionText) {
      alert('Please provide submission content or file name.');
      return;
    }

    const nextId = submissions.length ? Math.max(...submissions.map((item) => item.id)) + 1 : 1;
    const content = studentFormat === 'Typed' ? cleanSubmissionText : studentFile.name;

    const newSubmission = buildSubmission(
      nextId,
      selectedAssignment.id,
      cleanStudentName,
      studentFormat,
      new Date().toLocaleString(),
      content,
      studentFormat === 'Image' ? studentFilePreview : ''
    );

    setSubmissions((prev) => [newSubmission, ...prev]);
    setStudentName('');
    setStudentSubmissionText('');
    setStudentFile(null);
    setStudentFilePreview('');
    alert('Student submission received successfully.');
  };

  const updateSubmission = (submissionId, updates) => {
    setSubmissions((prev) =>
      prev.map((submission) =>
        submission.id === submissionId ? { ...submission, ...updates } : submission
      )
    );
  };

  const saveMark = (submission) => {
    if (submission.score === '') {
      alert('Please enter a score before saving.');
      return;
    }
    updateSubmission(submission.id, { status: 'Marked' });
  };

  const sendFeedback = (submission) => {
    if (submission.score === '') {
      alert('Please mark the assignment before sending feedback.');
      return;
    }
    updateSubmission(submission.id, { feedbackSent: true, status: 'Feedback Sent' });
  };

  return (
    <div className="assignments-root">
      <div className="assignments-header">
        <h2>Assignments Management</h2>
        <p>Send class assignments, receive student submissions, mark and comment professionally.</p>
      </div>

      <div className="assignments-grid">
        <section className="assignment-card assignment-create">
          <h3>Create & Send Assignment</h3>

          <div className="form-row">
            <label htmlFor="classSelect">Class</label>
            <select id="classSelect" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              {CLASS_OPTIONS.map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="assignmentTitle">Assignment Title</label>
            <input
              id="assignmentTitle"
              type="text"
              placeholder="e.g. Quadratic Equations Exercise"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="assignmentInstructions">Instructions</label>
            <textarea
              id="assignmentInstructions"
              rows={4}
              placeholder="Provide clear instructions for students..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="dueDate">Due Date</label>
            <input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="form-row">
            <label>Accepted Submission Formats</label>
            <div className="format-options">
              <label><input type="checkbox" checked={formatTyped} onChange={(e) => setFormatTyped(e.target.checked)} /> Typed</label>
              <label><input type="checkbox" checked={formatPdf} onChange={(e) => setFormatPdf(e.target.checked)} /> PDF</label>
              <label><input type="checkbox" checked={formatWord} onChange={(e) => setFormatWord(e.target.checked)} /> MS Word</label>
              <label><input type="checkbox" checked={formatImage} onChange={(e) => setFormatImage(e.target.checked)} /> Image</label>
            </div>
          </div>

          <button className="primary-btn" onClick={createAssignment}>Send Assignment</button>
        </section>

        <section className="assignment-card assignment-list">
          <h3>Sent Assignments</h3>
          <div className="sent-list">
            {assignments.map((assignment) => (
              <button
                key={assignment.id}
                className={`sent-item ${assignment.id === selectedAssignmentId ? 'active' : ''}`}
                onClick={() => setSelectedAssignmentId(assignment.id)}
              >
                <div>
                  <strong>{assignment.title}</strong>
                  <p>{assignment.className}</p>
                </div>
                <div className="sent-meta">
                  <span>Due: {assignment.dueDate}</span>
                  <span className="format-badges">{assignment.formats.join(' • ')}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="assignment-card student-submit-card">
        <h3>Receive Student Submission</h3>
        <p>Use this panel to record student submissions for the selected assignment.</p>
        <div className="student-submit-grid">
          <div className="form-row">
            <label htmlFor="studentName">Student Name</label>
            <input
              id="studentName"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Emma Brown"
            />
          </div>

          <div className="form-row">
            <label htmlFor="studentFormat">Submission Format</label>
            <select id="studentFormat" value={studentFormat} onChange={(e) => setStudentFormat(e.target.value)}>
              {(selectedAssignment?.formats || []).map((format) => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>

          {studentFormat === 'Image' ? (
            <div className="form-row image-upload-row">
              <label htmlFor="studentFile">Attach {studentFormat} File</label>
              <input
                id="studentFile"
                type="file"
                accept={getAcceptedFiles(studentFormat)}
                onChange={handleStudentFileChange}
              />
              {studentFilePreview && (
                <img src={studentFilePreview} alt="Student submission preview" className="image-preview" />
              )}
            </div>
          ) : studentFormat === 'Typed' ? (
            <div className="form-row">
              <label htmlFor="studentSubmission">Typed Submission</label>
              <textarea
                id="studentSubmission"
                rows={3}
                value={studentSubmissionText}
                onChange={(e) => setStudentSubmissionText(e.target.value)}
                placeholder="Enter typed response summary"
              />
            </div>
          ) : (
            <div className="form-row image-upload-row">
              <label htmlFor="studentFile">Attach {studentFormat} File</label>
              <input
                id="studentFile"
                type="file"
                accept={getAcceptedFiles(studentFormat)}
                onChange={handleStudentFileChange}
              />
            </div>
          )}
        </div>

        <button className="primary-btn" onClick={addStudentSubmission}>Receive Submission</button>
      </section>

      <section className="assignment-card submissions-section">
        <div className="submissions-top">
          <div>
            <h3>Student Submissions</h3>
            {selectedAssignment && (
              <p>
                <strong>{selectedAssignment.title}</strong> • {selectedAssignment.className}
              </p>
            )}
          </div>
          <div className="submission-stats">
            <span>Pending: {pendingCount}</span>
            <span>Reviewed: {reviewedCount}</span>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Format</th>
                <th>Submission</th>
                <th>Submitted At</th>
                <th>Score (/20)</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedSubmissions.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-cell">No submissions yet for this assignment.</td>
                </tr>
              )}
              {selectedSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.student}</td>
                  <td><span className="format-pill">{submission.format}</span></td>
                  <td>
                    {submission.format === 'Image' ? (
                      <div className="submission-image-cell">
                        <span>{submission.content}</span>
                        {submission.imagePreview && (
                          <img src={submission.imagePreview} alt={`${submission.student} submission`} className="submission-thumb" />
                        )}
                      </div>
                    ) : (
                      submission.content
                    )}
                  </td>
                  <td>{submission.submittedAt}</td>
                  <td>
                    <input
                      className="score-input"
                      type="number"
                      min="0"
                      max="20"
                      value={submission.score}
                      onChange={(e) => updateSubmission(submission.id, { score: e.target.value })}
                    />
                  </td>
                  <td>
                    <textarea
                      className="comment-input"
                      rows={2}
                      placeholder="Write teacher feedback..."
                      value={submission.comment}
                      onChange={(e) => updateSubmission(submission.id, { comment: e.target.value })}
                    />
                  </td>
                  <td><span className={`status-pill ${submission.feedbackSent ? 'done' : 'pending'}`}>{submission.status}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="secondary-btn" onClick={() => saveMark(submission)}>Mark</button>
                      <button className="primary-btn small" onClick={() => sendFeedback(submission)}>Send Comment</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Assignments;
