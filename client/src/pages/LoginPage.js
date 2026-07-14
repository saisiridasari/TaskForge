import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-branding">
          <Link to="/" className="auth-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="var(--blue)"/>
              <rect x="13" y="3" width="8" height="8" rx="2" fill="var(--purple)"/>
              <rect x="3" y="13" width="8" height="8" rx="2" fill="var(--green)"/>
              <rect x="13" y="13" width="8" height="8" rx="2" fill="var(--blue)" opacity="0.5"/>
            </svg>
            <span>TaskForge</span>
          </Link>
          <h1 className="auth-tagline">The AI-powered way<br />to run a project.</h1>
          <p className="auth-desc">
            Sign back in to your Kanban boards, your AI-generated project plans,
            and the team you're building with.
          </p>
          <Link to="/" className="auth-back-link">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to home
          </Link>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card fade-in">
          <h2 className="auth-title">Sign in</h2>
          <p className="auth-subtitle">Welcome back to TaskForge</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <><span className="spinner" style={{borderColor:'rgba(255,255,255,0.4)', borderTopColor:'white', width:16, height:16}} /> Signing in...</> : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}