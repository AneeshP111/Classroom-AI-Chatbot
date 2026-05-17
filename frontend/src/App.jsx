import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from './components/TeacherDashboard';
import StudentInterface from './components/StudentInterface';
import { AuthPage } from './components/Auth';
import LandingPage from './components/LandingPage';
import { useAuth } from './AuthContext';
import { Moon, Sun } from 'lucide-react';

function App() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <>
      <button 
        onClick={() => setIsDark(!isDark)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'var(--glass-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease'
        }}
        title="Toggle Theme"
      >
        {isDark ? <Sun size={24} /> : <Moon size={24} />}
      </button>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={!user ? <AuthPage /> : <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} />} />
        
        {/* Protected Routes */}
        <Route path="/teacher" element={
          user && user.role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/login" />
        } />
        
        <Route path="/student" element={
          user && user.role === 'student' ? <StudentInterface /> : <Navigate to="/login" />
        } />
        
        {/* Catch all redirect to landing */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
