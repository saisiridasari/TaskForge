import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useProject } from '../context/ProjectContext';
import { useTheme } from '../context/ThemeContext';
import { taskAPI, projectAPI } from '../services/api';
import TaskModal from '../components/task/TaskModal';
import toast from 'react-hot-toast';
import './CalendarPage.css';

const EVENT_STYLES = {
  light: {
    completed: { bg: '#e0e9d6', border: '#7a8c5e', text: '#2c2416' },
    high: { bg: '#f3ddd6', border: '#b8604a', text: '#2c2416' },
    medium: { bg: '#f7ecd6', border: '#c9a96e', text: '#2c2416' },
    low: { bg: '#e3f2fd', border: '#1e88e5', text: '#2c2416' },
  },
  dark: {
    completed: { bg: '#1c2417', border: '#9fb37e', text: '#edf2fb' },
    high: { bg: '#2e1b16', border: '#d97a63', text: '#edf2fb' },
    medium: { bg: '#2e2416', border: '#d9bc8a', text: '#edf2fb' },
    low: { bg: '#16294a', border: '#2196f3', text: '#edf2fb' },
  },
};

// Simple inline info icon, replacing the emoji previously passed to toast().
const InfoIcon = () => (
  <svg width="16" height="16" fill="none" stroke="var(--blue)" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function CalendarPage() {
  const { projects, fetchProjects, boards } = useProject();
  const { theme } = useTheme();
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
  }, [projects, selectedProjectId, theme]);

  const loadAllTasks = async () => {
    if (!projects.length) return;
    setLoading(true);
    try {
      const filteredProjects = selectedProjectId === 'all'
        ? projects
        : projects.filter(p => p._id === selectedProjectId);

      const styles = EVENT_STYLES[theme] || EVENT_STYLES.light;
      const allTasks = [];
      for (const proj of filteredProjects) {
        const res = await taskAPI.getByProject(proj._id);
        res.data.tasks.forEach(task => {
          if (task.dueDate) {
            const category = task.completed ? 'completed' : (task.priority || 'low');
            const style = styles[category] || styles.low;
            allTasks.push({
              id: task._id,
              title: task.title,
              date: task.dueDate,
              backgroundColor: style.bg,
              borderColor: style.border,
              textColor: style.text,
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
      toast('Select a specific project to create tasks', { icon: <InfoIcon /> });
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
  const legendStyles = EVENT_STYLES[theme] || EVENT_STYLES.light;

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
        <span className="legend-item"><span className="legend-dot" style={{ background: legendStyles.high.border }} /> High</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: legendStyles.medium.border }} /> Medium</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: legendStyles.low.border }} /> Low</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: legendStyles.completed.border }} /> Completed</span>
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