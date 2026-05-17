import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Lightbulb, FileText, Edit2, Check, X, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../AuthContext';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const MarkdownComponents = {
  code({node, inline, className, children, ...props}) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match && match[1] === 'mermaid') {
      const mermaidCode = String(children).replace(/\n$/, '');
      const encodedCode = encodeURIComponent(mermaidCode);
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>body { margin: 0; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; }</style>
        </head>
        <body>
          <div id="graphContainer"></div>
          <script type="module">
            import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
            mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { primaryColor: '#e0f2fe', primaryTextColor: '#0f172a', primaryBorderColor: '#38bdf8', lineColor: '#0ea5e9' } });
            
            const renderGraph = async () => {
              try {
                const code = decodeURIComponent("${encodedCode}");
                const { svg } = await mermaid.render('mermaidGraph', code);
                document.getElementById('graphContainer').innerHTML = svg;
              } catch (err) {
                document.getElementById('graphContainer').innerHTML = '<div style="color: #ef4444; text-align: center;"><strong>Mermaid Syntax Error:</strong><br/>' + err.message + '</div>';
              }
            };
            renderGraph();
          </script>
        </body>
        </html>
      `;
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      return (
        <div style={{ position: 'relative', marginTop: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc' }}>
          <iframe 
            src={dataUrl} 
            style={{ width: '100%', height: '400px', border: 'none', display: 'block' }} 
            title="Mermaid Diagram"
          />
          <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #e2e8f0', textAlign: 'right', background: 'white' }}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                const win = window.open('', '_blank');
                if (win) {
                  win.document.write(html);
                  win.document.close();
                } else {
                  alert("Please allow pop-ups to view fullscreen diagrams.");
                }
              }} 
              style={{ 
                fontSize: '0.85rem', 
                color: '#0EA5E9', 
                fontFamily: '"Space Grotesk", sans-serif', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                fontWeight: '700', 
                padding: '0.2rem 0',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>↗</span> OPEN DIAGRAM FULLSCREEN
            </button>
          </div>
        </div>
      );
    }
    return <code className={className} {...props}>{children}</code>;
  },
  img({node, ...props}) {
    return (
      <a href={props.src} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '1rem', cursor: 'zoom-in' }} title="Click to view full size">
        <img 
          {...props} 
          style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'block' }}
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = `https://placehold.co/800x400/0f172a/0ea5e9?text=AI+Server+Timeout:+${encodeURIComponent(props.alt || 'Generation Failed')}`;
          }} 
        />
      </a>
    );
  }
};

export default function StudentInterface() {
  const navigate = useNavigate();
  const { user, login, logout, updateProfileName } = useAuth();
  const [socket, setSocket] = useState(null);
  const [sessionState, setSessionState] = useState({ isActive: false, topic: '' });
  const [hasJoined, setHasJoined] = useState(false);
  const [sessionCodeInput, setSessionCodeInput] = useState(() => new URLSearchParams(window.location.search).get('sessionCode') || '');
  
  const [messages, setMessages] = useState([{ text: "Hi! I'm your classroom AI assistant. Ask me anything about today's lecture.", sender: 'bot' }]);
  const [inputStr, setInputStr] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [activeFlashcards, setActiveFlashcards] = useState(null);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on('session_status_changed', (state) => {
      setSessionState(state);
      if (!state.isActive) setHasJoined(false); // kicked out if session ends
    });
    
    newSocket.on('ai_response', (data) => {
      setMessages(prev => [...prev, { text: data.answer, sender: 'bot' }]);
      setIsLoading(false);
    });

    newSocket.on('incoming_quiz', (quiz) => {
      setActiveQuiz(quiz);
      setSelectedAnswer(null);
    });

    newSocket.on('flashcards_received', (flashcards) => {
      setActiveFlashcards(flashcards);
      setCurrentFlashcardIndex(0);
      setIsFlipped(false);
      setIsLoading(false);
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingTime(0);
      interval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleJoinSession = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${SOCKET_SERVER_URL}/session/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode: sessionCodeInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setHasJoined(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputStr.trim()) return;

    setMessages(prev => [...prev, { text: inputStr, sender: 'user' }]);
    if (socket) {
      setIsLoading(true);
      socket.emit('student_ask_ai', { text: inputStr });
    }
    setInputStr('');
  };

  const handleRequestFlashcards = () => {
    if (socket) {
      setIsLoading(true);
      socket.emit('student_request_flashcards');
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

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === activeQuiz.correctAnswer;
    
    if (isCorrect) {
      if (socket && user) {
        const newPoints = (user.points || 0) + 10;
        socket.emit('student_submit_quiz', { email: user.email, points: 10 });
        login(user.token, user.role, user.email, user.name, newPoints);
        setQuizResult({ isCorrect: true, points: 10 });
      }
    } else {
      setQuizResult({ isCorrect: false });
    }
    
    setActiveQuiz(null);
  };

  const handleRequestSummary = () => {
    if (socket && sessionState.isActive) {
      setMessages(prev => [...prev, { text: "Can you summarize today's lecture materials?", sender: 'user' }]);
      setIsLoading(true);
      socket.emit('student_request_summary');
    }
  };

  if (!hasJoined) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh' }}>
        <div className="grid-2 animate-fade-in" style={{ width: '100%', maxWidth: '1000px', alignItems: 'center', gap: '4rem' }}>
          
          {/* Left Hero Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.4rem 1rem', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent-color)', borderRadius: '20px', fontWeight: 'bold', width: 'fit-content' }}>
              <Lightbulb size={16} style={{ marginRight: '0.5rem' }} /> Your AI-Powered Classroom
            </div>
            
            <h1 style={{ fontSize: '3rem', lineHeight: '1.2', margin: 0 }}>
              Learn Smarter, <br/>
              <span style={{ color: 'var(--accent-color)' }}>Not Harder.</span>
            </h1>
            
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              Join your live session to access real-time AI assistance, interactive flashcards, and adaptive quizzes generated instantly from your professor's lectures.
            </p>

            <img src="/hero_image.png" alt="Futuristic Cap" style={{ width: '100%', maxWidth: '350px', borderRadius: '24px', alignSelf: 'center', marginTop: '1rem', boxShadow: '0 20px 40px -10px rgba(14,165,233,0.3)' }} />
          </div>

          {/* Right Join Side */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <form className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '420px', textAlign: 'center', position: 'relative', overflow: 'hidden' }} onSubmit={handleJoinSession}>
              {/* Decorative background glow */}
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-color)', filter: 'blur(80px)', opacity: 0.3, zIndex: -1 }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.75rem' }}>Join Live Class</h2>
                <button type="button" className="btn" style={{ padding: '0.4rem 0.8rem', background: 'var(--danger-color)', color: 'white', fontSize: '0.85rem' }} onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}>
                  Logout
                </button>
              </div>
              
              {sessionState.isActive ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: 'var(--success-color)' }}>
                  <strong>A session is live!</strong> Check your email for the join link.
                </div>
              ) : (
                <div style={{ background: 'rgba(100, 116, 139, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                  Waiting for the teacher to start a session...
                </div>
              )}

              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>Session Code</label>
                <input 
                  className="input" 
                  placeholder="e.g. 123456" 
                  value={sessionCodeInput} 
                  onChange={e => setSessionCodeInput(e.target.value)} 
                  required 
                  disabled={!sessionState.isActive}
                  style={{ fontSize: '1.2rem', padding: '1rem', letterSpacing: '2px', textAlign: 'center' }}
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem' }} type="submit" disabled={!sessionState.isActive}>
                Enter Classroom
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="header glass-panel">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            Student Space 
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
                  {user?.name || 'Student'}
                  <button className="btn" style={{ padding: '0.2rem', background: 'transparent', color: 'var(--text-secondary)' }} onClick={() => { setEditNameInput(user?.name || ''); setIsEditingName(true); }}>
                    <Edit2 size={14} />
                  </button>
                </>
              )}
            </span>
          </h2>
          <div style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#d97706', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>
            🏆 {user?.points || 0} pts
          </div>
          <button className="btn" style={{ padding: '0.4rem 1rem', background: 'var(--danger-color)', color: 'white', marginLeft: '1rem', fontSize: '0.85rem' }} onClick={() => {
            logout();
            navigate('/');
          }}>
            Logout
          </button>
        </div>
        <div>
          {sessionState.isActive ? (
            <span style={{ color: 'var(--success-color)', fontSize: '0.9rem', fontWeight: 'bold' }}>
              ● Live: {sessionState.topic} {sessionState.teacherName ? `with Prof. ${sessionState.teacherName}` : ''}
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Waiting for teacher...</span>
          )}
        </div>
      </div>

      {activeQuiz && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '1.5rem', border: '2px solid var(--accent-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', marginBottom: '1rem' }}>
            <Lightbulb size={24} />
            <h3 style={{ margin: 0 }}>Pop Quiz!</h3>
          </div>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{activeQuiz.question}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {activeQuiz.options.map((opt, i) => (
              <button 
                key={i} 
                className={`quiz-option ${selectedAnswer === i ? 'selected' : ''}`}
                onClick={() => setSelectedAnswer(i)}
              >
                {opt}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleAnswerSubmit} disabled={selectedAnswer === null} style={{ width: '100%', justifyContent: 'center' }}>
            Submit Answer
          </button>
        </div>
      )}

      {activeFlashcards && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
              <BookOpen size={24} />
              <h3 style={{ margin: 0 }}>Flashcards ({currentFlashcardIndex + 1}/{activeFlashcards.length})</h3>
            </div>
            <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setActiveFlashcards(null)}>
              Close
            </button>
          </div>
          
          <div className="flashcard-container" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
              <div className="flashcard-front">
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Question / Concept</h4>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', width: '100%' }}>
                  <ReactMarkdown components={MarkdownComponents}>{activeFlashcards[currentFlashcardIndex]?.front || ''}</ReactMarkdown>
                </div>
                <p style={{ position: 'absolute', bottom: '1rem', fontSize: '0.85rem', opacity: 0.8 }}>Click to flip</p>
              </div>
              <div className="flashcard-back">
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>Answer</h4>
                <div style={{ fontSize: '1rem', width: '100%', textAlign: 'left', maxHeight: '150px', overflowY: 'auto', padding: '0 1rem' }}>
                  <ReactMarkdown components={MarkdownComponents}>{activeFlashcards[currentFlashcardIndex]?.back || ''}</ReactMarkdown>
                </div>
                <p style={{ position: 'absolute', bottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click to flip back</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button 
              className="btn" 
              disabled={currentFlashcardIndex === 0} 
              onClick={() => { setCurrentFlashcardIndex(prev => prev - 1); setIsFlipped(false); }}
            >
              Previous
            </button>
            <button 
              className="btn btn-primary" 
              disabled={currentFlashcardIndex === activeFlashcards.length - 1} 
              onClick={() => { setCurrentFlashcardIndex(prev => prev + 1); setIsFlipped(false); }}
            >
              Next Card
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel chat-container">
        <div className="chat-messages">
          {messages.map((m, i) => {
            let processedText = m.text;
            if (m.sender === 'bot') {
              // 1. Process standard [IMAGE: ] requests using Stable Diffusion / Flux
              processedText = processedText.replace(/\[IMAGE:\s*(.*?)\]/gi, (match, prompt) => {
                const safePrompt = prompt.replace(/[^a-zA-Z0-9\s-]/g, '').trim().substring(0, 100);
                const encodedPrompt = encodeURIComponent(safePrompt);
                return `\n\n![Stable Diffusion Image](https://image.pollinations.ai/prompt/${encodedPrompt})\n\n`;
              });
              
              // 2. Clean up any broken standard markdown images
              processedText = processedText.replace(/!\[([^\]]+)\](?:\(([^)]*)\))?/g, (match, alt, url) => {
                if (url && (url.includes('pollinations.ai') || url.includes('mermaid'))) return match;
                return ''; // remove broken raw markdown images
              });
            }
            return (
              <div key={i} className={`message ${m.sender}`}>
                {m.sender === 'bot' ? (
                  <ReactMarkdown components={MarkdownComponents}>
                    {processedText}
                  </ReactMarkdown>
                ) : (
                  m.text
                )}
              </div>
            );
          })}
          {isLoading && (
            <div className="loading-bubble">
              🤖 I'm analyzing the documents and getting your answer... ({loadingTime}s)
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <input 
            className="input" 
            placeholder={sessionState.isActive ? "Ask a question about the lecture..." : "Wait for the session to start..."}
            value={inputStr}
            onChange={e => setInputStr(e.target.value)}
            disabled={!sessionState.isActive}
          />
          <button type="button" onClick={handleRequestFlashcards} disabled={!sessionState.isActive} className="btn" style={{ background: '#10B981', color: 'white', padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }} title="Generate Flashcards">
            <BookOpen size={18} />
          </button>
          <button type="button" onClick={handleRequestSummary} disabled={!sessionState.isActive} className="btn" style={{ background: 'var(--accent-color)', color: 'white', padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }} title="Summarize Lecture">
            <FileText size={18} />
          </button>
          <button type="submit" disabled={!sessionState.isActive} className="btn-primary">
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Quiz Result Popup Modal */}
      {quizResult && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', zIndex: 9999, backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', borderRadius: '24px', width: '90%', animation: 'slideUp 0.4s ease-out' }}>
            {quizResult.isCorrect ? (
              <>
                <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'bounce 1s infinite alternate' }}>🎉🥳🏆</div>
                <h2 style={{ color: 'var(--success-color)', marginBottom: '1rem', fontSize: '2.5rem' }}>Brilliant!</h2>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  That is the correct answer. You earned <strong style={{ color: '#fbbf24' }}>+{quizResult.points} points</strong>!
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🤔💡😅</div>
                <h2 style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '2.5rem' }}>Not Quite!</h2>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  That was incorrect. Don't worry, keep learning and you'll get the next one!
                </p>
              </>
            )}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px' }} onClick={() => setQuizResult(null)}>
              Continue Learning
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
