import React, { useMemo, useState } from 'react';
import './OnlineClasses.css';

const CLASS_OPTIONS = ['Grade 4 Science', 'Grade 5 Math', 'Grade 6 English', 'Grade 7 History'];

const buildAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f6feb&color=fff&bold=true`;

const makeParticipant = (name, role = 'student') => ({
  name,
  role,
  avatar: buildAvatar(name)
});

const initialClasses = [
  {
    id: 1,
    className: 'Grade 5 Math',
    topic: 'Linear Equations Live Revision',
    date: '2026-03-06',
    time: '10:00',
    duration: 60,
    description: 'Revision and Q&A before test.',
    status: 'live',
    participants: [
      makeParticipant('John Smith', 'teacher'),
      makeParticipant('Emma Brown'),
      makeParticipant('Lily Chen'),
      makeParticipant('Noah Johnson')
    ],
    meetingCode: 'G5M-LINEAR-001'
  },
  {
    id: 2,
    className: 'Grade 6 English',
    topic: 'Essay Writing Workshop',
    date: '2026-03-07',
    time: '14:00',
    duration: 45,
    description: 'How to structure introduction and conclusion.',
    status: 'scheduled',
    participants: [makeParticipant('John Smith', 'teacher')],
    meetingCode: 'G6E-ESSAY-002'
  },
  {
    id: 3,
    className: 'Grade 4 Science',
    topic: 'Plants and Photosynthesis',
    date: '2026-03-04',
    time: '09:00',
    duration: 40,
    description: 'Interactive science lesson with experiments.',
    status: 'completed',
    participants: [
      makeParticipant('John Smith', 'teacher'),
      makeParticipant('Aiden Martinez'),
      makeParticipant('Sophia Adams')
    ],
    meetingCode: 'G4S-PLANT-003'
  }
];

const defaultForm = {
  className: CLASS_OPTIONS[0],
  topic: '',
  date: '',
  time: '',
  duration: 45,
  description: ''
};

const OnlineClasses = () => {
  const [onlineClasses, setOnlineClasses] = useState(initialClasses);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [meetingPanel, setMeetingPanel] = useState('participants');
  const [chatMessage, setChatMessage] = useState('');
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState('Chapter Review Slides');
  const [chatLog, setChatLog] = useState([
    { id: 1, sender: 'Emma Brown', message: 'Good morning sir.' },
    { id: 2, sender: 'Lily Chen', message: 'Please can you explain question 3 again?' }
  ]);

  const summary = useMemo(() => {
    const live = onlineClasses.filter((c) => c.status === 'live').length;
    const scheduled = onlineClasses.filter((c) => c.status === 'scheduled').length;
    const completed = onlineClasses.filter((c) => c.status === 'completed').length;
    return { live, scheduled, completed, total: onlineClasses.length };
  }, [onlineClasses]);

  const filteredClasses = useMemo(() => {
    if (filter === 'all') return onlineClasses;
    return onlineClasses.filter((classItem) => classItem.status === filter);
  }, [filter, onlineClasses]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const saveScheduledClass = () => {
    if (!form.topic.trim() || !form.date || !form.time || !form.duration) {
      alert('Please complete class, topic, date, time and duration.');
      return;
    }

    if (editingId) {
      setOnlineClasses((prev) =>
        prev.map((classItem) =>
          classItem.id === editingId
            ? { ...classItem, ...form, duration: Number(form.duration) }
            : classItem
        )
      );
      resetForm();
      alert('Class updated successfully.');
      return;
    }

    const newClass = {
      id: Date.now(),
      ...form,
      duration: Number(form.duration),
      status: 'scheduled',
      participants: [makeParticipant('John Smith', 'teacher')],
      meetingCode: `${form.className.replace(/\s+/g, '').slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`
    };

    setOnlineClasses((prev) => [newClass, ...prev]);
    resetForm();
    alert('Online class scheduled successfully.');
  };

  const editClass = (classItem) => {
    setEditingId(classItem.id);
    setForm({
      className: classItem.className,
      topic: classItem.topic,
      date: classItem.date,
      time: classItem.time,
      duration: classItem.duration,
      description: classItem.description
    });
  };

  const startClass = (classItem) => {
    setOnlineClasses((prev) =>
      prev.map((item) => (item.id === classItem.id ? { ...item, status: 'live' } : item))
    );
    setActiveMeeting({ ...classItem, status: 'live' });
  };

  const joinClass = (classItem) => {
    setActiveMeeting(classItem);
  };

  const markCompleted = (classItem) => {
    setOnlineClasses((prev) =>
      prev.map((item) => (item.id === classItem.id ? { ...item, status: 'completed' } : item))
    );
  };

  const addStudentParticipant = () => {
    if (!activeMeeting) return;
    const studentName = `Student ${Math.floor(Math.random() * 40) + 1}`;
    const updatedParticipants = [...activeMeeting.participants, makeParticipant(studentName)];

    setActiveMeeting((prev) => (prev ? { ...prev, participants: updatedParticipants } : prev));
    setOnlineClasses((prev) =>
      prev.map((item) =>
        item.id === activeMeeting.id ? { ...item, participants: updatedParticipants } : item
      )
    );
  };

  const sendChat = () => {
    const clean = chatMessage.trim();
    if (!clean) return;
    setChatLog((prev) => [...prev, { id: Date.now(), sender: 'John Smith', message: clean }]);
    setChatMessage('');
  };

  const leaveMeeting = () => {
    if (activeMeeting) {
      markCompleted(activeMeeting);
    }
    setActiveMeeting(null);
    setMeetingPanel('participants');
    setIsPresenting(false);
  };

  if (activeMeeting) {
    const teacher = activeMeeting.participants.find((p) => p.role === 'teacher') || activeMeeting.participants[0];
    const students = activeMeeting.participants.filter((p) => p !== teacher);

    return (
      <div className="meet-shell">
        <div className="meet-top">
          <div>
            <h3>{activeMeeting.topic}</h3>
            <p>{activeMeeting.className} • Code: {activeMeeting.meetingCode}</p>
          </div>
          <span className="live-pill">Live</span>
        </div>

        <div className="meet-main">
          <div className="meet-stage">
            {isPresenting && (
              <div className="presentation-tile">
                <div className="presentation-top">
                  <strong>{teacher?.name} is presenting</strong>
                  <span>Shared content</span>
                </div>
                <div className="presentation-body">
                  <h4>{presentationTitle}</h4>
                  <p>Live explanation in progress. Students can follow and ask questions in chat.</p>
                </div>
              </div>
            )}

            <div className={`main-tile ${isPresenting ? 'main-tile-pip' : ''}`}>
              <img src={teacher?.avatar} alt={teacher?.name} className="tile-avatar teacher-avatar" />
              <div className="tile-name">{teacher?.name} (Teacher)</div>
            </div>
            <div className="tile-grid">
              {students.map((participant, index) => (
                <div className="small-tile" key={`${participant.name}-${index}`}>
                  <img src={participant.avatar} alt={participant.name} className="tile-avatar" />
                  <div className="tile-name">{participant.name}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="meet-panel">
            <div className="panel-tabs">
              <button
                type="button"
                className={meetingPanel === 'participants' ? 'active' : ''}
                onClick={() => setMeetingPanel('participants')}
              >
                Participants
              </button>
              <button
                type="button"
                className={meetingPanel === 'chat' ? 'active' : ''}
                onClick={() => setMeetingPanel('chat')}
              >
                Chat
              </button>
            </div>

            {meetingPanel === 'participants' ? (
              <div className="participants-list">
                {activeMeeting.participants.map((participant, index) => (
                  <div key={`${participant.name}-${index}`} className="participant-item">
                    <img src={participant.avatar} alt={participant.name} className="participant-avatar" />
                    <span>
                      {participant.name}{participant.role === 'teacher' ? ' (Teacher)' : ''}
                      {participant.role === 'teacher' && isPresenting ? ' • Presenting' : ''}
                    </span>
                  </div>
                ))}
                <button type="button" className="secondary-btn" onClick={addStudentParticipant}>
                  Simulate Student Join
                </button>
              </div>
            ) : (
              <div className="chat-panel">
                <div className="chat-log">
                  {chatLog.map((chat) => (
                    <div key={chat.id} className="chat-item">
                      <strong>{chat.sender}:</strong> {chat.message}
                    </div>
                  ))}
                </div>
                <div className="chat-input-row">
                  <input
                    type="text"
                    placeholder="Send a message"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                  <button type="button" onClick={sendChat}>Send</button>
                </div>
              </div>
            )}
          </aside>
        </div>

        <div className="meet-controls">
          <button type="button" className={micOn ? '' : 'off'} onClick={() => setMicOn((prev) => !prev)}>
            {micOn ? 'Mic On' : 'Mic Off'}
          </button>
          <button type="button" className={camOn ? '' : 'off'} onClick={() => setCamOn((prev) => !prev)}>
            {camOn ? 'Camera On' : 'Camera Off'}
          </button>
          <button type="button" className={handRaised ? 'raised' : ''} onClick={() => setHandRaised((prev) => !prev)}>
            {handRaised ? 'Lower Hand' : 'Raise Hand'}
          </button>
          <button type="button" className={isPresenting ? 'presenting' : ''} onClick={() => setIsPresenting((prev) => !prev)}>
            {isPresenting ? 'Stop Presenting' : 'Start Presenting'}
          </button>
          {isPresenting && (
            <input
              type="text"
              className="presentation-input"
              value={presentationTitle}
              onChange={(e) => setPresentationTitle(e.target.value)}
              placeholder="Presentation title"
            />
          )}
          <button type="button" className="end-call" onClick={leaveMeeting}>End Class</button>
        </div>
      </div>
    );
  }

  return (
    <div className="online-classes-root">
      <div className="online-header">
        <h2>Online Classes</h2>
        <p>Schedule, edit, monitor live sessions, and join classes professionally.</p>
      </div>

      <div className="summary-cards">
        <div className="summary-card"><strong>{summary.total}</strong><span>Total Classes</span></div>
        <div className="summary-card"><strong>{summary.scheduled}</strong><span>Scheduled</span></div>
        <div className="summary-card"><strong>{summary.live}</strong><span>Live Now</span></div>
        <div className="summary-card"><strong>{summary.completed}</strong><span>Completed</span></div>
      </div>

      <div className="online-grid">
        <section className="online-card scheduler-card">
          <h3>{editingId ? 'Edit Scheduled Class' : 'Schedule New Class'}</h3>
          <div className="form-grid">
            <div className="field">
              <label>Class</label>
              <select value={form.className} onChange={(e) => updateForm('className', e.target.value)}>
                {CLASS_OPTIONS.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Topic</label>
              <input value={form.topic} onChange={(e) => updateForm('topic', e.target.value)} placeholder="Enter class topic" />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => updateForm('date', e.target.value)} />
            </div>
            <div className="field">
              <label>Time</label>
              <input type="time" value={form.time} onChange={(e) => updateForm('time', e.target.value)} />
            </div>
            <div className="field">
              <label>Duration (minutes)</label>
              <input type="number" min="15" value={form.duration} onChange={(e) => updateForm('duration', e.target.value)} />
            </div>
            <div className="field full">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Lesson description" />
            </div>
          </div>
          <div className="scheduler-actions">
            <button type="button" className="primary-btn" onClick={saveScheduledClass}>{editingId ? 'Update Class' : 'Schedule Class'}</button>
            {editingId && <button type="button" className="secondary-btn" onClick={resetForm}>Cancel Edit</button>}
          </div>
        </section>

        <section className="online-card classes-card">
          <div className="classes-card-head">
            <h3>Scheduled Classes</h3>
            <div className="filter-chips">
              {[
                ['all', 'All'],
                ['scheduled', 'Scheduled'],
                ['live', 'Live'],
                ['completed', 'Completed']
              ].map(([key, label]) => (
                <button key={key} type="button" className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}</button>
              ))}
            </div>
          </div>

          <div className="class-list">
            {filteredClasses.map((classItem) => (
              <article key={classItem.id} className="class-item">
                <div className="class-item-top">
                  <div>
                    <strong>{classItem.topic}</strong>
                    <p>{classItem.className}</p>
                  </div>
                  <span className={`status ${classItem.status}`}>{classItem.status}</span>
                </div>
                <div className="meta">
                  <span>{classItem.date}</span>
                  <span>{classItem.time}</span>
                  <span>{classItem.duration} mins</span>
                </div>
                <p className="desc">{classItem.description}</p>
                <div className="item-actions">
                  <button type="button" onClick={() => editClass(classItem)}>Edit</button>
                  {classItem.status !== 'live' && classItem.status !== 'completed' && (
                    <button type="button" className="primary" onClick={() => startClass(classItem)}>Start</button>
                  )}
                  {classItem.status === 'live' && (
                    <button type="button" className="primary" onClick={() => joinClass(classItem)}>Join</button>
                  )}
                  {classItem.status !== 'completed' && (
                    <button type="button" onClick={() => markCompleted(classItem)}>Complete</button>
                  )}
                </div>
              </article>
            ))}
            {filteredClasses.length === 0 && <p className="empty">No classes in this filter.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OnlineClasses;
