import React, { useMemo, useState } from 'react';
import './OnlineExam.css';

const initialExams = [
  {
    id: 1,
    title: 'Grade 5 Mathematics Sequence 2 Quiz',
    className: 'Grade 5',
    subject: 'Mathematics',
    startDate: '2026-03-12',
    startTime: '09:00',
    durationMinutes: 45,
    attempts: 1,
    passMark: 50,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResultImmediately: false,
    published: true,
    questions: [
      {
        id: 101,
        text: 'What is 12 × 8?',
        options: ['88', '96', '92', '108'],
        correctOption: 1,
        marks: 2,
        explanation: '12 × 8 = 96.'
      },
      {
        id: 102,
        text: 'Solve: 35 + 17 = ?',
        options: ['42', '47', '52', '56'],
        correctOption: 2,
        marks: 2,
        explanation: '35 + 17 = 52.'
      }
    ]
  },
  {
    id: 2,
    title: 'Grade 6 Science MCQ Practice',
    className: 'Grade 6',
    subject: 'Science',
    startDate: '2026-03-15',
    startTime: '10:30',
    durationMinutes: 30,
    attempts: 2,
    passMark: 60,
    shuffleQuestions: true,
    shuffleOptions: false,
    showResultImmediately: true,
    published: false,
    questions: [
      {
        id: 201,
        text: 'Which organ helps in pumping blood?',
        options: ['Lungs', 'Brain', 'Heart', 'Liver'],
        correctOption: 2,
        marks: 2,
        explanation: 'The heart pumps blood throughout the body.'
      }
    ]
  }
];

const emptyQuestion = {
  text: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 0,
  marks: 1,
  explanation: ''
};

const OnlineExam = () => {
  const [exams, setExams] = useState(initialExams);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedExamId, setSelectedExamId] = useState(initialExams[0].id);

  const [questionDraft, setQuestionDraft] = useState(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const selectedExam = exams.find((exam) => exam.id === selectedExamId) || null;

  const classOptions = useMemo(() => {
    const unique = Array.from(new Set(exams.map((exam) => exam.className)));
    return ['All Classes', ...unique];
  }, [exams]);

  const filteredExams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exams.filter((exam) => {
      const classOk = classFilter === 'All Classes' || exam.className === classFilter;
      const statusOk = statusFilter === 'All'
        || (statusFilter === 'Published' && exam.published)
        || (statusFilter === 'Draft' && !exam.published);
      const searchOk = !q
        || exam.title.toLowerCase().includes(q)
        || exam.subject.toLowerCase().includes(q)
        || exam.className.toLowerCase().includes(q);
      return classOk && statusOk && searchOk;
    });
  }, [exams, search, classFilter, statusFilter]);

  const examStats = useMemo(() => {
    const totalQuestions = exams.reduce((sum, exam) => sum + exam.questions.length, 0);
    const published = exams.filter((exam) => exam.published).length;
    return {
      total: exams.length,
      published,
      drafts: exams.length - published,
      questions: totalQuestions
    };
  }, [exams]);

  const updateSelectedExam = (updates) => {
    if (!selectedExam) return;
    setExams((prev) => prev.map((exam) => (
      exam.id === selectedExam.id ? { ...exam, ...updates } : exam
    )));
  };

  const createNewExam = () => {
    const now = new Date();
    const mm = `${now.getMonth() + 1}`.padStart(2, '0');
    const dd = `${now.getDate()}`.padStart(2, '0');
    const hh = `${now.getHours()}`.padStart(2, '0');
    const min = `${now.getMinutes()}`.padStart(2, '0');

    const newExam = {
      id: Date.now(),
      title: 'Untitled Online Exam',
      className: 'Grade 5',
      subject: 'Mathematics',
      startDate: `${now.getFullYear()}-${mm}-${dd}`,
      startTime: `${hh}:${min}`,
      durationMinutes: 30,
      attempts: 1,
      passMark: 50,
      shuffleQuestions: true,
      shuffleOptions: true,
      showResultImmediately: false,
      published: false,
      questions: []
    };

    setExams((prev) => [newExam, ...prev]);
    setSelectedExamId(newExam.id);
    setQuestionDraft(emptyQuestion);
    setEditingQuestionId(null);
  };

  const duplicateExam = (exam) => {
    const copied = {
      ...exam,
      id: Date.now(),
      title: `${exam.title} (Copy)`,
      published: false,
      questions: exam.questions.map((q) => ({ ...q, id: Date.now() + Math.random() }))
    };

    setExams((prev) => [copied, ...prev]);
    setSelectedExamId(copied.id);
  };

  const deleteExam = (examId) => {
    const next = exams.filter((exam) => exam.id !== examId);
    setExams(next);
    if (selectedExamId === examId) {
      setSelectedExamId(next.length ? next[0].id : null);
    }
  };

  const togglePublish = (examId) => {
    setExams((prev) => prev.map((exam) => (
      exam.id === examId ? { ...exam, published: !exam.published } : exam
    )));
  };

  const resetQuestionForm = () => {
    setQuestionDraft(emptyQuestion);
    setEditingQuestionId(null);
  };

  const saveQuestion = () => {
    if (!selectedExam) return;

    const text = questionDraft.text.trim();
    const options = [
      questionDraft.optionA.trim(),
      questionDraft.optionB.trim(),
      questionDraft.optionC.trim(),
      questionDraft.optionD.trim()
    ];

    if (!text || options.some((option) => !option)) {
      alert('Please enter the question and all four options.');
      return;
    }

    if (editingQuestionId) {
      setExams((prev) => prev.map((exam) => {
        if (exam.id !== selectedExam.id) return exam;
        return {
          ...exam,
          questions: exam.questions.map((question) => (
            question.id === editingQuestionId
              ? {
                ...question,
                text,
                options,
                correctOption: Number(questionDraft.correctOption),
                marks: Number(questionDraft.marks),
                explanation: questionDraft.explanation.trim()
              }
              : question
          ))
        };
      }));

      resetQuestionForm();
      return;
    }

    const nextQuestion = {
      id: Date.now(),
      text,
      options,
      correctOption: Number(questionDraft.correctOption),
      marks: Number(questionDraft.marks),
      explanation: questionDraft.explanation.trim()
    };

    setExams((prev) => prev.map((exam) => (
      exam.id === selectedExam.id
        ? { ...exam, questions: [...exam.questions, nextQuestion] }
        : exam
    )));

    resetQuestionForm();
  };

  const editQuestion = (question) => {
    setEditingQuestionId(question.id);
    setQuestionDraft({
      text: question.text,
      optionA: question.options[0],
      optionB: question.options[1],
      optionC: question.options[2],
      optionD: question.options[3],
      correctOption: question.correctOption,
      marks: question.marks,
      explanation: question.explanation || ''
    });
  };

  const deleteQuestion = (questionId) => {
    if (!selectedExam) return;
    setExams((prev) => prev.map((exam) => (
      exam.id === selectedExam.id
        ? { ...exam, questions: exam.questions.filter((question) => question.id !== questionId) }
        : exam
    )));

    if (editingQuestionId === questionId) {
      resetQuestionForm();
    }
  };

  const totalMarks = (selectedExam?.questions || []).reduce((sum, question) => sum + question.marks, 0);

  return (
    <div className="online-exam-root">
      <div className="online-exam-header">
        <div>
          <h2>Online Exam Builder</h2>
          <p>Create, schedule and manage MCQ exams for students with strong control and organization.</p>
        </div>
        <button type="button" className="primary-btn" onClick={createNewExam}>+ New Online Exam</button>
      </div>

      <div className="exam-kpis">
        <div><strong>{examStats.total}</strong><span>Total Exams</span></div>
        <div><strong>{examStats.published}</strong><span>Published</span></div>
        <div><strong>{examStats.drafts}</strong><span>Drafts</span></div>
        <div><strong>{examStats.questions}</strong><span>MCQs</span></div>
      </div>

      <div className="exam-tools">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search exams by title, class or subject..."
        />
        <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
          {classOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All</option>
          <option>Published</option>
          <option>Draft</option>
        </select>
      </div>

      <div className="online-exam-layout">
        <section className="exam-list-card">
          <h3>Exam Library</h3>
          <div className="exam-list">
            {filteredExams.map((exam) => (
              <article
                key={exam.id}
                className={`exam-item ${selectedExamId === exam.id ? 'active' : ''}`}
              >
                <div className="exam-item-top">
                  <button type="button" className="title-btn" onClick={() => setSelectedExamId(exam.id)}>{exam.title}</button>
                  <span className={exam.published ? 'status published' : 'status draft'}>
                    {exam.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p>{exam.className} • {exam.subject}</p>
                <small>{exam.startDate} • {exam.startTime} • {exam.durationMinutes} mins</small>
                <div className="item-actions">
                  <button type="button" onClick={() => duplicateExam(exam)}>Duplicate</button>
                  <button type="button" onClick={() => togglePublish(exam.id)}>{exam.published ? 'Unpublish' : 'Publish'}</button>
                  <button type="button" className="danger" onClick={() => deleteExam(exam.id)}>Delete</button>
                </div>
              </article>
            ))}
            {filteredExams.length === 0 && <p className="empty">No exams match your filter.</p>}
          </div>
        </section>

        <section className="exam-editor-card">
          {!selectedExam && <p className="empty">Create or select an exam to configure it.</p>}

          {selectedExam && (
            <>
              <h3>Exam Setup</h3>
              <div className="setup-grid">
                <label>
                  Exam Title
                  <input
                    value={selectedExam.title}
                    onChange={(event) => updateSelectedExam({ title: event.target.value })}
                  />
                </label>
                <label>
                  Class
                  <input
                    value={selectedExam.className}
                    onChange={(event) => updateSelectedExam({ className: event.target.value })}
                  />
                </label>
                <label>
                  Subject
                  <input
                    value={selectedExam.subject}
                    onChange={(event) => updateSelectedExam({ subject: event.target.value })}
                  />
                </label>
                <label>
                  Start Date
                  <input
                    type="date"
                    value={selectedExam.startDate}
                    onChange={(event) => updateSelectedExam({ startDate: event.target.value })}
                  />
                </label>
                <label>
                  Start Time
                  <input
                    type="time"
                    value={selectedExam.startTime}
                    onChange={(event) => updateSelectedExam({ startTime: event.target.value })}
                  />
                </label>
                <label>
                  Duration (mins)
                  <input
                    type="number"
                    min="5"
                    value={selectedExam.durationMinutes}
                    onChange={(event) => updateSelectedExam({ durationMinutes: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Allowed Attempts
                  <input
                    type="number"
                    min="1"
                    value={selectedExam.attempts}
                    onChange={(event) => updateSelectedExam({ attempts: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Pass Mark (%)
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={selectedExam.passMark}
                    onChange={(event) => updateSelectedExam({ passMark: Number(event.target.value) })}
                  />
                </label>
              </div>

              <div className="setup-toggles">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedExam.shuffleQuestions}
                    onChange={(event) => updateSelectedExam({ shuffleQuestions: event.target.checked })}
                  />
                  Shuffle questions per student
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedExam.shuffleOptions}
                    onChange={(event) => updateSelectedExam({ shuffleOptions: event.target.checked })}
                  />
                  Shuffle option order
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedExam.showResultImmediately}
                    onChange={(event) => updateSelectedExam({ showResultImmediately: event.target.checked })}
                  />
                  Show result immediately after submission
                </label>
              </div>

              <div className="question-builder">
                <h4>{editingQuestionId ? 'Edit MCQ Question' : 'Add MCQ Question'}</h4>
                <label>
                  Question
                  <textarea
                    rows={2}
                    value={questionDraft.text}
                    onChange={(event) => setQuestionDraft((prev) => ({ ...prev, text: event.target.value }))}
                    placeholder="Enter your question statement"
                  />
                </label>

                <div className="options-grid">
                  <label>
                    Option A
                    <input
                      value={questionDraft.optionA}
                      onChange={(event) => setQuestionDraft((prev) => ({ ...prev, optionA: event.target.value }))}
                    />
                  </label>
                  <label>
                    Option B
                    <input
                      value={questionDraft.optionB}
                      onChange={(event) => setQuestionDraft((prev) => ({ ...prev, optionB: event.target.value }))}
                    />
                  </label>
                  <label>
                    Option C
                    <input
                      value={questionDraft.optionC}
                      onChange={(event) => setQuestionDraft((prev) => ({ ...prev, optionC: event.target.value }))}
                    />
                  </label>
                  <label>
                    Option D
                    <input
                      value={questionDraft.optionD}
                      onChange={(event) => setQuestionDraft((prev) => ({ ...prev, optionD: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="mcq-meta">
                  <label>
                    Correct Option
                    <select
                      value={questionDraft.correctOption}
                      onChange={(event) => setQuestionDraft((prev) => ({ ...prev, correctOption: Number(event.target.value) }))}
                    >
                      <option value={0}>A</option>
                      <option value={1}>B</option>
                      <option value={2}>C</option>
                      <option value={3}>D</option>
                    </select>
                  </label>
                  <label>
                    Marks
                    <input
                      type="number"
                      min="1"
                      value={questionDraft.marks}
                      onChange={(event) => setQuestionDraft((prev) => ({ ...prev, marks: Number(event.target.value) }))}
                    />
                  </label>
                </div>

                <label>
                  Explanation (optional)
                  <textarea
                    rows={2}
                    value={questionDraft.explanation}
                    onChange={(event) => setQuestionDraft((prev) => ({ ...prev, explanation: event.target.value }))}
                  />
                </label>

                <div className="builder-actions">
                  <button type="button" className="primary-btn" onClick={saveQuestion}>
                    {editingQuestionId ? 'Update Question' : 'Add Question'}
                  </button>
                  {editingQuestionId && <button type="button" onClick={resetQuestionForm}>Cancel Edit</button>}
                </div>
              </div>

              <div className="question-list-wrap">
                <div className="list-head">
                  <h4>Question Bank</h4>
                  <span>{selectedExam.questions.length} questions • {totalMarks} marks</span>
                </div>
                <ul className="question-list">
                  {selectedExam.questions.map((question, index) => (
                    <li key={question.id}>
                      <div>
                        <strong>Q{index + 1}. {question.text}</strong>
                        <p>Correct: {['A', 'B', 'C', 'D'][question.correctOption]} • Marks: {question.marks}</p>
                      </div>
                      <div className="item-actions">
                        <button type="button" onClick={() => editQuestion(question)}>Edit</button>
                        <button type="button" className="danger" onClick={() => deleteQuestion(question.id)}>Delete</button>
                      </div>
                    </li>
                  ))}
                  {selectedExam.questions.length === 0 && <li className="empty">No questions added yet.</li>}
                </ul>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default OnlineExam;
