import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../common/Avatar';
import SearchBar from '../common/SearchBar';
import './AppLayout.css';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { unreadCount, fetchNotifications } = useNotification();
  const { isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // NEW — collapsible desktop sidebar (icon-only mode). Persisted so the
  // choice survives a refresh, same pattern as ThemeContext. Scoped to
  // desktop only via CSS (see .sidebar.collapsed inside the media query
  // in AppLayout.css) — collapsing doesn't make sense on the mobile
  // overlay pattern, so it's disabled there regardless of this state.
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('taskflow_sidebar_collapsed') === 'true');

  useEffect(() => {
    localStorage.setItem('taskflow_sidebar_collapsed', collapsed);
  }, [collapsed]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
    { to: '/projects', label: 'Projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { to: '/calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { to: '/search', label: 'Search', icon: 'M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z' },
    { to: '/team', label: 'Team', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
    { to: '/notifications', label: 'Notifications', icon: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0', badge: unreadCount },
    { to: '/profile', label: 'Profile', icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
  ];

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="2" fill="var(--blue)"/>
                <rect x="13" y="3" width="8" height="8" rx="2" fill="var(--purple)"/>
                <rect x="3" y="13" width="8" height="8" rx="2" fill="var(--green)"/>
                <rect x="13" y="13" width="8" height="8" rx="2" fill="var(--blue)" opacity="0.5"/>
              </svg>
            </div>
            {/* Hidden via CSS when collapsed, not conditionally unmounted —
                keeps the transition smooth instead of text popping in/out abruptly. */}
            <span className="logo-text">TaskForge</span>
          </div>
          <div className="sidebar-header-actions">
            <button
              className="btn-icon"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            <div className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} title={isConnected ? 'Live' : 'Offline'} />
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d={item.icon} />
              </svg>
              <span className="nav-item-label">{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        {/* NEW — collapse toggle, pinned above the footer. Chevron flips
            direction based on state so it always points "the way this
            click will move the edge." */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {collapsed
              ? <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
          <span className="nav-item-label">Collapse</span>
        </button>

        <div className="sidebar-footer">
          <div className="user-info">
            <Avatar name={user?.name} src={user?.avatar} size="sm" />
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button className="btn-icon logout-btn" onClick={handleLogout} title="Logout">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button className="btn-icon menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="topbar-logo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="var(--blue)"/>
              <rect x="13" y="3" width="8" height="8" rx="2" fill="var(--purple)"/>
              <rect x="3" y="13" width="8" height="8" rx="2" fill="var(--green)"/>
            </svg>
            <span>TaskForge</span>
          </div>
          <div className="topbar-search">
            <SearchBar compact />
          </div>
        </header>

        <div className="page-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
}