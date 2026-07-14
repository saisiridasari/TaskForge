import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { taskAPI } from '../services/api';
import { format } from 'date-fns';
import Avatar from '../components/common/Avatar';
import './DashboardPage.css';

function StatCard({ label, value, color, icon, bg }) {
  return (
    <div className="stat-card" style={{ '--accent': color, '--accent-bg': bg }}>
      <div className="stat-card-bar" />
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// NEW — recent projects now render as compact cards (same visual language
// as ProjectsPage's full cards, just denser) instead of a plain row list.
function RecentProjectCard({ project }) {
  return (
    <Link to={`/projects/${project._id}`} className="rp-card">
      <div className="rp-card-top" style={{ background: project.color || 'var(--blue)' }} />
      <div className="rp-card-body">
        <div className="rp-card-title-row">
          <span className="rp-card-title">{project.title}</span>
          <span className={`badge badge-${project.status}`}>{project.status}</span>
        </div>
        {project.description && <p className="rp-card-desc">{project.description}</p>}
        <div className="rp-card-footer">
          <div className="member-stack">
            {project.members?.slice(0, 4).map((m) => (
              <Avatar key={m.user?._id} name={m.user?.name} size="sm" />
            ))}
          </div>
          {project.deadline && (
            <span className="project-deadline">{format(new Date(project.deadline), 'MMM d')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, fetchProjects, loadingProjects } = useProject();
  const [stats, setStats] = useState({ totalProjects: 0, activeTasks: 0, completedTasks: 0, pendingDeadlines: 0 });

  useEffect(() => {
    fetchProjects();
    taskAPI.getStats().then(res => setStats(res.data.stats)).catch(() => {});
  }, [fetchProjects]);

  const recentProjects = [...projects].slice(0, 6);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">Here's what's happening with your projects today.</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          New Project
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total Projects"
          value={stats.totalProjects}
          color="var(--blue-deep)"
          bg="var(--blue-light)"
          icon={<svg width="20" height="20" fill="none" stroke="var(--blue-deep)" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
        <StatCard
          label="Active Tasks"
          value={stats.activeTasks}
          color="var(--purple)"
          bg="var(--purple-light)"
          icon={<svg width="20" height="20" fill="none" stroke="var(--purple)" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round"/></svg>}
        />
        <StatCard
          label="Completed Tasks"
          value={stats.completedTasks}
          color="var(--green)"
          bg="var(--green-light)"
          icon={<svg width="20" height="20" fill="none" stroke="var(--green)" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
        <StatCard
          label="Pending Deadlines"
          value={stats.pendingDeadlines}
          color="var(--accent-gold)"
          bg="color-mix(in srgb, var(--accent-gold) 20%, var(--white))"
          icon={<svg width="20" height="20" fill="none" stroke="var(--accent-gold)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round"/></svg>}
        />
      </div>

      {/* NEW — two-column layout: recent projects (cards) on the left,
          a quick-actions panel on the right. Stacks vertically on
          narrower screens (see media query in DashboardPage.css). */}
      <div className="dashboard-main">
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Projects</h2>
            <Link to="/projects" className="section-link">View all</Link>
          </div>

          {loadingProjects ? (
            <div className="loading-row"><div className="spinner" /></div>
          ) : recentProjects.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" fill="none" stroke="var(--text-4)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
            </div>
          ) : (
            <div className="rp-grid">
              {recentProjects.map((project) => (
                <RecentProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* NEW — right-side quick actions panel */}
        <aside className="dashboard-sidebar">
          <div className="dash-panel">
            <h3 className="dash-panel-title">Quick actions</h3>
            <Link to="/projects" className="dash-action-row">
              <div className="dash-action-icon dash-action-icon-blue">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
              </div>
              <div>
                <span className="dash-action-label">New project</span>
                <span className="dash-action-sub">Start from scratch</span>
              </div>
            </Link>
            <Link to="/projects" className="dash-action-row">
              <div className="dash-action-icon dash-action-icon-purple">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <span className="dash-action-label">Generate with AI</span>
                <span className="dash-action-sub">Describe an idea, get a plan</span>
              </div>
            </Link>
            <Link to="/team" className="dash-action-row">
              <div className="dash-action-icon dash-action-icon-green">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <span className="dash-action-label">View team</span>
                <span className="dash-action-sub">See everyone in your workspace</span>
              </div>
            </Link>
            <Link to="/calendar" className="dash-action-row">
              <div className="dash-action-icon dash-action-icon-gold">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <span className="dash-action-label">Check calendar</span>
                <span className="dash-action-sub">Upcoming deadlines</span>
              </div>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}