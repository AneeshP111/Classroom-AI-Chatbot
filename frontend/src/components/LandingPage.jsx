import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#060918', color: '#F1F5F9', minHeight: '100vh', fontFamily: "'Outfit', sans-serif" }}>
      {/* Ambient Orbs */}
      <div style={{ position: 'fixed', width: '600px', height: '600px', top: '-200px', left: '-200px', background: 'rgba(99,102,241,0.2)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0, animation: 'orbFloat 18s ease-in-out infinite alternate' }}></div>
      <div style={{ position: 'fixed', width: '500px', height: '500px', bottom: '-150px', right: '-150px', background: 'rgba(6,182,212,0.15)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }}></div>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000, background: 'rgba(6,9,24,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(129,140,248,0.2)', padding: '1rem 0' }}>
        <div className="landing-nav-container">
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700 }}>
            🎓 <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ClassroomAI</span>
          </div>
          <div className="nav-links-wrap" style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
            <a href="#features" style={{ color: '#94A3B8', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>Features</a>
            <a href="#how" style={{ color: '#94A3B8', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>How It Works</a>
          </div>
          <button onClick={() => navigate('/login')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.35)', transition: 'all 0.25s' }}>
            Launch App →
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '5rem', position: 'relative', zIndex: 1 }}>
        <div className="landing-hero-grid">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.12)', color: '#818CF8', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(99,102,241,0.25)', marginBottom: '1.5rem', fontFamily: "'Space Grotesk', sans-serif" }}>
              ⚡ AI-Powered Education Platform
            </div>
            <h1 className="landing-hero-h1">
              The <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Smartest</span> Classroom You've Ever Been In
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '1.2rem', maxWidth: '500px', marginBottom: '2.5rem', lineHeight: 1.6 }}>
              Real-time AI tutoring, instant flashcards, adaptive quizzes, and live analytics — all in one platform built for modern education.
            </p>
            <div className="hero-actions-wrap" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/login')} style={{ padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '1.1rem', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 6px 24px rgba(99,102,241,0.35)', transition: 'all 0.25s', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                🚀 Open Classroom
              </button>
              <a href="#features" style={{ padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '1.1rem', background: 'transparent', color: '#F1F5F9', border: '1.5px solid rgba(129,140,248,0.2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                Explore Features ↓
              </a>
            </div>
          </div>
          <div>
            <img src="/landing_hero.png" alt="ClassroomAI" className="landing-hero-img" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="landing-stats-bar">
        {[
          { num: '100%', label: 'AI-Powered Answers' },
          { num: '3D', label: 'Interactive Flashcards' },
          { num: 'Live', label: 'Real-Time Analytics' },
          { num: '∞', label: 'Adaptive Difficulty' }
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', minWidth: '150px' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div>
            <div style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section id="features" style={{ padding: '6rem 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="landing-features-h2">
              Everything You Need to <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Learn & Teach</span>
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>A suite of AI-powered tools designed to make every lecture engaging, interactive, and measurable.</p>
          </div>
          <div className="landing-features-grid">
            {[
              { icon: '🤖', title: 'AI Chat Assistant', desc: 'Students ask questions and get instant, context-aware answers generated from the actual lecture PDFs uploaded by the teacher.' },
              { icon: '🧠', title: '3D Flashcards', desc: 'Generate interactive, flippable flashcards from any lecture in one click. Powered by AI to extract the most important concepts.' },
              { icon: '📊', title: 'Live Analytics', desc: 'Teachers see exactly what questions students are asking the AI in real-time, allowing them to address confusion instantly.' },
              { icon: '🎯', title: 'Adaptive Quizzes', desc: 'Generate quizzes at Easy, Medium, or Hard difficulty. Push them live to all students and watch the leaderboard update.' },
              { icon: '🏆', title: 'Gamification & Points', desc: 'Students earn points for correct answers. A real-time leaderboard keeps everyone motivated and engaged throughout class.' },
              { icon: '📧', title: 'Email Invitations', desc: "Teachers can invite students via email with one click. The invite includes the professor's name and a direct join link." }
            ].map((f, i) => (
              <div key={i} style={{ background: 'rgba(15,22,41,0.75)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: '20px', padding: '2.5rem 2rem', transition: 'all 0.3s ease', cursor: 'default' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: '1.5rem' }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', marginBottom: '0.75rem' }}>{f.title}</h3>
                <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" style={{ padding: '6rem 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="landing-features-h2">
              How <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ClassroomAI</span> Works
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '1.15rem' }}>Get started in under 60 seconds. No complex setup required.</p>
          </div>
          <div className="landing-how-grid">
            {[
              { num: '1', title: 'Teacher Starts a Session', desc: 'The teacher logs in, sets a topic, uploads lecture materials, and starts a live session. Students get an email invite automatically.' },
              { num: '2', title: 'Students Join & Interact', desc: 'Students enter the session code and instantly have access to the AI tutor, flashcards, and quizzes — all based on the lecture content.' },
              { num: '3', title: 'Learn, Compete & Grow', desc: 'Students earn points, climb the leaderboard, and revise with flashcards. Teachers monitor engagement through live analytics.' }
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)', color: 'white', display: 'flex', alignItems: 'center', justify_content: 'center', fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, margin: '0 auto 1.5rem', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>{s.num}</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '6rem 2rem', position: 'relative', zIndex: 1 }}>
        <div className="landing-cta-card">
          <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: 'linear-gradient(135deg, #6366F1, #06B6D4)', filter: 'blur(120px)', opacity: 0.25, pointerEvents: 'none' }}></div>
          <h2>
            Ready to Transform Your <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Classroom?</span>
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1.15rem', marginBottom: '2.5rem', position: 'relative' }}>Join the future of education. Start your first AI-powered session today.</p>
          <button onClick={() => navigate('/login')} style={{ padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '1.1rem', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 6px 24px rgba(99,102,241,0.35)', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            🎓 Launch ClassroomAI Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(129,140,248,0.2)', padding: '2.5rem 0', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem', position: 'relative', zIndex: 1 }}>
        Built with ❤️ using Gemini AI, React, Node.js & Socket.IO &nbsp;|&nbsp; © 2026 ClassroomAI
      </footer>
    </div>
  );
}
