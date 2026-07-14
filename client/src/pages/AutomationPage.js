import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { rulesAPI } from '../services/api';
import toast from 'react-hot-toast';
import './AutomationPage.css';

const TRIGGERS = [
  { value: 'task_moved_to_board', label: 'Task moved to a board' },
  { value: 'task_due_soon', label: 'Task due in 2 days' },
  { value: 'task_assigned', label: 'Task assigned to someone' },
  { value: 'project_deadline_changed', label: 'Project deadline changed' },
  { value: 'task_completed', label: 'Task marked as completed' },
  { value: 'task_created', label: 'New task created' },
];

const ACTIONS = [
  { value: 'notify_manager', label: 'Notify project managers' },
  { value: 'notify_assignees', label: 'Notify task assignees' },
  { value: 'notify_all_members', label: 'Notify all project members' },
  { value: 'create_reminder', label: 'Create a reminder notification' },
];

// Same inline stroke-icon pattern as ActivityPage.js — real icons instead
// of emoji, consistent with the rest of the app's icon language.
const icons = {
  move: <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" /></>,
  userPlus: <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12.5 7a4 4 0 100 8 4 4 0 000-8zM20 8v6M23 11h-6" strokeLinecap="round" strokeLinejoin="round" />,
  calendar: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />,
  checkCircle: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" /><polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" /></>,
  plus: <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />,
  sparkle: <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />,
};

const TRIGGER_ICONS = {
  task_moved_to_board: icons.move,
  task_due_soon: icons.clock,
  task_assigned: icons.userPlus,
  project_deadline_changed: icons.calendar,
  task_completed: icons.checkCircle,
  task_created: icons.plus,
};

export default function AutomationPage() {
  const { id: projectId } = useParams();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: 'task_completed', triggerValue: '', action: 'notify_manager', actionValue: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadRules(); }, [projectId]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await rulesAPI.getByProject(projectId);
      setRules(res.data.rules);
    } catch {}
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Rule name is required'); return; }
    setSaving(true);
    try {
      await rulesAPI.create(projectId, form);
      toast.success('Automation rule created');
      setShowForm(false);
      setForm({ name: '', trigger: 'task_completed', triggerValue: '', action: 'notify_manager', actionValue: '' });
      loadRules();
    } catch { toast.error('Failed to create rule'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (rule) => {
    try {
      await rulesAPI.update(rule._id, { enabled: !rule.enabled });
      setRules(prev => prev.map(r => r._id === rule._id ? { ...r, enabled: !r.enabled } : r));
    } catch { toast.error('Failed to update rule'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this automation rule?')) return;
    try {
      await rulesAPI.delete(id);
      setRules(prev => prev.filter(r => r._id !== id));
      toast.success('Rule deleted');
    } catch { toast.error('Failed to delete rule'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="back-link" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-3)', marginBottom:8, fontWeight:500 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to Board
          </Link>
          <h1 className="page-title">Automation</h1>
          <p className="page-subtitle">Create no-code workflow rules for this project</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          New Rule
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="automation-form card fade-in">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Create Automation Rule</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Rule Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Notify manager on task completion" />
            </div>
            <div className="rule-builder">
              <div className="rule-section">
                <div className="rule-section-label">
                  <span className="rule-badge if">IF</span>
                  Trigger
                </div>
                <select className="form-input" value={form.trigger} onChange={e => setForm({...form, trigger: e.target.value})}>
                  {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {form.trigger === 'task_moved_to_board' && (
                  <input className="form-input" style={{ marginTop: 8 }} value={form.triggerValue} onChange={e => setForm({...form, triggerValue: e.target.value})} placeholder="Board name (e.g. Done)" />
                )}
              </div>
              <div className="rule-arrow">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="rule-section">
                <div className="rule-section-label">
                  <span className="rule-badge then">THEN</span>
                  Action
                </div>
                <select className="form-input" value={form.action} onChange={e => setForm({...form, action: e.target.value})}>
                  {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>
            <div className="automation-form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create Rule'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" style={{ width:32, height:32 }} /></div>
      ) : rules.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <svg width="48" height="48" fill="none" stroke="var(--text-4)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <h3>No automation rules</h3>
          <p>Add rules to automate repetitive tasks and notifications</p>
        </div>
      ) : (
        <div className="rules-list">
          {rules.map(rule => {
            const triggerMeta = TRIGGERS.find(t => t.value === rule.trigger);
            const actionMeta = ACTIONS.find(a => a.value === rule.action);
            return (
              <div key={rule._id} className={`rule-card card ${!rule.enabled ? 'disabled' : ''}`}>
                <div className="rule-card-header">
                  <div className="rule-icon">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      {TRIGGER_ICONS[rule.trigger] || icons.sparkle}
                    </svg>
                  </div>
                  <div className="rule-info">
                    <span className="rule-name">{rule.name}</span>
                    <div className="rule-flow">
                      <span className="rule-badge if">IF</span>
                      <span className="rule-detail">{triggerMeta?.label}</span>
                      <span className="rule-badge then">THEN</span>
                      <span className="rule-detail">{actionMeta?.label}</span>
                    </div>
                  </div>
                  <div className="rule-card-actions">
                    <label className="toggle-switch" title={rule.enabled ? 'Disable' : 'Enable'}>
                      <input type="checkbox" checked={rule.enabled} onChange={() => handleToggle(rule)} />
                      <span className="toggle-slider" />
                    </label>
                    <button className="btn-icon" onClick={() => handleDelete(rule._id)} title="Delete" style={{ color: 'var(--accent-warm)' }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}