import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import toast from 'react-hot-toast';

const BOARD_COLORS = [
  { label: 'Gray', value: '#e0d8cc' },
  { label: 'Blue', value: '#bbdefb' },
  { label: 'Green', value: '#b8c9a8' },
  { label: 'Gold', value: '#f0dfc0' },
  { label: 'Periwinkle', value: '#ccdbfd' },
  { label: 'Rose', value: '#e8c4b8' },
];

export default function BoardModal({ board, projectId, onClose }) {
  const { createBoard, updateBoard } = useProject();
  const [form, setForm] = useState({ name: '', color: '#e0d8cc' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (board) {
      setForm({ name: board.name || '', color: board.color || '#e0d8cc' });
    }
  }, [board]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Board name is required'); return; }
    setLoading(true);
    try {
      if (board) {
        await updateBoard(board._id, form);
        toast.success('Board updated');
      } else {
        await createBoard({ ...form, projectId });
        toast.success('Board created');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal scale-in" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3 className="modal-title">{board ? 'Edit Board' : 'New Board'}</h3>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Board Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. In Progress" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {BOARD_COLORS.map(c => (
                  <button key={c.value} type="button" onClick={() => setForm({ ...form, color: c.value })}
                    style={{ width: 32, height: 32, borderRadius: 8, background: c.value, border: form.color === c.value ? '2.5px solid var(--text)' : '2.5px solid transparent', cursor: 'pointer', transition: 'border 0.1s' }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : board ? 'Save Changes' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}