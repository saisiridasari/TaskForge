import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import Avatar from '../components/common/Avatar';
import ProjectModal from '../components/project/ProjectModal';
import AIGenerateProjectModal from '../components/project/AIGenerateProjectModal';
import toast from 'react-hot-toast';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const { projects, fetchProjects, loadingProjects, deleteProject } = useProject();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? All boards and tasks will be removed.')) return;
    try {
      await deleteProject(id);
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowAIModal(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Generate with AI
          </button>
          <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true); }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            New Project
          </button>
        </div>
      </div>

      {loadingProjects ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 80 }}>
          <svg width="56" height="56" fill="none" stroke="var(--text-4)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <h3>No projects yet</h3>
          <p>Click "New Project" to create your first project, or "Generate with AI" to describe an idea and let AI build the plan</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project._id} className="project-card">
              <div className="project-card-top" style={{ background: project.color || 'var(--blue)' }}>
                <div className="project-card-actions">
                  <div className="dropdown">
                    <button className="btn-icon project-menu-btn" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === project._id ? null : project._id); }}>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                    </button>
                    {openMenu === project._id && (
                      <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="dropdown-item" onClick={() => { setEditProject(project); setShowModal(true); setOpenMenu(null); }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Edit
                        </button>
                        {(project.owner?._id === user?._id || user?.role === 'admin') && (
                          <button className="dropdown-item danger" onClick={() => { handleDelete(project._id); setOpenMenu(null); }}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Link to={`/projects/${project._id}`} className="project-card-body">
                <div className="project-card-status">
                  <span className={`badge badge-${project.status}`}>{project.status}</span>
                </div>
                <h3 className="project-card-title">{project.title}</h3>
                {project.description && <p className="project-card-desc">{project.description}</p>}

                <div className="project-card-footer">
                  <div className="member-stack">
                    {project.members?.slice(0, 5).map((m) => (
                      <Avatar key={m.user?._id} name={m.user?.name} size="sm" />
                    ))}
                    {project.members?.length > 5 && (
                      <div className="avatar avatar-sm" style={{ background: 'var(--gray-2)', color: 'var(--text-3)' }}>
                        +{project.members.length - 5}
                      </div>
                    )}
                  </div>
                  {project.deadline && (
                    <span className="project-due">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/></svg>
                      {format(new Date(project.deadline), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
        />
      )}

      {showAIModal && (
        <AIGenerateProjectModal onClose={() => setShowAIModal(false)} />
      )}
    </div>
  );
}