import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { activityAPI } from '../services/api';
import Avatar from '../components/common/Avatar';
import { formatDistanceToNow } from 'date-fns';
import './ActivityPage.css';

// Small inline icon set, matching the same stroke-icon language used
// elsewhere in the app (nav items, task cards) rather than emoji.
const icons = {
  check: <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />,
  edit: <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" /></>,
  move: <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />,
  checkCircle: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" /><polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" /></>,
  calendar: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />,
  userPlus: <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12.5 7a4 4 0 100 8 4 4 0 000-8zM20 8v6M23 11h-6" strokeLinecap="round" strokeLinejoin="round" />,
  userMinus: <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12.5 7a4 4 0 100 8 4 4 0 000-8zM23 11h-6" strokeLinecap="round" strokeLinejoin="round" />,
  board: <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />,
  folder: <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />,
  comment: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />,
  paperclip: <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />,
  sparkle: <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />,
  bell: <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />,
};

// Category drives color (theme-aware, via CSS classes in ActivityPage.css)
// — not per-action hex values, so this stays correct across light/dark mode
// without any changes here if the theme changes later.
const ACTION_META = {
  task_created: { icon: icons.check, category: 'success' },
  task_updated: { icon: icons.edit, category: 'info' },
  task_deleted: { icon: icons.trash, category: 'danger' },
  task_moved: { icon: icons.move, category: 'accent' },
  task_completed: { icon: icons.checkCircle, category: 'success' },
  deadline_changed: { icon: icons.calendar, category: 'warning' },
  user_assigned: { icon: icons.userPlus, category: 'info' },
  user_removed: { icon: icons.userMinus, category: 'danger' },
  board_created: { icon: icons.board, category: 'info' },
  board_deleted: { icon: icons.trash, category: 'danger' },
  project_updated: { icon: icons.folder, category: 'accent' },
  comment_added: { icon: icons.comment, category: 'warning' },
  attachment_added: { icon: icons.paperclip, category: 'info' },
  attachment_deleted: { icon: icons.trash, category: 'danger' },
  ai_project_generated: { icon: icons.sparkle, category: 'accent' },
  default: { icon: icons.bell, category: 'neutral' },
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
          <svg width="48" height="48" fill="none" stroke="var(--text-4)" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>No activity yet</h3>
          <p>Actions on this project will appear here</p>
        </div>
      ) : (
        <div className="activity-timeline">
          {activities.map((activity, i) => {
            const meta = ACTION_META[activity.actionType] || ACTION_META.default;
            return (
              <div key={activity._id} className="activity-item">
                <div className="activity-icon-col">
                  <div className={`activity-icon activity-icon-${meta.category}`}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      {meta.icon}
                    </svg>
                  </div>
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