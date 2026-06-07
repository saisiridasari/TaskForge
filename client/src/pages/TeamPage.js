import React, { useEffect, useState } from 'react';
import { userAPI } from '../services/api';
import Avatar from '../components/common/Avatar';
import { format } from 'date-fns';
import './TeamPage.css';

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    userAPI.getAll().then(res => setUsers(res.data.users)).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{users.length} member{users.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
      </div>

      <div className="team-search-bar">
        <svg width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
        </svg>
        <input
          className="team-search-input"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <h3>No users found</h3>
          <p>Try a different search</p>
        </div>
      ) : (
        <div className="team-grid">
          {filtered.map(u => (
            <div key={u._id} className="team-card card">
              <div className="team-card-top">
                <Avatar name={u.name} size="lg" />
                <span className={`badge badge-${u.role === 'admin' ? 'active' : u.role === 'manager' ? 'medium' : 'low'}`}>
                  {u.role}
                </span>
              </div>
              <h3 className="team-card-name">{u.name}</h3>
              <p className="team-card-email">{u.email}</p>
              <div className="team-card-footer">
                <span className="team-joined">
                  Joined {format(new Date(u.createdAt || Date.now()), 'MMM yyyy')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
