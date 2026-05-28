import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Upload, Play, Square, MessageSquare, ArrowLeft, Edit2, Check, X, Send, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [sessionState, setSessionState] = useState({ isActive: false, topic: '', files: [] });
  const [topicInput, setTopicInput] = useState('');
  const [draftQuiz, setDraftQuiz] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [liveAnalytics, setLiveAnalytics] = useState([]);
  const { updateProfileName } = useAuth();
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Fetch initial leaderboard
    fetch(`${SOCKET_SERVER_URL}/students`)
      .then(res => res.json())
      .then(data => setLeaderboard(data))
      .catch(err => console.error("Failed to load students", err));

    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on('session_status_changed', (state) => setSessionState(state));
    newSocket.on('files_updated', (files) => setSessionState(prev => ({ ...prev, files })));
    newSocket.on('quiz_generated', (quiz) => setDraftQuiz(quiz));
    newSocket.on('leaderboard_updated', (students) => setLeaderboard(students));
    newSocket.on('analytics_updated', (analytics) => setLiveAnalytics(analytics));

    return () => newSocket.disconnect();
  }, []);

  const handleStartSession = async () => {
    try {
      const res = await fetch(`${SOCKET_SERVER_URL}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicInput || 'General Lecture', teacherName: user?.name || 'Teacher' })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start session');
      }
    } catch (err) {
      alert("Error starting session: " + err.message);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      const res = await fetch(`${SOCKET_SERVER_URL}/session/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: inviteEmail, 
          sessionCode: sessionState.sessionCode, 
          teacherName: user?.name || 'Teacher',
          topic: sessionState.topic
        })
      });
      if (res.ok) {
        alert("Invite sent!");
        setInviteEmail('');
      } else {
        alert("Failed to send invite");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleStopSession = async () => {
    try {
      const res = await fetch(`${SOCKET_SERVER_URL}/session/stop`, { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to stop session');
      }
    } catch (err) {
      alert("Error stopping session: " + err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch(`${SOCKET_SERVER_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert('Upload failed: ' + (errorData.error || res.statusText));
      }
    } catch (err) {
      alert('Network error while uploading: ' + err.message);
    } finally {
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateQuiz = () => {
    if (socket) socket.emit('teacher_generate_quiz', { difficulty: quizDifficulty });
  };

  const handlePushQuiz = () => {
    if (socket && draftQuiz) {
      socket.emit('teacher_push_quiz', draftQuiz);
      setDraftQuiz(null); // Clear draft after pushing
    }
  };

  const handleSaveName = async () => {
    try {
      const res = await fetch(`${SOCKET_SERVER_URL}/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: editNameInput })
      });
      if (res.ok) {
        updateProfileName(editNameInput);
        setIsEditingName(false);
      }
    } catch (err) {
      alert("Failed to update name");
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="header glass-panel">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            Teacher Dashboard 
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              - Welcome, 
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    className="input" 
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem', width: '150px' }} 
                    value={editNameInput} 
                    onChange={e => setEditNameInput(e.target.value)} 
                    placeholder="Enter name..."
                  />
                  <button className="btn btn-primary" style={{ padding: '0.2rem' }} onClick={handleSaveName}><Check size={16}/></button>
                  <button className="btn btn-danger" style={{ padding: '0.2rem' }} onClick={() => { setIsEditingName(false); setEditNameInput(''); }}><X size={16}/></button>
                </div>
              ) : (
                <>
                  Prof. {user?.name || 'Teacher'}
                  <button className="btn" style={{ padding: '0.2rem', background: 'transparent', color: 'var(--text-secondary)' }} onClick={() => { setEditNameInput(user?.name || ''); setIsEditingName(true); }}>
                    <Edit2 size={14} />
                  </button>
                </>
              )}
            </span>
          </h2>
          <button className="btn" style={{ padding: '0.4rem 1rem', background: 'var(--danger-color)', color: 'white', marginLeft: '1rem', fontSize: '0.85rem' }} onClick={() => {
            logout();
            navigate('/');
          }}>
            Logout
          </button>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {sessionState.isActive ? (
            <>
              <span style={{ color: 'var(--success-color)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--success-color)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px var(--success-color)' }}></span>
                Live: {sessionState.topic}
              </span>
              <div style={{ 
                fontSize: '1rem', 
                background: 'var(--bg-color)', 
                border: '1px solid var(--border-color)',
                padding: '0.5rem 1rem', 
                borderRadius: '12px', 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Session Code</span>
                <strong style={{ letterSpacing: '2px', color: 'var(--accent-color)', fontSize: '1.2rem', fontFamily: '"Space Grotesk", sans-serif' }}>
                  {sessionState.sessionCode}
                </strong>
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Session Inactive</span>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Session Controls */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3>Session Controls</h3>
          <div className="input-group" style={{ marginTop: '1.5rem' }}>
            <label>Lecture Topic</label>
            <input 
              className="input" 
              placeholder="e.g. Introduction to React" 
              value={topicInput} 
              onChange={e => setTopicInput(e.target.value)}
              disabled={sessionState.isActive}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {!sessionState.isActive ? (
              <button className="btn btn-primary" onClick={handleStartSession}>
                <Play size={20} /> Start Session
              </button>
            ) : (
              <button className="btn btn-danger" onClick={handleStopSession}>
                <Square size={20} /> Stop Session
              </button>
            )}
          </div>

          {sessionState.isActive && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <h3>Invite Students</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Send an email invite with a direct join link.</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  className="input" 
                  placeholder="student@example.com" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleInvite}>
                  <Send size={18} /> Send
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '3rem' }}>
            <h3>Upload Materials</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Upload slides or PDFs for the AI to analyze.</p>
            <input 
              type="file" 
              multiple 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
              ref={fileInputRef} 
            />
            <button className="btn glass-panel" style={{ width: '100%', justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()}>
              <Upload size={20} /> Select Files
            </button>
            
            {sessionState.files.length > 0 && (
              <ul style={{ marginTop: '1rem', listStyle: 'none' }}>
                {sessionState.files.map((f, i) => (
                  <li key={i} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem', borderRadius: '4px' }}>
                    📄 {f.originalName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: AI Tools */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3>AI Tools</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Generate interactive quizzes from your materials to engage students.</p>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <select 
              className="input" 
              style={{ flex: 1, padding: '0.75rem' }} 
              value={quizDifficulty}
              onChange={(e) => setQuizDifficulty(e.target.value)}
              disabled={!sessionState.isActive}
            >
              <option value="Easy">🟢 Easy</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Hard">🔴 Hard</option>
            </select>
            <button 
              className="btn btn-primary" 
              onClick={handleGenerateQuiz}
              disabled={!sessionState.isActive}
              style={{ flex: 2, justifyContent: 'center' }}
            >
              <MessageSquare size={20} /> Generate Question
            </button>
          </div>

          {draftQuiz && (
            <div className="quiz-card animate-fade-in" style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Draft Question</h4>
              <p style={{ fontWeight: '500', marginBottom: '1rem' }}>{draftQuiz.question}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {draftQuiz.options.map((opt, i) => (
                  <div key={i} style={{ padding: '0.5rem', background: i === draftQuiz.correctAnswer ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    {opt} {i === draftQuiz.correctAnswer && '✓'}
                  </div>
                ))}
              </div>
              <button className="btn" style={{ marginTop: '1rem', background: 'var(--success-color)', color: 'white', width: '100%', justifyContent: 'center' }} onClick={handlePushQuiz}>
                Push to Students
              </button>
            </div>
          )}

          <h3>Student Leaderboard</h3>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {leaderboard.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No verified students registered yet.</p>
            ) : (
              leaderboard.sort((a, b) => b.points - a.points).map((student, i) => (
                <div key={student.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontWeight: 'bold', color: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : 'var(--text-secondary)' }}>
                      #{i + 1}
                    </span>
                    <span>{student.name || student.email.split('@')[0]}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>
                    {student.points || 0} pts
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Live Analytics Panel */}
          <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>
              <Activity size={20} />
              <h3 style={{ margin: 0 }}>Live Insights</h3>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Real-time feed of questions students are asking the AI.</p>
            
            {liveAnalytics.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>No questions asked yet...</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[...liveAnalytics].reverse().map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-color)' }}>
                    <p style={{ margin: 0, fontWeight: '500' }}>"{item.question}"</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(item.time).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
