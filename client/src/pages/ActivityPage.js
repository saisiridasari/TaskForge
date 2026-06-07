import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { activityAPI } from '../services/api';
import Avatar from '../components/common/Avatar';
import { formatDistanceToNow } from 'date-fns';
import './ActivityPage.css';

const ACTION_ICONS = {
  task_created: { icon: '✅', bg: '#d1fae5' },
  task_updated: { icon: '✏️', bg: '#dbeafe' },
  task_deleted: { icon: '🗑️', bg: '#fee2e2' },
  task_moved: { icon: '↗️', bg: '#ede9fe' },
  task_completed: { icon: '🎉', bg: '#d1fae5' },
  deadline_changed: { icon: '📅', bg: '#fef3c7' },
  user_assigned: { icon: '👤', bg: '#dbeafe' },
  user_removed: { icon: '👋', bg: '#fee2e2' },
  board_created: { icon: '📋', bg: '#dbeafe' },
  board_deleted: { icon: '🗑️', bg: '#fee2e2' },
  project_updated: { icon: '📁', bg: '#ede9fe' },
  comment_added: { icon: '💬', bg: '#fef3c7' },
  attachment_added: { icon: '📎', bg: '#dbeafe' },
  attachment_deleted: { icon: '🗑️', bg: '#fee2e2' },
  default: { icon: '🔔', bg: '#f3f4f6' },
};

export default function ActivityPage() {
  const { id: projectId } = useParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { loadActivity(1); }, [projectId]);

  const loadActivity = async (p = 1) => {
    setLoading(true);
    try {
      const res = await activityAPI.getByProject(projectId, p);
      const { activities: data, pages, page: currentPage } = res.data;
      if (p === 1) setActivities(data);
      else setActivities(prev => [...prev, ...data]);
      setHasMore(currentPage < pages);
      setPage(currentPage);
    } catch (e) {}
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to Board
          </Link>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">Full audit trail for this project</p>
        </div>
      </div>

      {loading && page === 1 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <svg width="48" height="48" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>No activity yet</h3>
          <p>Actions on this project will appear here</p>
        </div>
      ) : (
        <div className="activity-timeline">
          {activities.map((activity, i) => {
            const meta = ACTION_ICONS[activity.actionType] || ACTION_ICONS.default;
            return (
              <div key={activity._id} className="activity-item">
                <div className="activity-icon-col">
                  <div className="activity-icon" style={{ background: meta.bg }}>{meta.icon}</div>
                  {i < activities.length - 1 && <div className="activity-line" />}
                </div>
                <div className="activity-content">
                  <div className="activity-row">
                    <Avatar name={activity.user?.name} src={activity.user?.avatar} size="sm" />
                    <div className="activity-text">
                      <span className="activity-actor">{activity.user?.name || 'Someone'}</span>
                      {' '}{activity.action}
                    </div>
                    <span className="activity-time">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <button
                className="btn btn-secondary"
                onClick={() => loadActivity(page + 1)}
                disabled={loading}
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
