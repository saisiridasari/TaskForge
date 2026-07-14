import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchAPI } from '../services/api';
import Avatar from '../components/common/Avatar';
import { format } from 'date-fns';
import './SearchPage.css';

function useDebounce(value, delay) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

const PRIORITIES = ['', 'high', 'medium', 'low'];
const TYPES = ['', 'tasks', 'projects', 'users'];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    if (!debouncedQuery && !priority) { setResults(null); return; }
    setLoading(true);
    const params = { q: debouncedQuery };
    if (type) params.type = type;
    if (priority) params.priority = priority;
    searchAPI.search(params)
      .then(res => setResults(res.data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQuery, type, priority]);

  const total = results
    ? (results.tasks?.length || 0) + (results.projects?.length || 0) + (results.users?.length || 0) + (results.boards?.length || 0)
    : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Search</h1>
          <p className="page-subtitle">Find tasks, projects, people and boards</p>
        </div>
      </div>

      {/* Filters */}
      <div className="search-filters">
        <div className="search-input-large">
          <svg width="18" height="18" fill="none" stroke="var(--text-4)" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            className="search-input-field"
            placeholder="Search everything…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {loading && <div className="spinner" style={{ width: 16, height: 16 }} />}
        </div>
        <div className="filter-row">
          <select className="form-input filter-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All Types</option>
            {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select className="form-input filter-select" value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">Any Priority</option>
            {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="search-results">
          <p className="results-count">{total} result{total !== 1 ? 's' : ''}</p>

          {/* Tasks */}
          {results.tasks?.length > 0 && (
            <div className="results-section">
              <h3 className="results-section-title">Tasks ({results.tasks.length})</h3>
              <div className="results-list card">
                {results.tasks.map((task, i) => (
                  <Link
                    key={task._id}
                    to={`/projects/${task.projectId?._id || task.projectId}`}
                    className="result-row"
                    style={{ borderBottom: i < results.tasks.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="result-icon task-result-icon">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round"/></svg>
                    </div>
                    <div className="result-body">
                      <span className="result-title">{task.title}</span>
                      <span className="result-sub">in {task.projectId?.title} · {task.boardId?.name}</span>
                    </div>
                    <div className="result-meta">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.dueDate && <span className="result-date">{format(new Date(task.dueDate), 'MMM d')}</span>}
                      <div style={{ display: 'flex' }}>
                        {task.assignedTo?.slice(0, 3).map(u => <Avatar key={u._id} name={u.name} size="sm" />)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {results.projects?.length > 0 && (
            <div className="results-section">
              <h3 className="results-section-title">Projects ({results.projects.length})</h3>
              <div className="results-list card">
                {results.projects.map((proj, i) => (
                  <Link
                    key={proj._id}
                    to={`/projects/${proj._id}`}
                    className="result-row"
                    style={{ borderBottom: i < results.projects.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="result-dot" style={{ background: proj.color || 'var(--blue)' }} />
                    <div className="result-body">
                      <span className="result-title">{proj.title}</span>
                      <span className="result-sub">{proj.description || 'No description'}</span>
                    </div>
                    <div className="result-meta">
                      <span className={`badge badge-${proj.status}`}>{proj.status}</span>
                      <div style={{ display: 'flex' }}>
                        {proj.members?.slice(0, 4).map(m => <Avatar key={m.user?._id} name={m.user?.name} size="sm" />)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Users */}
          {results.users?.length > 0 && (
            <div className="results-section">
              <h3 className="results-section-title">People ({results.users.length})</h3>
              <div className="results-list card">
                {results.users.map((u, i) => (
                  <div
                    key={u._id}
                    className="result-row"
                    style={{ borderBottom: i < results.users.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <Avatar name={u.name} src={u.avatar} />
                    <div className="result-body">
                      <span className="result-title">{u.name}</span>
                      <span className="result-sub">{u.email}</span>
                    </div>
                    <span className={`badge badge-${u.role === 'admin' ? 'active' : u.role === 'manager' ? 'medium' : 'low'}`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {total === 0 && !loading && (
            <div className="empty-state" style={{ marginTop: 60 }}>
              <svg width="48" height="48" fill="none" stroke="var(--text-4)" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <h3>No results found</h3>
              <p>Try different keywords or filters</p>
            </div>
          )}
        </div>
      )}

      {!results && !loading && (
        <div className="search-placeholder">
          <svg width="56" height="56" fill="none" stroke="var(--text-4)" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <h3>Start searching</h3>
          <p>Search across tasks, projects, people, and boards</p>
        </div>
      )}
    </div>
  );
}