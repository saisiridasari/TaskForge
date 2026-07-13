import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { aiAPI } from '../services/api';
import { format } from 'date-fns';
import Avatar from '../components/common/Avatar';
import TaskModal from '../components/task/TaskModal';
import BoardModal from '../components/board/BoardModal';
import TeamPanel from '../components/team/TeamPanel';
import toast from 'react-hot-toast';
import './ProjectBoardPage.css';

export default function ProjectBoardPage() {
  const { id } = useParams();
  const { currentProject, boards, tasks, fetchProjectBoard, loadingBoard, moveTask, deleteBoard, setBoards, setTasks } = useProject();
  const { user } = useAuth();
  const { joinProject, leaveProject, on, off } = useSocket();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [editBoard, setEditBoard] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => { fetchProjectBoard(id); }, [id]);

  // Socket real-time sync
  useEffect(() => {
    if (!id) return;
    joinProject(id);

    const handleTaskCreated = ({ task }) => {
      if (task?.createdBy?._id === user?._id) return;
      setTasks(prev => prev.find(t => t._id === task._id) ? prev : [...prev, task]);
    };

    const handleTaskUpdated = ({ task }) => {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    };

    const handleTaskMoved = ({ taskId, boardId, order, movedBy }) => {
      if (movedBy === user?._id) return;
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, boardId, order } : t));
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    };

    const handleBoardCreated = ({ board }) => {
      setBoards(prev => prev.find(b => b._id === board._id) ? prev : [...prev, board]);
    };

    const handleBoardUpdated = ({ board }) => {
      setBoards(prev => prev.map(b => b._id === board._id ? board : b));
    };

    const handleBoardDeleted = ({ boardId }) => {
      setBoards(prev => prev.filter(b => b._id !== boardId));
      setTasks(prev => prev.filter(t => t.boardId !== boardId));
    };

    const handleActiveUsers = (users) => setActiveUsers(users);
    const handleUserJoined = (u) => setActiveUsers(prev => prev.find(x => x.userId === u.userId) ? prev : [...prev, u]);
    const handleUserLeft = ({ userId }) => setActiveUsers(prev => prev.filter(u => u.userId !== userId));

    const handleCommentNew = ({ taskId, comment }) => {
      setTasks(prev => prev.map(t => {
        if (t._id !== taskId) return t;
        const exists = t.comments?.find(c => c._id === comment._id);
        if (exists) return t;
        return { ...t, comments: [...(t.comments || []), comment] };
      }));
    };

    on('task:created', handleTaskCreated);
    on('task:updated', handleTaskUpdated);
    on('task:moved', handleTaskMoved);
    on('task:deleted', handleTaskDeleted);
    on('board:created', handleBoardCreated);
    on('board:updated', handleBoardUpdated);
    on('board:deleted', handleBoardDeleted);
    on('project:active_users', handleActiveUsers);
    on('project:user_joined', handleUserJoined);
    on('project:user_left', handleUserLeft);
    on('comment:new', handleCommentNew);

    return () => {
      leaveProject(id);
      off('task:created', handleTaskCreated);
      off('task:updated', handleTaskUpdated);
      off('task:moved', handleTaskMoved);
      off('task:deleted', handleTaskDeleted);
      off('board:created', handleBoardCreated);
      off('board:updated', handleBoardUpdated);
      off('board:deleted', handleBoardDeleted);
      off('project:active_users', handleActiveUsers);
      off('project:user_joined', handleUserJoined);
      off('project:user_left', handleUserLeft);
      off('comment:new', handleCommentNew);
    };
  }, [id, user?._id]);

  const getTasksForBoard = (boardId) =>
    tasks.filter(t => t.boardId === boardId).sort((a, b) => a.order - b.order);

  // NEW — clears the AI Draft badge. Optimistic update (badge disappears
  // immediately) with rollback if the request actually fails, so a slow
  // network doesn't leave the UI looking unresponsive.
  const handleMarkReviewed = async (task) => {
    setTasks(prev => prev.map(t =>
      t._id === task._id
        ? { ...t, aiMetadata: { ...t.aiMetadata, reviewStatus: 'reviewed' } }
        : t
    ));
    try {
      await aiAPI.markReviewed(task._id);
    } catch (err) {
      // Revert on failure — badge comes back, user can try again.
      setTasks(prev => prev.map(t =>
        t._id === task._id
          ? { ...t, aiMetadata: { ...t.aiMetadata, reviewStatus: 'draft' } }
          : t
      ));
      toast.error('Failed to mark task as reviewed');
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    await moveTask(draggableId, destination.droppableId, destination.index);
  };

  if (loadingBoard) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
        <div className="spinner" style={{ width:36, height:36 }} />
      </div>
    );
  }

  if (!currentProject) {
    return <div className="empty-state" style={{ marginTop:80 }}><h3>Project not found</h3><p><Link to="/projects">Back to projects</Link></p></div>;
  }

  const canEdit = currentProject.owner?._id === user?._id || user?.role === 'admin' || user?.role === 'manager';
  const otherActiveUsers = activeUsers.filter(u => u.userId !== user?._id);

  return (
    <div className="board-page fade-in">
      <div className="board-header">
        <div className="board-header-left">
          <Link to="/projects" className="back-link">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Projects
          </Link>
          <div className="board-title-row">
            <div className="project-dot" style={{ background: currentProject.color || '#60a5fa' }} />
            <h1 className="board-title">{currentProject.title}</h1>
            <span className={`badge badge-${currentProject.status}`}>{currentProject.status}</span>
          </div>
          {currentProject.description && <p className="board-desc">{currentProject.description}</p>}
        </div>
        <div className="board-header-actions">
          {/* Active users indicator */}
          {otherActiveUsers.length > 0 && (
            <div className="active-users-indicator" title={`${otherActiveUsers.map(u => u.name).join(', ')} online`}>
              <div className="live-dot" />
              <div style={{ display:'flex' }}>
                {otherActiveUsers.slice(0, 4).map(u => (
                  <Avatar key={u.userId} name={u.name} size="sm" style={{ marginLeft: -6, border: '2px solid white' }} />
                ))}
              </div>
              <span className="active-label">{otherActiveUsers.length} online</span>
            </div>
          )}

          <div className="member-stack">
            {currentProject.members?.slice(0, 4).map(m => (
              <Avatar key={m.user?._id} name={m.user?.name} src={m.user?.avatar} />
            ))}
          </div>

          <Link to={`/projects/${id}/activity`} className="btn btn-secondary btn-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Activity
          </Link>
          <Link to={`/projects/${id}/automation`} className="btn btn-secondary btn-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Automation
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTeamPanel(true)}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Team
          </button>
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditBoard(null); setShowBoardModal(true); }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
              Add Board
            </button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-container">
          {boards.map((board) => {
            const boardTasks = getTasksForBoard(board._id);
            return (
              <div key={board._id} className="kanban-column">
                <div className="column-header">
                  <div className="column-header-left">
                    <div className="column-dot" style={{ background: board.color === '#e5e7eb' ? '#94a3b8' : board.color }} />
                    <span className="column-name">{board.name}</span>
                    <span className="column-count">{boardTasks.length}</span>
                  </div>
                  {canEdit && (
                    <div className="column-actions">
                      <button className="btn-icon" style={{ width:26, height:26 }} onClick={() => { setEditBoard(board); setShowBoardModal(true); }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button className="btn-icon" style={{ width:26, height:26 }} onClick={async () => {
                        if (window.confirm('Delete this board and all its tasks?')) {
                          try { const { boardAPI } = await import('../services/api'); await boardAPI.delete(board._id); toast.success('Board deleted'); }
                          catch { toast.error('Failed to delete board'); }
                        }
                      }}>
                        <svg width="12" height="12" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  )}
                </div>

                <Droppable droppableId={board._id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}>
                      {boardTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                              onClick={() => { setEditTask(task); setShowTaskModal(true); }}>
                              <div className="task-priority-bar" style={{ background: task.priority === 'high' ? '#f87171' : task.priority === 'medium' ? '#fbbf24' : '#34d399' }} />
                              <div className="task-content">
                                {/* NEW — AI Draft indicator. Only shows for AI-generated tasks
                                    still in draft review status (aiMetadata.reviewStatus === 'draft').
                                    Manually-created tasks have no aiMetadata at all, so this simply
                                    doesn't render for them. */}
                                {task.aiMetadata?.reviewStatus === 'draft' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMarkReviewed(task); }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: '#7c3aed',
                                      background: '#f5f3ff',
                                      border: '1px solid #ddd6fe',
                                      borderRadius: 20,
                                      padding: '2px 8px',
                                      marginBottom: 6,
                                      cursor: 'pointer',
                                    }}
                                    title="Click to mark as reviewed"
                                  >
                                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    AI Draft
                                  </button>
                                )}
                                {task.completed && <div className="task-completed-badge">✓ Done</div>}
                                <div className={`task-title ${task.completed ? 'completed' : ''}`}>{task.title}</div>
                                {task.description && <div className="task-desc">{task.description}</div>}
                                <div className="task-meta">
                                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                                  {task.dueDate && (
                                    <span className="task-due">
                                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/></svg>
                                      {format(new Date(task.dueDate), 'MMM d')}
                                    </span>
                                  )}
                                  {task.attachments?.length > 0 && (
                                    <span className="task-due">
                                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      {task.attachments.length}
                                    </span>
                                  )}
                                  {task.comments?.length > 0 && (
                                    <span className="task-due">
                                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      {task.comments.length}
                                    </span>
                                  )}
                                </div>
                                {task.assignedTo?.length > 0 && (
                                  <div className="task-assignees">
                                    {task.assignedTo.slice(0, 3).map(u => (
                                      <Avatar key={u._id} name={u.name} src={u.avatar} size="sm" />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      <button className="add-task-btn" onClick={() => { setSelectedBoard(board._id); setEditTask(null); setShowTaskModal(true); }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                        Add task
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}

          {boards.length === 0 && (
            <div className="empty-state" style={{ flex:1 }}>
              <h3>No boards yet</h3><p>Add a board to start organizing tasks</p>
            </div>
          )}
        </div>
      </DragDropContext>

      {showTaskModal && (
        <TaskModal
          task={editTask}
          boardId={selectedBoard || editTask?.boardId}
          projectId={id}
          members={currentProject.members}
          boards={boards}
          onClose={() => { setShowTaskModal(false); setEditTask(null); setSelectedBoard(null); }}
        />
      )}
      {showBoardModal && (
        <BoardModal board={editBoard} projectId={id} onClose={() => { setShowBoardModal(false); setEditBoard(null); }} />
      )}
      {showTeamPanel && (
        <TeamPanel project={currentProject} onClose={() => setShowTeamPanel(false)} />
      )}
    </div>
  );
}