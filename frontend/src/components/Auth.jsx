import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Bot, Cpu, Sparkles, BrainCircuit } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [teacherSecret, setTeacherSecret] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isLogin) {
      // Login
      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        login(data.token, data.role, data.email, data.name, data.points);
        navigate(data.role === 'teacher' ? '/teacher' : '/student');
      } catch (err) {
        alert(err.message);
      }
    } else {
      // Register
      try {
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role, teacherSecret })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        alert(data.message);
        setShowVerify(true);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verifyCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Email Verified! You can now log in.');
      setShowVerify(false);
      setIsLogin(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(data.message);
      setForgotStep(2);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verifyCode, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(data.message);
      setShowForgotPassword(false);
      setForgotStep(1);
      setVerifyCode('');
      setNewPassword('');
    } catch (err) {
      alert(err.message);
    }
  };

  if (showVerify) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <form className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }} onSubmit={handleVerify}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Verify Email</h2>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Check your email for a 4-digit verification code.</p>
          <div className="input-group">
            <label>Verification Code</label>
            <input className="input" type="text" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} type="submit">Verify Code</button>
        </form>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <form className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }} onSubmit={forgotStep === 1 ? handleForgotPassword : handleResetPassword}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Reset Password</h2>
          
          {forgotStep === 1 ? (
            <>
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Enter your email to receive a reset code.</p>
              <div className="input-group">
                <label>Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} type="submit">Send Reset Code</button>
            </>
          ) : (
            <>
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Check your email for the reset code.</p>
              <div className="input-group">
                <label>Reset Code</label>
                <input className="input" type="text" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input className="input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} type="submit">Reset Password</button>
            </>
          )}
          
          <p style={{ textAlign: 'center', marginTop: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => { setShowForgotPassword(false); setForgotStep(1); }}>
            Back to Login
          </p>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Left side branding with generated Techy Classroom image */}
      <div style={{ 
        flex: 1, 
        backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.85), rgba(30, 58, 138, 0.85)), url('https://image.pollinations.ai/prompt/clean%20techy%20futuristic%20classroom%20robot%20teacher%20hologram%20light%20theme%20dribbble?width=1080&height=1080&nologo=true')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '4rem', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        color: 'white',
        boxShadow: 'inset -10px 0 30px rgba(0,0,0,0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Floating AI Badge */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)', 
          padding: '0.5rem 1rem', 
          borderRadius: '50px', 
          border: '1px solid rgba(255,255,255,0.2)',
          marginBottom: '2rem',
          width: 'fit-content',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          <Sparkles size={18} color="#38BDF8" />
          <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#E0F2FE' }}>Powered by Gemini AI Vision</span>
        </div>

        <h1 style={{ fontSize: '4rem', marginBottom: '1.2rem', color: '#FFFFFF', textShadow: '0 4px 12px rgba(0,0,0,0.5)', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Bot size={56} color="#38BDF8" /> 
          Classroom AI
        </h1>
        <p style={{ color: '#E2E8F0', fontSize: '1.25rem', maxWidth: '400px', lineHeight: '1.7', textShadow: '0 2px 8px rgba(0,0,0,0.5)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Your intelligent learning companion. Ask questions, take quizzes, and understand your lectures better than ever before.
        </p>

        {/* Decorative Grid Icons */}
        <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem', opacity: 0.6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit size={32} color="#93C5FD" />
            <span style={{ fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif" }}>Neural Engine</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={32} color="#93C5FD" />
            <span style={{ fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif" }}>Real-time Processing</span>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <form className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '450px' }} onSubmit={handleAuth}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>
            {isLogin ? 'Welcome Back 👋' : 'Create Account ✨'}
          </h2>
        
        {!isLogin && (
          <div className="input-group">
            <label>Full Name</label>
            <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} required={!isLogin} />
          </div>
        )}

        <div className="input-group">
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        
        <div className="input-group">
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        {!isLogin && (
          <div className="input-group">
            <label>Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
        )}

        {!isLogin && role === 'teacher' && (
          <div className="input-group">
            <label>Teacher Secret Code</label>
            <input className="input" type="password" value={teacherSecret} onChange={e => setTeacherSecret(e.target.value)} required />
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} type="submit">
          {isLogin ? 'Login' : 'Register'}
        </button>

        {isLogin && (
          <p style={{ textAlign: 'center', marginTop: '1rem', cursor: 'pointer', color: 'var(--accent-color)', fontSize: '0.9rem' }} onClick={() => setShowForgotPassword(true)}>
            Forgot Password?
          </p>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
        </p>
      </form>
      </div>
    </div>
  );
}
