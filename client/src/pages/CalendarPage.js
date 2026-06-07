import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useProject } from '../context/ProjectContext';
import { taskAPI, projectAPI } from '../services/api';
import TaskModal from '../components/task/TaskModal';
import toast from 'react-hot-toast';
import './CalendarPage.css';

export default function CalendarPage() {
  const { projects, fetchProjects, boards } = useProject();
  const [events, setEvents] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [projectBoardsMap, setProjectBoardsMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    loadAllTasks();
  }, [projects, selectedProjectId]);

  const loadAllTasks = async () => {
    if (!projects.length) return;
    setLoading(true);
    try {
      const filteredProjects = selectedProjectId === 'all'
        ? projects
        : projects.filter(p => p._id === selectedProjectId);

      const allTasks = [];
      for (const proj of filteredProjects) {
        const res = await taskAPI.getByProject(proj._id);
        res.data.tasks.forEach(task => {
          if (task.dueDate) {
            allTasks.push({
              id: task._id,
              title: task.title,
              date: task.dueDate,
              backgroundColor: task.completed ? '#34d399'
                : task.priority === 'high' ? '#fca5a5'
                : task.priority === 'medium' ? '#fde68a' : '#bfdbfe',
              borderColor: task.completed ? '#10b981'
                : task.priority === 'high' ? '#ef4444'
                : task.priority === 'medium' ? '#f59e0b' : '#60a5fa',
              textColor: '#111827',
              extendedProps: { task, projectId: proj._id, projectTitle: proj.title },
            });
          }
        });
        // Load boards for this project
        const { boardAPI } = await import('../services/api');
        const boardRes = await boardAPI.getByProject(proj._id);
        setProjectBoardsMap(prev => ({ ...prev, [proj._id]: boardRes.data.boards }));
      }
      setEvents(allTasks);
    } catch (e) {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (info) => {
    if (selectedProjectId === 'all') {
      toast('Select a specific project to create tasks', { icon: '💡' });
      return;
    }
    setNewTaskDate(info.dateStr);
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleEventClick = (info) => {
    setSelectedTask(info.event.extendedProps.task);
    setShowTaskModal(true);
  };

  const handleEventDrop = async (info) => {
    const taskId = info.event.id;
    const newDate = info.event.startStr;
    try {
      await taskAPI.update(taskId, { dueDate: newDate });
      toast.success('Due date updated');
    } catch {
      info.revert();
      toast.error('Failed to update due date');
    }
  };

  const currentBoardsForProject = selectedProjectId !== 'all'
    ? (projectBoardsMap[selectedProjectId] || [])
    : [];

  const firstBoardId = currentBoardsForProject[0]?._id;

  return (
    <div className="calendar-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">View and manage task deadlines</p>
        </div>
        <select
          className="form-input"
          style={{ width: 220 }}
          value={selectedProjectId}
          onChange={e => setSelectedProjectId(e.target.value)}
        >
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
      </div>

      <div className="calendar-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#fca5a5' }} /> High</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#fde68a' }} /> Medium</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#bfdbfe' }} /> Low</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#34d399' }} /> Completed</span>
      </div>

      <div className="calendar-wrapper card">
        {loading && (
          <div className="calendar-loading">
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        )}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={true}
          eventDrop={handleEventDrop}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
        />
      </div>

      {showTaskModal && selectedProjectId !== 'all' && firstBoardId && (
        <TaskModal
          task={selectedTask}
          boardId={selectedTask?.boardId || firstBoardId}
          projectId={selectedTask?.projectId || selectedProjectId}
          members={projects.find(p => p._id === selectedProjectId)?.members || []}
          boards={currentBoardsForProject}
          defaultDueDate={newTaskDate}
          onClose={() => { setShowTaskModal(false); setSelectedTask(null); setNewTaskDate(''); loadAllTasks(); }}
        />
      )}
    </div>
  );
}
