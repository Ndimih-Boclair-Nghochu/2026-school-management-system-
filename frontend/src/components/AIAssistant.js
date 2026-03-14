
import './AIAssistant.css';
import React, { useState } from 'react';

const GROK_API_URL = 'https://api.grok.com/v1/assistant'; // Replace with actual GROK endpoint if different
const GROK_API_KEY = 'YOUR_GROK_API_KEY'; // Replace with your actual API key or use env variable

const AIAssistant = ({ userRole }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setMessages((msgs) => [...msgs, { sender: 'user', text: input }]);
    try {
      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        },
        body: JSON.stringify({
          prompt: input,
          role: userRole
        })
      });
      const data = await response.json();
      setMessages((msgs) => [...msgs, { sender: 'ai', text: data.answer || data.response || 'No response.' }]);
    } catch (err) {
      setError('Failed to get response from AI assistant.');
    }
    setLoading(false);
    setInput('');
  };

  return (
    <div className="ai-assistant-tab">
      <h3>AI Assistant</h3>
      <div className="ai-chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className="ai-chat-row">
            {msg.sender === 'ai' && (
              <div className="ai-avatar" title="AI">🤖</div>
            )}
            <div className={msg.sender === 'user' ? 'user-msg' : 'ai-msg'}>
              {msg.text}
            </div>
            {msg.sender === 'user' && (
              <div className="ai-avatar" title="You">🧑</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="ai-chat-row">
            <div className="ai-avatar" title="AI">🤖</div>
            <div className="ai-msg">AI is typing...</div>
          </div>
        )}
      </div>
      <div className="ai-input-row">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>Send</button>
      </div>
      {error && <div className="ai-error">{error}</div>}
    </div>
  );
};

export default AIAssistant;
