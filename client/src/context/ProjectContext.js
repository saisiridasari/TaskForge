import React, { createContext, useContext, useState, useCallback } from 'react';
import { projectAPI, boardAPI, taskAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [boards, setBoards] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data.projects);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchProjectBoard = useCallback(async (projectId) => {
    setLoadingBoard(true);
    try {
      const [projectRes, boardsRes, tasksRes] = await Promise.all([
        projectAPI.getOne(projectId),
        boardAPI.getByProject(projectId),
        taskAPI.getByProject(projectId),
      ]);
      setCurrentProject(projectRes.data.project);
      setBoards(boardsRes.data.boards);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      toast.error('Failed to load project board');
    } finally {
      setLoadingBoard(false);
    }
  }, []);

  const createProject = async (data) => {
    const res = await projectAPI.create(data);
    setProjects((prev) => [res.data.project, ...prev]);
    return res.data.project;
  };

  const updateProject = async (id, data) => {
    const res = await projectAPI.update(id, data);
    setProjects((prev) => prev.map((p) => (p._id === id ? res.data.project : p)));
    if (currentProject?._id === id) setCurrentProject(res.data.project);
    return res.data.project;
  };

  const deleteProject = async (id) => {
    await projectAPI.delete(id);
    setProjects((prev) => prev.filter((p) => p._id !== id));
    if (currentProject?._id === id) setCurrentProject(null);
  };

  const createBoard = async (data) => {
    const res = await boardAPI.create(data);
    setBoards((prev) => [...prev, res.data.board]);
    return res.data.board;
  };

  const updateBoard = async (id, data) => {
    const res = await boardAPI.update(id, data);
    setBoards((prev) => prev.map((b) => (b._id === id ? res.data.board : b)));
  };

  const deleteBoard = async (id) => {
    await boardAPI.delete(id);
    setBoards((prev) => prev.filter((b) => b._id !== id));
    setTasks((prev) => prev.filter((t) => t.boardId !== id));
  };

  const createTask = async (data) => {
    const res = await taskAPI.create(data);
    setTasks((prev) => [...prev, res.data.task]);
    return res.data.task;
  };

  const updateTask = async (id, data) => {
    const res = await taskAPI.update(id, data);
    setTasks((prev) => prev.map((t) => (t._id === id ? res.data.task : t)));
    return res.data.task;
  };

  const moveTask = async (taskId, newBoardId, newOrder) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, boardId: newBoardId, order: newOrder } : t))
    );
    try {
      await taskAPI.move(taskId, { boardId: newBoardId, order: newOrder });
    } catch (err) {
      toast.error('Failed to move task');
    }
  };

  const deleteTask = async (id) => {
    await taskAPI.delete(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  const addMember = async (projectId, email, role) => {
    const res = await projectAPI.addMember(projectId, { email, role });
    setCurrentProject(res.data.project);
    return res.data.project;
  };

  const removeMember = async (projectId, userId) => {
    const res = await projectAPI.removeMember(projectId, userId);
    setCurrentProject(res.data.project);
  };

  return (
    <ProjectContext.Provider value={{
      projects, currentProject, boards, tasks,
      loadingProjects, loadingBoard,
      fetchProjects, fetchProjectBoard,
      createProject, updateProject, deleteProject,
      createBoard, updateBoard, deleteBoard,
      createTask, updateTask, moveTask, deleteTask,
      addMember, removeMember,
      setCurrentProject, setBoards, setTasks,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within ProjectProvider');
  return context;
};
