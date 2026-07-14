import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';
import './TeamPanel.css';

export default function TeamPanel({ project, onClose }) {
  const { addMember, removeMember } = useProject();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const canManage = project.owner?._id === user?._id || user?.role === 'admin';

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Enter an email address'); return; }
    setLoading(true);
    try {
      await addMember(project._id, email, role);
      toast.success('Member added');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await removeMember(project._id, userId);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal scale-in" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 className="modal-title">Team — {project.title}</h3>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="modal-body">
          {/* Add Member */}
          {canManage && (
            <div className="team-add-section">
              <h4 className="team-section-title">Invite by Email</h4>
              <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <select className="form-input" value={role} onChange={e => setRole(e.target.value)} style={{ width: 120 }}>
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flexShrink: 0 }}>
                  {loading ? '...' : 'Invite'}
                </button>
              </form>
            </div>
          )}

          {/* Members list */}
          <div>
            <h4 className="team-section-title" style={{ marginTop: 20 }}>
              Members ({project.members?.length || 0})
            </h4>
            <div className="team-members-list">
              {project.members?.map(m => {
                const u = m.user;
                if (!u) return null;
                const isOwner = project.owner?._id === u._id;
                return (
                  <div key={u._id} className="team-member-row">
                    <Avatar name={u.name} />
                    <div className="team-member-info">
                      <span className="team-member-name">
                        {u.name}
                        {isOwner && <span className="owner-tag">Owner</span>}
                      </span>
                      <span className="team-member-email">{u.email}</span>
                    </div>
                    <span className={`badge badge-${m.role === 'admin' ? 'active' : m.role === 'manager' ? 'medium' : 'low'}`}>
                      {m.role}
                    </span>
                    {canManage && !isOwner && u._id !== user?._id && (
                      <button
                        className="btn-icon"
                        onClick={() => handleRemove(u._id)}
                        title="Remove member"
                        style={{ color: 'var(--accent-warm)' }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}