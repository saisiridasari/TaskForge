import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, uploadAPI, projectAPI, taskAPI, activityAPI } from '../services/api';
import Avatar from '../components/common/Avatar';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const Icon = ({ d, size = 16, stroke = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={stroke} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    {Array.isArray(d)
      ? d.map((path, i) => <path key={i} d={path} />)
      : <path d={d} />}
  </svg>
);

const ICONS = {
  user:       'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  lock:       ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z','M7 11V7a5 5 0 0110 0v4'],
  bell:       'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  shield:     'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  activity:   ['M22 12h-4l-3 9L9 3l-3 9H2'],
  settings:   ['M12 15a3 3 0 100-6 3 3 0 000 6z','M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z'],
  camera:     ['M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z','M12 17a4 4 0 100-8 4 4 0 000 8'],
  briefcase:  ['M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z','M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2'],
  check:      'M20 6L9 17l-5-5',
  trash:      ['M3 6h18','M19 6l-1 14H6L5 6','M10 11v6','M14 11v6','M9 6V4h6v2'],
  eye:        ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 12m-3 0a3 3 0 106 0 3 3 0 00-6 0'],
  eyeOff:     ['M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94','M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19','M1 1l22 22'],
  logout:     'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  mail:       ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'],
  tag:        ['M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z','M7 7h.01'],
  grid:       ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  clock:      ['M12 22a10 10 0 100-20 10 10 0 000 20z','M12 6v6l4 2'],
  star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  info:       ['M12 22a10 10 0 100-20 10 10 0 000 20z','M12 16v-4','M12 8h.01'],
  chevronRight: 'M9 18l6-6-6-6',
};

const ALL_TABS = [
  { id: 'overview',      label: 'Overview',       icon: 'grid',     roles: ['admin','manager','member'] },
  { id: 'personal',      label: 'Personal Info',  icon: 'user',     roles: ['admin','manager','member'] },
  { id: 'password',      label: 'Password',       icon: 'lock',     roles: ['admin','manager','member'] },
  { id: 'notifications', label: 'Notifications',  icon: 'bell',     roles: ['admin','manager','member'] },
  { id: 'activity',      label: 'My Activity',    icon: 'activity', roles: ['admin','manager','member'] },
  { id: 'security',      label: 'Security',       icon: 'shield',   roles: ['admin','manager','member'] },
  { id: 'preferences',   label: 'Preferences',    icon: 'settings', roles: ['admin','manager','member'] },
  { id: 'workspace',     label: 'Workspace',      icon: 'briefcase',roles: ['admin','manager'] },
];

function StatCard({ label, value, iconKey, accentBg, accentColor }) {
  return (
    <div className="pf-stat-card">
      <div className="pf-stat-icon" style={{ background: accentBg, color: accentColor }}>
        <Icon d={ICONS[iconKey]} size={18} stroke={accentColor} />
      </div>
      <div>
        <div className="pf-stat-value">{value ?? '—'}</div>
        <div className="pf-stat-label">{label}</div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="pf-section-header">
      <h2 className="pf-section-title">{title}</h2>
      {subtitle && <p className="pf-section-subtitle">{subtitle}</p>}
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div className="pf-toggle-row">
      <div className="pf-toggle-info">
        <span className="pf-toggle-label">{label}</span>
        {sub && <span className="pf-toggle-sub">{sub}</span>}
      </div>
      <label className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', email: user?.email || '',
    avatar: user?.avatar || '', jobTitle: user?.jobTitle || '',
    department: user?.department || '', bio: user?.bio || '',
    phone: user?.phone || '', location: user?.location || '',
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [myActivity, setMyActivity] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    taskAssigned: true, taskCompleted: true, deadlineApproaching: true,
    teamInvitation: true, emailDigest: false, browserPush: false,
  });
  const [preferences, setPreferences] = useState({
    compactView: false, showCompletedTasks: true,
    defaultPriority: 'medium', weekStartsOn: 'monday',
  });
  const fileRef = useRef();

  const tabs = ALL_TABS.filter(t => t.roles.includes(user?.role));

  useEffect(() => {
    taskAPI.getStats().then(r => setStats(r.data.stats)).catch(() => {});
    projectAPI.getAll().then(r => setMyProjects(r.data.projects)).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'activity') {
      setActivityLoading(true);
      activityAPI.getMy().then(r => setMyActivity(r.data.activities)).catch(() => {}).finally(() => setActivityLoading(false));
    }
  }, [activeTab]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) { toast.error('Name is required'); return; }
    setProfileLoading(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setProfileLoading(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) { toast.error('Fill in all fields'); return; }
    if (passwordForm.newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPasswordLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPasswordLoading(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setAvatarLoading(true);
    try {
      const fd = new FormData(); fd.append('avatar', file);
      const res = await uploadAPI.uploadAvatar(fd);
      updateUser(res.data.user);
      setProfileForm(f => ({ ...f, avatar: res.data.avatar }));
      toast.success('Photo updated');
    } catch { toast.error('Upload failed — check Cloudinary config'); }
    finally { setAvatarLoading(false); e.target.value = ''; }
  };

  const getRoleBadgeStyle = (role) => {
    if (role === 'admin')   return { background: 'var(--purple-light)', color: 'var(--purple)' };
    if (role === 'manager') return { background: 'color-mix(in srgb, var(--accent-gold) 22%, var(--white))', color: '#8a6d2f' };
    return { background: 'var(--green-light)', color: 'var(--green)' };
  };

  const renderTab = () => {
    switch (activeTab) {

      case 'overview': return (
        <div className="pf-panel fade-in">
          <SectionHeader title="Overview" subtitle="Your workspace summary and recent activity" />

          {/* Stats row */}
          <div className="pf-stats-row">
            <StatCard label="Projects"       value={stats?.totalProjects}  iconKey="briefcase" accentBg="var(--blue-light)" accentColor="var(--blue-deep)" />
            <StatCard label="Active Tasks"   value={stats?.activeTasks}    iconKey="activity"  accentBg="var(--purple-light)" accentColor="var(--purple)" />
            <StatCard label="Completed"      value={stats?.completedTasks} iconKey="check"     accentBg="var(--green-light)" accentColor="var(--green)" />
            <StatCard label="Due Soon"       value={stats?.pendingDeadlines} iconKey="clock"   accentBg="color-mix(in srgb, var(--accent-gold) 20%, var(--white))" accentColor="var(--accent-gold)" />
          </div>

          {/* Role info card */}
          <div className="pf-role-card">
            <div className="pf-role-left">
              <div className="pf-role-avatar">
                <Avatar name={user?.name} src={user?.avatar} size="lg" />
              </div>
              <div className="pf-role-info">
                <div className="pf-role-name">{user?.name}</div>
                <div className="pf-role-email">{user?.email}</div>
                <div className="pf-role-meta">
                  <span className="badge" style={getRoleBadgeStyle(user?.role)}>{user?.role}</span>
                  <span className="pf-member-since">
                    <Icon d={ICONS.clock} size={13} stroke="var(--text-4)" />
                    Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('personal')}>
              Edit Profile <Icon d={ICONS.chevronRight} size={14} />
            </button>
          </div>

          {/* Role permissions */}
          <div className="pf-permissions-card">
            <div className="pf-permissions-title">
              <Icon d={ICONS.shield} size={15} stroke="var(--purple)" />
              Role Permissions — <span style={{ textTransform:'capitalize' }}>{user?.role}</span>
            </div>
            <div className="pf-permissions-grid">
              {getPermissions(user?.role).map(p => (
                <div key={p.label} className={`pf-permission-item ${p.granted ? 'granted' : 'denied'}`}>
                  <Icon d={p.granted ? ICONS.check : 'M18 6L6 18M6 6l12 12'} size={13}
                    stroke={p.granted ? 'var(--green)' : 'var(--accent-warm)'} />
                  {p.label}
                </div>
              ))}
            </div>
          </div>

          {/* My projects */}
          {myProjects.length > 0 && (
            <div className="pf-section-block">
              <div className="pf-block-title">
                <Icon d={ICONS.briefcase} size={15} stroke="var(--text-3)" />
                Projects ({myProjects.length})
              </div>
              <div className="pf-projects-list">
                {myProjects.slice(0, 5).map(p => (
                  <div key={p._id} className="pf-project-row">
                    <div className="pf-project-dot" style={{ background: p.color || 'var(--blue)' }} />
                    <span className="pf-project-name">{p.title}</span>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                    {p.deadline && (
                      <span className="pf-project-date">
                        <Icon d={ICONS.clock} size={12} stroke="var(--text-4)" />
                        {format(new Date(p.deadline), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

      case 'personal': return (
        <div className="pf-panel fade-in">
          <SectionHeader title="Personal Information" subtitle="Update your public profile and contact details" />
          <form onSubmit={handleProfileSave}>
            {/* Avatar */}
            <div className="pf-avatar-edit-row">
              <div className="avatar-upload-wrap">
                <Avatar name={user?.name} src={user?.avatar || profileForm.avatar} size="xl" />
                <button type="button" className="avatar-upload-btn" onClick={() => fileRef.current.click()} disabled={avatarLoading} title="Upload photo">
                  {avatarLoading
                    ? <div className="spinner" style={{ width:12,height:12,borderColor:'rgba(255,255,255,0.4)',borderTopColor:'white' }} />
                    : <Icon d={ICONS.camera} size={13} stroke="white" />}
                </button>
                <input ref={fileRef} type="file" style={{ display:'none' }} accept="image/*" onChange={handleAvatarUpload} />
              </div>
              <div className="pf-avatar-hint">
                <p className="pf-avatar-hint-title">Profile photo</p>
                <p className="pf-avatar-hint-sub">JPG, PNG or WebP. Max 5MB.</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current.click()}>
                  <Icon d={ICONS.camera} size={13} /> Change photo
                </button>
              </div>
            </div>

            <div className="pf-form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name:e.target.value})} placeholder="Jane Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div className="input-icon-wrap">
                  <Icon d={ICONS.mail} size={15} stroke="var(--text-4)" />
                  <input className="form-input with-icon" type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email:e.target.value})} placeholder="you@example.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input className="form-input" value={profileForm.jobTitle} onChange={e => setProfileForm({...profileForm, jobTitle:e.target.value})} placeholder="e.g. Product Designer" />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={profileForm.department} onChange={e => setProfileForm({...profileForm, department:e.target.value})} placeholder="e.g. Engineering" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone:e.target.value})} placeholder="+1 555 000 0000" />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={profileForm.location} onChange={e => setProfileForm({...profileForm, location:e.target.value})} placeholder="City, Country" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio:e.target.value})} placeholder="A short bio about yourself…" style={{ resize:'vertical' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Timezone</label>
              <input className="form-input" value={profileForm.timezone} onChange={e => setProfileForm({...profileForm, timezone:e.target.value})} placeholder="America/New_York" />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar URL <span style={{ fontWeight:400, color:'var(--text-4)' }}>(or use photo upload above)</span></label>
              <input className="form-input" value={profileForm.avatar} onChange={e => setProfileForm({...profileForm, avatar:e.target.value})} placeholder="https://example.com/photo.jpg" />
            </div>

            <div className="pf-form-actions">
              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                {profileLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      );

      case 'password': return (
        <div className="pf-panel fade-in">
          <SectionHeader title="Change Password" subtitle="Use a strong password with at least 6 characters" />
          <form onSubmit={handlePasswordSave} style={{ maxWidth: 440 }}>
            {[
              { key:'currentPassword', label:'Current Password',  show:'current', placeholder:'Enter current password' },
              { key:'newPassword',     label:'New Password',      show:'next',    placeholder:'Min. 6 characters' },
              { key:'confirmPassword', label:'Confirm Password',  show:'confirm', placeholder:'Repeat new password' },
            ].map(({ key, label, show, placeholder }) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <div className="password-input-wrap">
                  <input
                    type={showPassword[show] ? 'text' : 'password'}
                    className="form-input"
                    value={passwordForm[key]}
                    onChange={e => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                    placeholder={placeholder}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(p => ({ ...p, [show]: !p[show] }))}>
                    <Icon d={showPassword[show] ? ICONS.eyeOff : ICONS.eye} size={15} stroke="var(--text-4)" />
                  </button>
                </div>
              </div>
            ))}

            <div className="pf-password-tips">
              <div className="pf-tip-title"><Icon d={ICONS.info} size={14} stroke="var(--blue-deep)" /> Tips for a strong password</div>
              <ul className="pf-tip-list">
                <li>At least 8 characters</li>
                <li>Mix of uppercase and lowercase</li>
                <li>At least one number or symbol</li>
                <li>Avoid personal information</li>
              </ul>
            </div>

            <div className="pf-form-actions">
              <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                {passwordLoading ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      );

      case 'notifications': return (
        <div className="pf-panel fade-in">
          <SectionHeader title="Notification Preferences" subtitle="Choose what you want to be notified about" />

          <div className="pf-prefs-section">
            <div className="pf-prefs-section-label">In-app notifications</div>
            <ToggleRow label="Task assigned to me"         sub="When someone assigns a task to you"         checked={notifPrefs.taskAssigned}        onChange={v => setNotifPrefs(p=>({...p,taskAssigned:v}))} />
            <ToggleRow label="Task completed"              sub="When an assigned task is marked done"        checked={notifPrefs.taskCompleted}        onChange={v => setNotifPrefs(p=>({...p,taskCompleted:v}))} />
            <ToggleRow label="Deadline approaching"        sub="2 days before a task or project deadline"    checked={notifPrefs.deadlineApproaching}  onChange={v => setNotifPrefs(p=>({...p,deadlineApproaching:v}))} />
            <ToggleRow label="Team invitations"            sub="When you are added to a project"             checked={notifPrefs.teamInvitation}       onChange={v => setNotifPrefs(p=>({...p,teamInvitation:v}))} />
          </div>

          <div className="pf-prefs-section" style={{ marginTop:24 }}>
            <div className="pf-prefs-section-label">Email & push</div>
            <ToggleRow label="Weekly email digest"         sub="Summary of your tasks every Monday"          checked={notifPrefs.emailDigest}          onChange={v => setNotifPrefs(p=>({...p,emailDigest:v}))} />
            <ToggleRow label="Browser push notifications"  sub="Requires browser permission"                 checked={notifPrefs.browserPush}          onChange={v => setNotifPrefs(p=>({...p,browserPush:v}))} />
          </div>

          <div className="pf-form-actions">
            <button className="btn btn-primary" onClick={() => toast.success('Preferences saved')}>
              Save Preferences
            </button>
          </div>
        </div>
      );

      case 'activity': return (
        <div className="pf-panel fade-in">
          <SectionHeader title="My Activity" subtitle="Everything you have done across all projects" />

          {activityLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
              <div className="spinner" style={{ width:28,height:28 }} />
            </div>
          ) : myActivity.length === 0 ? (
            <div className="pf-empty">
              <Icon d={ICONS.activity} size={40} stroke="var(--text-4)" />
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <div className="pf-activity-list">
              {myActivity.map((a, i) => (
                <div key={a._id} className="pf-activity-item">
                  <div className="pf-activity-dot" />
                  {i < myActivity.length - 1 && <div className="pf-activity-line" />}
                  <div className="pf-activity-body">
                    <span className="pf-activity-text">
                      {a.action}
                      {a.project && <span className="pf-activity-project"> in {a.project.title}</span>}
                    </span>
                    <span className="pf-activity-time">
                      <Icon d={ICONS.clock} size={12} stroke="var(--text-4)" />
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

      case 'security': return (
        <div className="pf-panel fade-in">
          <SectionHeader title="Security" subtitle="Manage your sessions and account security" />

          <div className="pf-security-card">
            <div className="pf-security-row">
              <div className="pf-security-icon" style={{ background: 'var(--green-light)' }}>
                <Icon d={ICONS.shield} size={18} stroke="var(--green)" />
              </div>
              <div className="pf-security-info">
                <span className="pf-security-label">Password protection</span>
                <span className="pf-security-sub">Last changed — unknown</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('password')}>
                Change <Icon d={ICONS.chevronRight} size={13} />
              </button>
            </div>

            <div className="pf-security-row">
              <div className="pf-security-icon" style={{ background: 'var(--blue-light)' }}>
                <Icon d={ICONS.mail} size={18} stroke="var(--blue-deep)" />
              </div>
              <div className="pf-security-info">
                <span className="pf-security-label">Email verification</span>
                <span className="pf-security-sub">{user?.email}</span>
              </div>
              <span className="pf-verified-badge">
                <Icon d={ICONS.check} size={12} stroke="var(--green)" /> Verified
              </span>
            </div>
          </div>

          <div className="pf-section-block" style={{ marginTop:28 }}>
            <div className="pf-block-title">
              <Icon d={ICONS.clock} size={15} stroke="var(--text-3)" />
              Active sessions
            </div>
            <div className="pf-session-card">
              <div className="pf-session-dot active" />
              <div className="pf-session-info">
                <span className="pf-session-name">Current session — this browser</span>
                <span className="pf-session-sub">Logged in now · JWT expires in 7 days</span>
              </div>
              <span className="pf-session-current">Current</span>
            </div>
          </div>

          <div className="pf-danger-zone">
            <div className="pf-danger-title">
              <Icon d={ICONS.info} size={15} stroke="var(--accent-warm)" />
              Danger Zone
            </div>
            <div className="pf-danger-row">
              <div>
                <div className="pf-danger-label">Sign out of all devices</div>
                <div className="pf-danger-sub">This will invalidate your current token</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => { logout(); window.location.href = '/login'; }}>
                <Icon d={ICONS.logout} size={14} stroke="var(--accent-warm)" /> Sign out
              </button>
            </div>
          </div>
        </div>
      );

      case 'preferences': return (
        <div className="pf-panel fade-in">
          <SectionHeader title="Preferences" subtitle="Customize how TaskFlow looks and behaves for you" />

          <div className="pf-prefs-section">
            <div className="pf-prefs-section-label">Display</div>
            <ToggleRow label="Compact view"        sub="Denser task cards and tighter spacing"     checked={preferences.compactView}         onChange={v => setPreferences(p=>({...p,compactView:v}))} />
            <ToggleRow label="Show completed tasks" sub="Display completed tasks on boards"         checked={preferences.showCompletedTasks}   onChange={v => setPreferences(p=>({...p,showCompletedTasks:v}))} />
          </div>

          <div className="pf-prefs-section" style={{ marginTop:24 }}>
            <div className="pf-prefs-section-label">Defaults</div>
            <div className="pf-select-row">
              <div className="pf-select-info">
                <span className="pf-toggle-label">Default task priority</span>
                <span className="pf-toggle-sub">Pre-selected when creating a new task</span>
              </div>
              <select className="form-input" style={{ width:140 }} value={preferences.defaultPriority} onChange={e => setPreferences(p=>({...p,defaultPriority:e.target.value}))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="pf-select-row" style={{ marginTop:12 }}>
              <div className="pf-select-info">
                <span className="pf-toggle-label">Week starts on</span>
                <span className="pf-toggle-sub">Used in the calendar view</span>
              </div>
              <select className="form-input" style={{ width:140 }} value={preferences.weekStartsOn} onChange={e => setPreferences(p=>({...p,weekStartsOn:e.target.value}))}>
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          </div>

          <div className="pf-form-actions">
            <button className="btn btn-primary" onClick={() => toast.success('Preferences saved')}>
              Save Preferences
            </button>
          </div>
        </div>
      );

      case 'workspace': return (
        <div className="pf-panel fade-in">
          <SectionHeader title="Workspace" subtitle="Overview of your team and project workspace" />

          <div className="pf-stats-row" style={{ marginBottom:28 }}>
            <StatCard label="Total Projects"  value={myProjects.length}                                iconKey="briefcase" accentBg="var(--blue-light)"  accentColor="var(--blue-deep)" />
            <StatCard label="Active Projects" value={myProjects.filter(p=>p.status==='active').length}  iconKey="activity"  accentBg="var(--green-light)"  accentColor="var(--green)" />
            <StatCard label="On Hold"         value={myProjects.filter(p=>p.status==='on-hold').length} iconKey="clock"     accentBg="color-mix(in srgb, var(--accent-gold) 20%, var(--white))"  accentColor="var(--accent-gold)" />
            <StatCard label="Completed"       value={myProjects.filter(p=>p.status==='completed').length} iconKey="star"   accentBg="var(--purple-light)"  accentColor="var(--purple)" />
          </div>

          {user?.role === 'admin' && (
            <div className="pf-admin-notice">
              <Icon d={ICONS.shield} size={16} stroke="var(--purple)" />
              <div>
                <div className="pf-admin-notice-title">Admin privileges active</div>
                <div className="pf-admin-notice-sub">You have full access to all projects, boards, tasks, and team management across the workspace.</div>
              </div>
            </div>
          )}

          <div className="pf-section-block">
            <div className="pf-block-title">
              <Icon d={ICONS.briefcase} size={15} stroke="var(--text-3)" /> All projects
            </div>
            {myProjects.length === 0 ? (
              <div className="pf-empty"><p>No projects yet</p></div>
            ) : (
              <div className="pf-workspace-table">
                <div className="pf-table-header">
                  <span>Project</span><span>Status</span><span>Members</span><span>Deadline</span>
                </div>
                {myProjects.map(p => (
                  <div key={p._id} className="pf-table-row">
                    <div className="pf-table-project">
                      <div className="pf-project-dot" style={{ background: p.color || 'var(--blue)' }} />
                      <span>{p.title}</span>
                    </div>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                    <span style={{ fontSize:13, color:'var(--text-3)' }}>{p.members?.length || 0} members</span>
                    <span style={{ fontSize:12, color:'var(--text-4)' }}>
                      {p.deadline ? format(new Date(p.deadline), 'MMM d, yyyy') : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account, preferences and workspace</p>
        </div>
      </div>

      <div className="profile-layout">

        <aside className="profile-sidebar card">
          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="avatar-upload-wrap">
              <Avatar name={user?.name} src={user?.avatar} size="xl" />
              <button className="avatar-upload-btn" onClick={() => { setActiveTab('personal'); setTimeout(() => fileRef.current?.click(), 200); }} title="Change photo">
                <Icon d={ICONS.camera} size={13} stroke="white" />
              </button>
            </div>
            <div>
              <h3 className="profile-name">{user?.name}</h3>
              <p className="profile-email">{user?.email}</p>
              <span className="badge" style={getRoleBadgeStyle(user?.role)}>{user?.role}</span>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="profile-tabs">
            {tabs.map(tab => (
              <button key={tab.id} className={`profile-tab ${activeTab===tab.id?'active':''}`} onClick={() => setActiveTab(tab.id)}>
                <Icon d={ICONS[tab.icon]} size={16} />
                {tab.label}
                {activeTab===tab.id && <Icon d={ICONS.chevronRight} size={13} stroke="var(--blue-deep)" style={{ marginLeft:'auto' }} />}
              </button>
            ))}
          </nav>

          {/* Quick stats footer */}
          <div className="pf-sidebar-stats">
            <div className="pf-sidebar-stat">
              <span className="pf-sidebar-stat-val">{stats?.totalProjects ?? 0}</span>
              <span className="pf-sidebar-stat-lbl">Projects</span>
            </div>
            <div className="pf-sidebar-divider" />
            <div className="pf-sidebar-stat">
              <span className="pf-sidebar-stat-val">{stats?.activeTasks ?? 0}</span>
              <span className="pf-sidebar-stat-lbl">Tasks</span>
            </div>
            <div className="pf-sidebar-divider" />
            <div className="pf-sidebar-stat">
              <span className="pf-sidebar-stat-val">{stats?.completedTasks ?? 0}</span>
              <span className="pf-sidebar-stat-lbl">Done</span>
            </div>
          </div>
        </aside>

        {/* ── Main ──────────────────────────────────────── */}
        <main className="profile-main card">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}

/* ── Permissions helper ─────────────────────────────────────────────── */
function getPermissions(role) {
  const all = [
    { label:'View all projects',          granted: true },
    { label:'Create projects',            granted: role==='admin'||role==='manager' },
    { label:'Delete any project',         granted: role==='admin' },
    { label:'Manage team members',        granted: role==='admin'||role==='manager' },
    { label:'Create and edit boards',     granted: role==='admin'||role==='manager' },
    { label:'Create and edit tasks',      granted: true },
    { label:'Delete any task',            granted: role==='admin'||role==='manager' },
    { label:'Set automation rules',       granted: role==='admin'||role==='manager' },
    { label:'View activity logs',         granted: true },
    { label:'Upload attachments',         granted: true },
    { label:'Manage workspace settings',  granted: role==='admin' },
  ];
  return all;
}