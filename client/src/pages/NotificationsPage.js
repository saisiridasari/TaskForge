import React, { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import './NotificationsPage.css';

const TYPE_ICONS = {
  task_assigned: { icon: '📋', color: '#dbeafe', label: 'Task Assigned' },
  task_completed: { icon: '✅', color: '#d1fae5', label: 'Task Completed' },
  deadline_approaching: { icon: '⏰', color: '#fef3c7', label: 'Deadline' },
  team_invitation: { icon: '👥', color: '#ede9fe', label: 'Invitation' },
  general: { icon: '🔔', color: '#f3f4f6', label: 'Notification' },
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
          <svg width="52" height="52" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div className="notifications-list card">
          {notifications.map((n, i) => {
            const meta = TYPE_ICONS[n.type] || TYPE_ICONS.general;
            return (
              <div
                key={n._id}
                className={`notification-item ${!n.read ? 'unread' : ''}`}
                style={{ borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="notif-icon" style={{ background: meta.color }}>
                  <span style={{ fontSize: 16 }}>{meta.icon}</span>
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
                    style={{ color: '#ef4444' }}
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
