const jwt = require('jsonwebtoken');
const User = require('../models/User');

const onlineUsers = new Map(); // userId -> { socketId, name, avatar, projectIds }

const initSocket = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name email avatar role');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket] ${user.name} connected (${socket.id})`);

    // Mark user online
    onlineUsers.set(user._id.toString(), {
      socketId: socket.id,
      userId: user._id,
      name: user.name,
      avatar: user.avatar,
      connectedAt: new Date(),
    });
    io.emit('users:online', getOnlineList());

    // Join a project room
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('project:user_joined', {
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
      });
      // Send current online users in the project room
      const roomSockets = io.sockets.adapter.rooms.get(`project:${projectId}`);
      const activeInProject = [];
      if (roomSockets) {
        for (const sid of roomSockets) {
          const s = io.sockets.sockets.get(sid);
          if (s?.user) {
            activeInProject.push({ userId: s.user._id, name: s.user.name, avatar: s.user.avatar });
          }
        }
      }
      socket.emit('project:active_users', activeInProject);
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('project:user_left', { userId: user._id });
    });

    // Task events
    socket.on('task:moved', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:moved', { ...data, movedBy: user._id });
    });

    socket.on('task:updated', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:updated', data);
    });

    socket.on('task:created', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:created', data);
    });

    socket.on('task:deleted', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:deleted', data);
    });

    // Comment events
    socket.on('comment:new', (data) => {
      socket.to(`project:${data.projectId}`).emit('comment:new', {
        ...data,
        user: { _id: user._id, name: user.name, avatar: user.avatar },
      });
    });

    // Board events
    socket.on('board:created', (data) => {
      socket.to(`project:${data.projectId}`).emit('board:created', data);
    });

    socket.on('board:updated', (data) => {
      socket.to(`project:${data.projectId}`).emit('board:updated', data);
    });

    socket.on('board:deleted', (data) => {
      socket.to(`project:${data.projectId}`).emit('board:deleted', data);
    });

    // Typing indicator for comments
    socket.on('comment:typing', (data) => {
      socket.to(`project:${data.projectId}`).emit('comment:typing', {
        taskId: data.taskId,
        user: { _id: user._id, name: user.name },
        isTyping: data.isTyping,
      });
    });

    // Personal notification room
    socket.join(`user:${user._id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] ${user.name} disconnected`);
      onlineUsers.delete(user._id.toString());
      io.emit('users:online', getOnlineList());
    });
  });
};

const getOnlineList = () => Array.from(onlineUsers.values());

const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

const emitToProject = (io, projectId, event, data) => {
  io.to(`project:${projectId}`).emit(event, data);
};

module.exports = { initSocket, getOnlineList, emitToUser, emitToProject };
