import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AIGenerateProjectModal({ onClose }) {
  const navigate = useNavigate();
  const { fetchProjects } = useProject();
  const [idea, setIdea] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (idea.trim().length < 5) {
      toast.error('Describe your project idea in a bit more detail');
      return;
    }

    setLoading(true);
    setErrors(null);
    try {
      const techStack = techStackInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await aiAPI.generateProject({
        idea: idea.trim(),
        techStack,
        deadline: deadline || undefined, 
      });

      toast.success(`Project generated: ${res.data.project.title} (${res.data.taskCount} tasks)`);
      await fetchProjects();
      navigate(`/projects/${res.data.project._id}`);
      onClose();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
        toast.error('AI could not generate a valid project plan');
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong generating your project');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div className="modal scale-in">
        <div className="modal-header">
          <h3 className="modal-title">Generate Project with AI</h3>
          <button className="btn-icon" onClick={onClose} disabled={loading}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Describe your project *</label>
              <textarea
                className="form-input"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g. Build a food delivery platform using React, Express, MongoDB and Stripe."
                rows={4}
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred tech stack (optional)</label>
              <input
                className="form-input"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                placeholder="React, Express, MongoDB, Stripe"
                disabled={loading}
              />
              <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
                Comma-separated. Leave blank and the AI will infer a sensible stack.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Deadline (optional)</label>
              <input
                type="date"
                className="form-input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={loading}
              />
            </div>

            {errors && (
              <div style={{
                background: 'color-mix(in srgb, var(--accent-warm) 8%, var(--white))',
                border: '1px solid color-mix(in srgb, var(--accent-warm) 35%, var(--border))',
                borderRadius: 8,
                padding: '10px 12px',
                marginTop: 4,
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-warm)', marginBottom: 4 }}>
                  The AI's output didn't pass validation:
                </p>
                <ul style={{ fontSize: 12, color: 'var(--accent-warm)', paddingLeft: 18, margin: 0 }}>
                  {errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  Generating your project — this can take up to 30 seconds…
                </span>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Generating…' : 'Generate Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}