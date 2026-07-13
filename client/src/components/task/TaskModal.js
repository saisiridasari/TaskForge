import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { taskAPI, uploadAPI } from '../../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';
import './TaskModal.css';

const TABS = ['details', 'comments', 'attachments', 'activity', 'ai'];

export default function TaskModal({ task, boardId, projectId, members, boards, defaultDueDate, onClose }) {
  const { createTask, updateTask, deleteTask, tasks, setTasks } = useProject();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    dueDate: defaultDueDate || '', assignedTo: [], boardId: boardId || '', completed: false, labels: [],
  });
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef();

  // Live task data from context (for real-time comment/attachment updates)
  const liveTask = task ? tasks.find(t => t._id === task._id) || task : null;

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assignedTo: task.assignedTo?.map(u => u._id || u) || [],
        boardId: task.boardId || boardId || '',
        completed: task.completed || false,
        labels: task.labels || [],
      });
    } else {
      setForm(f => ({ ...f, boardId: boardId || '', dueDate: defaultDueDate || '' }));
    }
  }, [task, boardId, defaultDueDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Task title is required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, projectId };
      if (task) { await updateTask(task._id, payload); toast.success('Task updated'); }
      else { await createTask(payload); toast.success('Task created'); }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try { await deleteTask(task._id); toast.success('Task deleted'); onClose(); }
    catch { toast.error('Failed to delete task'); }
  };

  const toggleAssignee = (userId) => {
    setForm(f => ({
      ...f,
      assignedTo: f.assignedTo.includes(userId)
        ? f.assignedTo.filter(id => id !== userId)
        : [...f.assignedTo, userId],
    }));
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !task) return;
    setCommentLoading(true);
    try {
      const res = await taskAPI.addComment(task._id, { text: commentText.trim() });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, comments: res.data.comments } : t));
      setCommentText('');
      toast.success('Comment added');
    } catch { toast.error('Failed to add comment'); }
    finally { setCommentLoading(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!task) return;
    try {
      const res = await taskAPI.deleteComment(task._id, commentId);
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, comments: res.data.comments } : t));
    } catch { toast.error('Failed to delete comment'); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !task) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAPI.uploadAttachment(task._id, formData);
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, attachments: res.data.attachments } : t));
      toast.success('File uploaded');
    } catch { toast.error('Upload failed. Check Cloudinary config.'); }
    finally { setUploadLoading(false); e.target.value = ''; }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!task || !window.confirm('Delete this attachment?')) return;
    try {
      await uploadAPI.deleteAttachment(task._id, attachmentId);
      setTasks(prev => prev.map(t => t._id === task._id
        ? { ...t, attachments: t.attachments.filter(a => a._id !== attachmentId) }
        : t));
      toast.success('Attachment deleted');
    } catch { toast.error('Failed to delete attachment'); }
  };

  const getFileIcon = (type = '') => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('zip') || type.includes('compressed')) return '📦';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  };

  const currentComments = liveTask?.comments || [];
  const currentAttachments = liveTask?.attachments || [];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal task-modal scale-in">
        <div className="modal-header">
          <h3 className="modal-title">{task ? 'Task Details' : 'New Task'}</h3>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {task && (user?.role === 'admin' || user?.role === 'manager') && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            )}
            <button className="btn-icon" onClick={onClose}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        {task && (
          <div className="task-tabs">
            {TABS.map(tab => (
              <button key={tab} className={`task-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'ai' ? 'AI' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'comments' && currentComments.length > 0 && <span className="tab-count">{currentComments.length}</span>}
                {tab === 'attachments' && currentAttachments.length > 0 && <span className="tab-count">{currentAttachments.length}</span>}
              </button>
            ))}
          </div>
        )}

        <div className="modal-body task-modal-body">
          {/* DETAILS TAB */}
          {(!task || activeTab === 'details') && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="What needs to be done?" autoFocus={!task} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Add details…" rows={3} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({...form, dueDate:e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Board</label>
                <select className="form-input" value={form.boardId} onChange={e => setForm({...form, boardId:e.target.value})}>
                  {boards.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              {task && (
                <div className="form-group">
                  <label className="form-label" style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={form.completed} onChange={e => setForm({...form, completed:e.target.checked})} style={{ width:15, height:15, accentColor:'#34d399' }} />
                    Mark as completed
                  </label>
                </div>
              )}
              {members?.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Assign Members</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {members.map(m => {
                      const u = m.user; if (!u) return null;
                      const isAssigned = form.assignedTo.includes(u._id);
                      return (
                        <label key={u._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, cursor:'pointer', background:isAssigned?'#eff6ff':'transparent', border:`1.5px solid ${isAssigned?'#bfdbfe':'#e5e7eb'}`, transition:'all 0.12s' }}>
                          <input type="checkbox" checked={isAssigned} onChange={() => toggleAssignee(u._id)} style={{ width:15, height:15, accentColor:'#60a5fa' }} />
                          <Avatar name={u.name} src={u.avatar} size="sm" />
                          <span style={{ fontSize:13, fontWeight:500 }}>{u.name}</span>
                          <span style={{ fontSize:11, color:'#9ca3af', marginLeft:'auto' }}>{u.email}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="modal-footer" style={{ padding:'12px 0 0', marginTop:4 }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}</button>
              </div>
            </form>
          )}

          {/* COMMENTS TAB */}
          {task && activeTab === 'comments' && (
            <div className="tab-content">
              <div className="comments-list">
                {currentComments.length === 0 ? (
                  <div className="tab-empty">
                    <svg width="32" height="32" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <p>No comments yet</p>
                  </div>
                ) : (
                  currentComments.map(comment => (
                    <div key={comment._id} className="comment-item">
                      <Avatar name={comment.user?.name} src={comment.user?.avatar} size="sm" />
                      <div className="comment-bubble">
                        <div className="comment-meta">
                          <span className="comment-author">{comment.user?.name}</span>
                          <span className="comment-time">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                          {comment.user?._id === user?._id && (
                            <button className="comment-delete" onClick={() => handleDeleteComment(comment._id)}>
                              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                            </button>
                          )}
                        </div>
                        <p className="comment-text">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="comment-input-row">
                <Avatar name={user?.name} src={user?.avatar} size="sm" />
                <div className="comment-input-wrap">
                  <textarea
                    className="form-input comment-input"
                    placeholder="Write a comment…"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    rows={2}
                  />
                  <button className="btn btn-primary btn-sm comment-submit" onClick={handleAddComment} disabled={commentLoading || !commentText.trim()}>
                    {commentLoading ? '…' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ATTACHMENTS TAB */}
          {task && activeTab === 'attachments' && (
            <div className="tab-content">
              <div className="attachments-header">
                <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png,.gif,.webp,.txt,.xlsx,.pptx" />
                <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current.click()} disabled={uploadLoading}>
                  {uploadLoading ? (
                    <><div className="spinner" style={{ width:12, height:12, borderColor:'rgba(255,255,255,0.4)', borderTopColor:'white' }} /> Uploading…</>
                  ) : (
                    <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/></svg> Upload File</>
                  )}
                </button>
                <span className="attachments-note">PDF, DOCX, Images, ZIP — max 10MB</span>
              </div>

              {currentAttachments.length === 0 ? (
                <div className="tab-empty">
                  <svg width="32" height="32" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <p>No attachments yet</p>
                </div>
              ) : (
                <div className="attachments-list">
                  {currentAttachments.map(att => (
                    <div key={att._id} className="attachment-item">
                      <span className="attachment-icon">{getFileIcon(att.fileType)}</span>
                      <div className="attachment-info">
                        <span className="attachment-name">{att.fileName}</span>
                        <span className="attachment-meta">
                          {att.uploadedBy?.name} · {formatDistanceToNow(new Date(att.uploadedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="attachment-actions">
                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Download/View">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                        <button className="btn-icon" style={{ color:'#ef4444' }} onClick={() => handleDeleteAttachment(att._id)} title="Delete">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY TAB (task-level) */}
          {task && activeTab === 'activity' && (
            <div className="tab-content">
              <TaskActivityFeed taskId={task._id} />
            </div>
          )}

          {/* AI TAB */}
          {task && activeTab === 'ai' && (
            <div className="tab-content">
              <TaskAIPanel taskId={task._id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskActivityFeed({ taskId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activityAPI } = require('../../services/api');

  useEffect(() => {
    activityAPI.getByTask(taskId)
      .then(res => setActivities(res.data.activities))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:24 }}><div className="spinner" /></div>;
  if (!activities.length) return (
    <div className="tab-empty">
      <svg width="32" height="32" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <p>No activity recorded</p>
    </div>
  );

  return (
    <div className="task-activity-list">
      {activities.map(a => (
        <div key={a._id} className="task-activity-item">
          <Avatar name={a.user?.name} src={a.user?.avatar} size="sm" />
          <div style={{ flex:1 }}>
            <span style={{ fontSize:13, color:'var(--text-2)' }}>
              <strong>{a.user?.name}</strong> {a.action}
            </span>
            <div style={{ fontSize:11, color:'var(--text-4)', marginTop:2 }}>
              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// NEW — Phase 3 AI panel. Same co-located pattern as TaskActivityFeed above:
// its own local state, inline require() of the API module, reuses existing
// CSS classes (comment-bubble, comment-meta, tab-empty, spinner, etc.) so it
// looks native rather than bolted on.
//
// KNOWN LIMITATION: `exchanges` is session-only — closing and reopening the
// task modal clears what's shown here, even though the actual Q&A is still
// saved server-side in TaskConversation (summarization/context still works
// correctly behind the scenes). There's no GET endpoint yet to fetch past
// conversation history for display — a clean small addition later if you
// want the panel to remember what was asked across sessions.
const AI_MODES = [
  { key: 'explain', label: 'Explain' },
  { key: 'code', label: 'Generate Code' },
  { key: 'tests', label: 'Generate Tests' },
  { key: 'estimate', label: 'Estimate' },
  { key: 'review', label: 'Review' },
];

function TaskAIPanel({ taskId }) {
  const [loading, setLoading] = useState(false);
  const [exchanges, setExchanges] = useState([]);
  const [question, setQuestion] = useState('');
  const { aiAPI } = require('../../services/api');

  const runMode = async (mode) => {
    setLoading(true);
    try {
      const res = await aiAPI.askTask(taskId, { mode });
      setExchanges((prev) => [...prev, { mode, question: null, answer: res.data.answer }]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await aiAPI.askTask(taskId, { mode: 'ask', question: question.trim() });
      setExchanges((prev) => [...prev, { mode: 'ask', question: question.trim(), answer: res.data.answer }]);
      setQuestion('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {AI_MODES.map((m) => (
          <button
            key={m.key}
            className="btn btn-secondary btn-sm"
            onClick={() => runMode(m.key)}
            disabled={loading}
          >
            {m.label}
          </button>
        ))}
      </div>

      {exchanges.length === 0 && !loading && (
        <div className="tab-empty">
          <svg width="32" height="32" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p>Ask the AI something about this task, or pick an option above</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {exchanges.map((ex, i) => (
          <div key={i} className="comment-bubble" style={{ borderRadius: 'var(--radius)' }}>
            <div className="comment-meta">
              <span className="comment-author">
                {ex.question ? `You asked: "${ex.question}"` : AI_MODES.find((m) => m.key === ex.mode)?.label || ex.mode}
              </span>
            </div>
            <p className="comment-text">{ex.answer}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <div className="spinner" />
        </div>
      )}

      <div className="comment-input-row" style={{ marginTop: 16 }}>
        <div className="comment-input-wrap">
          <textarea
            className="form-input comment-input"
            placeholder="Ask a question about this task…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            rows={2}
          />
          <button
            className="btn btn-primary btn-sm comment-submit"
            onClick={handleAsk}
            disabled={loading || !question.trim()}
          >
            {loading ? '…' : 'Ask'}
          </button>
        </div>
      </div>
    </>
  );
}