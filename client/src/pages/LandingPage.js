import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const FEATURES = [
  {
    category: 'blue',
    icon: <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />,
    title: 'Drag & drop Kanban boards',
    desc: 'Organize work across boards and columns that update in real time for everyone on the project.',
  },
  {
    category: 'purple',
    icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />,
    title: 'AI project generation',
    desc: 'Describe an idea in plain language and get a full project plan — boards, tasks, estimates, dependencies — in seconds.',
  },
  {
    category: 'green',
    icon: <><path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" /></>,
    title: 'AI task intelligence',
    desc: 'Ask any task to explain itself, generate starter code, suggest tests, or flag risks — right where you\'re working.',
  },
  {
    category: 'gold',
    icon: <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />,
    title: 'Role-based team access',
    desc: 'Admins, managers, and members each see exactly the controls appropriate to their role.',
  },
  {
    category: 'blue',
    icon: <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />,
    title: 'Real-time notifications',
    desc: 'See task assignments, comments, and deadline reminders the moment they happen.',
  },
  {
    category: 'purple',
    icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />,
    title: 'Full activity history',
    desc: 'Every change to every project is logged — a complete, searchable audit trail.',
  },
];

const Logo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="8" height="8" rx="2" fill="var(--blue)"/>
    <rect x="13" y="3" width="8" height="8" rx="2" fill="var(--purple)"/>
    <rect x="3" y="13" width="8" height="8" rx="2" fill="var(--green)"/>
    <rect x="13" y="13" width="8" height="8" rx="2" fill="var(--blue)" opacity="0.5"/>
  </svg>
);

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <Logo />
            <span>TaskForge</span>
          </div>
          <nav className="landing-nav-links">
            <a href="#features">Features</a>
          </nav>
          <div className="landing-nav-actions">
            <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <h1 className="landing-hero-title">
          The AI-powered way<br />to run a project.
        </h1>
        <p className="landing-hero-desc">
          TaskForge combines real-time Kanban boards with an AI project manager —
          describe an idea, get a working plan, and let your team pick up from there.
        </p>
        <div className="landing-hero-actions">
          <Link to="/register" className="btn btn-primary">
            Get started free
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" id="features">
        <h2 className="landing-section-title">Everything your team needs</h2>
        <p className="landing-section-subtitle">One workspace for boards, AI planning, and real-time collaboration.</p>

        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <div className="landing-feature-card" key={f.title}>
              <div className={`landing-feature-icon landing-feature-icon-${f.category}`}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {f.icon}
                </svg>
              </div>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <h2 className="landing-cta-title">Ready to move faster?</h2>
        <p className="landing-cta-desc">Create your free account in under a minute.</p>
        <Link to="/register" className="btn btn-primary">Get started free</Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-logo">
          <Logo />
          <span>TaskForge</span>
        </div>
        <p className="landing-footer-copy">&copy; {new Date().getFullYear()} TaskForge. All rights reserved.</p>
      </footer>
    </div>
  );
}