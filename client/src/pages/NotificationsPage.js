import React, { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import './NotificationsPage.css';

const icons = {
  clipboard: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" /></>,
  checkCircle: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" /><polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" /></>,
  users: <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />,
  bell: <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />,
};

const TYPE_META = {
  task_assigned: { icon: icons.clipboard, category: 'info', label: 'Task Assigned' },
  task_completed: { icon: icons.checkCircle, category: 'success', label: 'Task Completed' },
  deadline_approaching: { icon: icons.clock, category: 'warning', label: 'Deadline' },
  team_invitation: { icon: icons.users, category: 'accent', label: 'Invitation' },
  general: { icon: icons.bell, category: 'neutral', label: 'Notification' },
};

export default function NotificationsPage() {
  const { notifications, fetchNotifications, markRead, markAllRead, deleteNotification } = useNotification();

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const unread = notifications.filter(n => !n.read);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread.length} unread</p>
        </div>
        {unread.length > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 80 }}>
          <svg width="52" height="52" fill="none" stroke="var(--text-4)" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div className="notifications-list card">
          {notifications.map((n, i) => {
            const meta = TYPE_META[n.type] || TYPE_META.general;
            return (
              <div
                key={n._id}
                className={`notification-item ${!n.read ? 'unread' : ''}`}
                style={{ borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className={`notif-icon notif-icon-${meta.category}`}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    {meta.icon}
                  </svg>
                </div>
                <div className="notif-body">
                  <p className="notif-message">{n.message}</p>
                  <span className="notif-time">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="notif-actions">
                  {!n.read && (
                    <button
                      className="btn-icon notif-btn"
                      onClick={() => markRead(n._id)}
                      title="Mark as read"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                  <button
                    className="btn-icon notif-btn"
                    onClick={() => deleteNotification(n._id)}
                    title="Delete"
                    style={{ color: 'var(--accent-warm)' }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}