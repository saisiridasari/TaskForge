# TaskFlow v2 — Premium MERN Project Management System

A full-stack, production-ready project management platform with real-time collaboration, Kanban boards, file attachments, calendar views, automation rules, activity logs, and advanced search.

---

## ✨ Features

### Core (v1)
- JWT authentication with bcrypt password hashing
- Role-based access control (Admin / Manager / Member)
- Project CRUD with color labels and deadlines
- Trello-like drag-and-drop Kanban boards
- Task management with priorities, due dates, assignees
- Team management — invite by email
- Notifications system
- User profile management

### New in v2
- **Real-Time Collaboration** — Socket.io live task sync, live comments, active user indicators
- **File Attachments** — Upload PDF, DOCX, images, ZIP to tasks via Cloudinary
- **Avatar Upload** — Upload profile photos via Cloudinary
- **Activity Log / Audit Trail** — Full history of every action per project and task
- **Advanced Search** — Global search across tasks, projects, users, boards with filters
- **Calendar View** — Monthly/weekly/daily view of task deadlines (FullCalendar)
- **Automation Rules** — No-code IF/THEN workflow rules per project
- **Real-Time Comments** — Threaded comments on tasks with live sync
- **PWA Support** — Installable on mobile & desktop, offline caching, push notification ready

---

## 🛠 Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Frontend    | React 18, React Router v6             |
| Real-time   | Socket.io Client                      |
| Drag & Drop | @hello-pangea/dnd                     |
| Calendar    | FullCalendar (React)                  |
| HTTP        | Axios                                 |
| Backend     | Node.js, Express.js                   |
| Database    | MongoDB, Mongoose                     |
| Auth        | JWT, bcryptjs                         |
| Real-time   | Socket.io                             |
| File Upload | Multer + Cloudinary                   |
| Dates       | date-fns                              |
| Toasts      | react-hot-toast                       |

---

## 📁 Folder Structure

```
TaskFlow/
├── client/                         React Frontend
│   ├── public/
│   │   ├── index.html              PWA-enabled HTML
│   │   ├── manifest.json           PWA manifest
│   │   └── service-worker.js       Offline service worker
│   └── src/
│       ├── components/
│       │   ├── board/              BoardModal
│       │   ├── common/             Avatar, SearchBar
│       │   ├── layout/             AppLayout (sidebar + topbar)
│       │   ├── project/            ProjectModal
│       │   ├── task/               TaskModal (tabs: details/comments/attachments/activity)
│       │   └── team/               TeamPanel
│       ├── context/
│       │   ├── AuthContext.js
│       │   ├── ProjectContext.js
│       │   ├── NotificationContext.js
│       │   └── SocketContext.js    NEW — real-time socket
│       ├── pages/
│       │   ├── LoginPage.js
│       │   ├── RegisterPage.js
│       │   ├── DashboardPage.js
│       │   ├── ProjectsPage.js
│       │   ├── ProjectBoardPage.js  Real-time Kanban
│       │   ├── CalendarPage.js      NEW — FullCalendar
│       │   ├── SearchPage.js        NEW — advanced search
│       │   ├── ActivityPage.js      NEW — audit trail
│       │   ├── AutomationPage.js    NEW — IF/THEN rules
│       │   ├── NotificationsPage.js
│       │   ├── TeamPage.js
│       │   └── ProfilePage.js       Avatar upload
│       └── services/
│           └── api.js               All API calls
│
└── server/                         Node/Express Backend
    ├── config/
    │   ├── db.js                    MongoDB connection
    │   ├── socket.js                NEW — Socket.io manager
    │   ├── cloudinary.js            NEW — File upload config
    │   └── activityHelper.js        NEW — Activity logger
    ├── controllers/
    │   ├── authController.js
    │   ├── projectController.js
    │   ├── boardController.js
    │   ├── taskController.js        + comments, socket events
    │   ├── notificationController.js
    │   ├── userController.js
    │   ├── activityController.js    NEW
    │   ├── searchController.js      NEW
    │   ├── rulesController.js       NEW
    │   └── uploadController.js      NEW
    ├── middleware/
    │   ├── auth.js
    │   └── errorHandler.js
    ├── models/
    │   ├── User.js
    │   ├── Project.js
    │   ├── Board.js
    │   ├── Task.js                  + attachments, comments fields
    │   ├── Notification.js
    │   ├── Activity.js              NEW
    │   └── Rule.js                  NEW
    ├── routes/
    │   ├── auth.js
    │   ├── projects.js
    │   ├── boards.js
    │   ├── tasks.js                 + comment endpoints
    │   ├── notifications.js
    │   ├── users.js
    │   ├── activity.js              NEW
    │   ├── search.js                NEW
    │   ├── rules.js                 NEW
    │   └── upload.js                NEW
    └── server.js                    Socket.io + all routes
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16+
- **MongoDB** (local or Atlas)
- **Cloudinary account** (free) — for file/avatar uploads

---

### Step 1 — Install

```bash
cd TaskFlow

# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

---

### Step 2 — Environment Variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Get free at cloudinary.com → Dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note:** App runs without Cloudinary — file/avatar uploads will return errors but all other features work.

---

### Step 3 — Run

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm start
# → http://localhost:3000
```

---

## 🔌 New API Endpoints (v2)

### Tasks — Comments
| Method | Endpoint                          | Description        |
|--------|-----------------------------------|--------------------|
| POST   | /api/tasks/:id/comments           | Add comment        |
| DELETE | /api/tasks/:id/comments/:cId      | Delete comment     |

### Activity
| Method | Endpoint                          | Description        |
|--------|-----------------------------------|--------------------|
| GET    | /api/activity/project/:projectId  | Project audit log  |
| GET    | /api/activity/task/:taskId        | Task history       |
| GET    | /api/activity/me                  | My recent activity |

### Search
| Method | Endpoint                          | Description        |
|--------|-----------------------------------|--------------------|
| GET    | /api/search?q=&type=&priority=    | Global search      |

### Automation Rules
| Method | Endpoint                          | Description        |
|--------|-----------------------------------|--------------------|
| GET    | /api/rules/project/:projectId     | Get rules          |
| POST   | /api/rules/project/:projectId     | Create rule        |
| PUT    | /api/rules/:id                    | Update/toggle rule |
| DELETE | /api/rules/:id                    | Delete rule        |

### Upload
| Method | Endpoint                                   | Description          |
|--------|--------------------------------------------|----------------------|
| POST   | /api/upload/task/:taskId/attachment        | Upload file to task  |
| DELETE | /api/upload/task/:taskId/attachment/:aId   | Delete attachment    |
| POST   | /api/upload/avatar                         | Upload profile photo |

---

## ⚡ Socket.io Events

### Client → Server
| Event              | Payload              | Description              |
|--------------------|----------------------|--------------------------|
| `project:join`     | projectId            | Join project room        |
| `project:leave`    | projectId            | Leave project room       |
| `task:moved`       | {taskId, boardId…}   | Broadcast drag-drop      |
| `comment:typing`   | {taskId, isTyping}   | Typing indicator         |

### Server → Client
| Event                  | Description                          |
|------------------------|--------------------------------------|
| `task:created`         | New task added to board              |
| `task:updated`         | Task field changed                   |
| `task:moved`           | Task dragged to new board            |
| `task:deleted`         | Task removed                         |
| `board:created`        | New board added                      |
| `board:updated`        | Board renamed/recolored              |
| `board:deleted`        | Board removed                        |
| `comment:new`          | New comment on a task                |
| `project:active_users` | List of users viewing the board      |
| `project:user_joined`  | User entered the board               |
| `project:user_left`    | User left the board                  |
| `users:online`         | Global online user list              |
| `notification:new`     | New notification for user            |

---

## 📱 PWA — Install on Device

1. Open `http://localhost:3000` in Chrome/Edge
2. Click the **install icon** in the address bar (or browser menu → "Install TaskFlow")
3. TaskFlow launches as a standalone app

---

## 🎨 Design System

| Token          | Value      | Usage                      |
|----------------|------------|----------------------------|
| `--blue`       | `#60a5fa`  | Primary actions, links     |
| `--green`      | `#34d399`  | Success, completed, live   |
| `--purple`     | `#a78bfa`  | Secondary accent           |
| `--gray`       | `#e5e7eb`  | Borders, backgrounds       |
| Background     | `#ffffff`  | Always pure white          |

---

## 📝 First Run

1. Register at `/register` — select **Admin** role
2. Create a project — 4 default boards auto-created
3. Open the board — invite teammates from the **Team** button
4. Drag tasks between boards — collaborators see changes instantly
5. Open any task → Attachments tab → upload files
6. Visit **Calendar** to see all deadlines
7. Visit **Automation** (inside a project) to set up rules

---

## 📄 License
MIT © TaskFlow v2
