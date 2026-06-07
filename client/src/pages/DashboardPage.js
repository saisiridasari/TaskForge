import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { taskAPI } from '../services/api';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import Avatar from '../components/common/Avatar';
import './DashboardPage.css';

function StatCard({ label, value, color, icon, bg }) {
  return (
    <div className="stat-card" style={{ '--accent': color, '--accent-bg': bg }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
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

  const recentProjects = [...projects].slice(0, 5);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your projects today.</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          label="Total Projects"
          value={stats.totalProjects}
          color="#2563eb"
          bg="#eff6ff"
          icon={<svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
        <StatCard
          label="Active Tasks"
          value={stats.activeTasks}
          color="#7c3aed"
          bg="#f5f3ff"
          icon={<svg width="20" height="20" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round"/></svg>}
        />
        <StatCard
          label="Completed Tasks"
          value={stats.completedTasks}
          color="#059669"
          bg="#ecfdf5"
          icon={<svg width="20" height="20" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
        <StatCard
          label="Pending Deadlines"
          value={stats.pendingDeadlines}
          color="#d97706"
          bg="#fefce8"
          icon={<svg width="20" height="20" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round"/></svg>}
        />
      </div>

      {/* Recent Projects */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Recent Projects</h2>
          <Link to="/projects" className="section-link">View all</Link>
        </div>

        {loadingProjects ? (
          <div className="loading-row"><div className="spinner" /></div>
        ) : recentProjects.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
          </div>
        ) : (
          <div className="projects-list">
            {recentProjects.map((project) => (
              <Link to={`/projects/${project._id}`} key={project._id} className="project-row">
                <div className="project-color-dot" style={{ background: project.color || '#60a5fa' }} />
                <div className="project-row-info">
                  <span className="project-row-title">{project.title}</span>
                  {project.description && <span className="project-row-desc">{project.description}</span>}
                </div>
                <div className="project-row-meta">
                  <div className="member-stack">
                    {project.members?.slice(0, 4).map((m) => (
                      <Avatar key={m.user?._id} name={m.user?.name} size="sm" />
                    ))}
                  </div>
                  {project.deadline && (
                    <span className="project-deadline">
                      {format(new Date(project.deadline), 'MMM d')}
                    </span>
                  )}
                  <span className={`badge badge-${project.status}`}>{project.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
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
