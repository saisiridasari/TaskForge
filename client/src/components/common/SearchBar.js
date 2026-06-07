import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../../services/api';
import Avatar from './Avatar';
import './SearchBar.css';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar({ compact }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const ref = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults(null); setOpen(false); return; }
    setLoading(true);
    searchAPI.search({ q: debouncedQuery })
      .then(res => { setResults(res.data.results); setOpen(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleNavigate = (path) => {
    navigate(path);
    setQuery('');
    setOpen(false);
  };

  const total = results
    ? (results.tasks?.length || 0) + (results.projects?.length || 0) + (results.users?.length || 0)
    : 0;

  return (
    <div className={`searchbar-wrap ${compact ? 'compact' : ''}`} ref={ref}>
      <div className="searchbar-input-wrap">
        <svg className="searchbar-icon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
        </svg>
        <input
          className="searchbar-input"
          placeholder="Search tasks, projects, people…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
        />
        {loading && <div className="spinner" style={{ width: 14, height: 14, marginRight: 8 }} />}
        {query && !loading && (
          <button className="searchbar-clear" onClick={() => { setQuery(''); setResults(null); setOpen(false); }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        )}
      </div>

      {open && results && (
        <div className="searchbar-dropdown">
          {total === 0 ? (
            <div className="search-empty">No results for "<strong>{query}</strong>"</div>
          ) : (
            <>
              {results.tasks?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-label">Tasks</div>
                  {results.tasks.slice(0, 5).map(task => (
                    <button key={task._id} className="search-item" onClick={() => handleNavigate(`/projects/${task.projectId?._id || task.projectId}`)}>
                      <div className="search-item-icon task-icon">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round"/></svg>
                      </div>
                      <div className="search-item-body">
                        <span className="search-item-title">{task.title}</span>
                        <span className="search-item-sub">{task.projectId?.title}</span>
                      </div>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.projects?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-label">Projects</div>
                  {results.projects.slice(0, 4).map(p => (
                    <button key={p._id} className="search-item" onClick={() => handleNavigate(`/projects/${p._id}`)}>
                      <div className="search-item-dot" style={{ background: p.color || '#60a5fa' }} />
                      <div className="search-item-body">
                        <span className="search-item-title">{p.title}</span>
                        <span className="search-item-sub">{p.members?.length} members</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.users?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-label">People</div>
                  {results.users.slice(0, 4).map(u => (
                    <button key={u._id} className="search-item" onClick={() => handleNavigate('/team')}>
                      <Avatar name={u.name} src={u.avatar} size="sm" />
                      <div className="search-item-body">
                        <span className="search-item-title">{u.name}</span>
                        <span className="search-item-sub">{u.email}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="search-footer">
                <button className="search-all-btn" onClick={() => handleNavigate(`/search?q=${encodeURIComponent(query)}`)}>
                  View all results →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
