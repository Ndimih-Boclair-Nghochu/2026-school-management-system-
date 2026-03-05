import React, { useMemo, useState } from 'react';
import './Messages.css';

const initialThreads = [
  {
    id: 1,
    participant: 'Parent - Amelia Clark',
    role: 'Parent (Grade 5 Math)',
    avatar: 'https://via.placeholder.com/42',
    channel: 'Parent',
    unread: true,
    priority: 'High',
    lastTime: '09:40',
    messages: [
      { id: 11, author: 'Parent - Amelia Clark', own: false, text: 'Good morning sir, Amelia is having trouble with quadratic equations.', time: '09:22' },
      { id: 12, author: 'John Smith', own: true, text: 'Thanks for informing me. I will send a revision worksheet and schedule support class.', time: '09:31' },
      { id: 13, author: 'Parent - Amelia Clark', own: false, text: 'Thank you. Please share the worksheet here as well.', time: '09:40' }
    ]
  },
  {
    id: 2,
    participant: 'Principal Office',
    role: 'Administration',
    avatar: 'https://via.placeholder.com/42',
    channel: 'Admin',
    unread: false,
    priority: 'Normal',
    lastTime: 'Yesterday',
    messages: [
      { id: 21, author: 'Principal Office', own: false, text: 'Please submit the term 2 sequence 1 result analysis by Friday.', time: 'Yesterday 15:08' },
      { id: 22, author: 'John Smith', own: true, text: 'Noted. I will submit before Thursday close of day.', time: 'Yesterday 15:21' }
    ]
  },
  {
    id: 3,
    participant: 'Class Reps - Grade 5',
    role: 'Students Group',
    avatar: 'https://via.placeholder.com/42',
    channel: 'Students',
    unread: true,
    priority: 'Normal',
    lastTime: '08:10',
    messages: [
      { id: 31, author: 'Class Reps - Grade 5', own: false, text: 'Sir, can we get the correction guide for the last assignment?', time: '08:10' },
      { id: 32, author: 'John Smith', own: true, text: 'Yes, I will upload it in Materials before noon.', time: '08:24' }
    ]
  }
];

const Messages = () => {
  const [threads, setThreads] = useState(initialThreads);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [activeThreadId, setActiveThreadId] = useState(initialThreads[0].id);
  const [draft, setDraft] = useState('');

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((thread) => {
      const channelOk = channelFilter === 'All' || thread.channel === channelFilter;
      const queryOk = !q
        || thread.participant.toLowerCase().includes(q)
        || thread.role.toLowerCase().includes(q)
        || thread.messages.some((message) => message.text.toLowerCase().includes(q));
      return channelOk && queryOk;
    });
  }, [threads, search, channelFilter]);

  const activeThread = filteredThreads.find((thread) => thread.id === activeThreadId) || filteredThreads[0] || null;
  const unreadCount = threads.filter((item) => item.unread).length;

  const handleOpenThread = (threadId) => {
    setActiveThreadId(threadId);
    setThreads((prev) => prev.map((thread) => (
      thread.id === threadId ? { ...thread, unread: false } : thread
    )));
  };

  const handleSendMessage = () => {
    const text = draft.trim();
    if (!text || !activeThread) return;

    const now = new Date();
    const hh = `${now.getHours()}`.padStart(2, '0');
    const mm = `${now.getMinutes()}`.padStart(2, '0');
    const time = `${hh}:${mm}`;

    setThreads((prev) => prev.map((thread) => {
      if (thread.id !== activeThread.id) return thread;
      return {
        ...thread,
        lastTime: time,
        messages: [...thread.messages, { id: Date.now(), author: 'John Smith', own: true, text, time }]
      };
    }));

    setDraft('');
  };

  return (
    <div className="messages-root">
      <div className="messages-head-card">
        <div>
          <h2>Messages</h2>
          <p>Communicate professionally with parents, students and school administration.</p>
        </div>
        <div className="messages-kpis">
          <span><strong>{threads.length}</strong> Threads</span>
          <span><strong>{unreadCount}</strong> Unread</span>
          <span><strong>{threads.filter((item) => item.priority === 'High').length}</strong> Priority</span>
        </div>
      </div>

      <div className="messages-layout">
        <aside className="inbox-panel">
          <div className="inbox-tools">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations..."
            />
            <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
              <option value="All">All Channels</option>
              <option value="Parent">Parent</option>
              <option value="Students">Students</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <ul className="thread-list">
            {filteredThreads.map((thread) => {
              const latestMessage = thread.messages[thread.messages.length - 1];
              const isActive = activeThread && activeThread.id === thread.id;
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    className={`thread-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleOpenThread(thread.id)}
                  >
                    <img src={thread.avatar} alt={thread.participant} />
                    <div>
                      <div className="thread-top-line">
                        <strong>{thread.participant}</strong>
                        <small>{thread.lastTime}</small>
                      </div>
                      <p>{latestMessage?.text}</p>
                      <div className="thread-tags">
                        <span>{thread.channel}</span>
                        {thread.unread && <span className="unread-tag">Unread</span>}
                        {thread.priority === 'High' && <span className="priority-tag">Priority</span>}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {filteredThreads.length === 0 && <p className="empty-state">No conversations found for this filter.</p>}
        </aside>

        <section className="chat-panel">
          {activeThread ? (
            <>
              <header className="chat-header">
                <div className="participant-meta">
                  <img src={activeThread.avatar} alt={activeThread.participant} />
                  <div>
                    <h3>{activeThread.participant}</h3>
                    <p>{activeThread.role} • {activeThread.channel} Channel</p>
                  </div>
                </div>
                <span className={`priority-chip ${activeThread.priority === 'High' ? 'high' : ''}`}>{activeThread.priority} Priority</span>
              </header>

              <div className="message-stream">
                {activeThread.messages.map((message) => (
                  <article key={message.id} className={`bubble ${message.own ? 'own' : ''}`}>
                    <p>{message.text}</p>
                    <small>{message.author} • {message.time}</small>
                  </article>
                ))}
              </div>

              <div className="composer">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  placeholder="Type message, response, or follow-up instruction..."
                />
                <div className="composer-actions">
                  <span>Professional note: all messages are saved in this term session.</span>
                  <button type="button" onClick={handleSendMessage}>Send Message</button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-thread">
              <h3>No active conversation</h3>
              <p>Select a conversation from the inbox to view and reply.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Messages;
