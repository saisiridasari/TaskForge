# TaskForge

TaskForge is a full-stack MERN project management platform built around real-time collaboration. Teams organize work on Kanban boards, attach files to tasks, track every change in an activity log, automate routine notifications, and view deadlines on a calendar — with updates syncing live across everyone viewing a project.

## Features

- JWT authentication with bcrypt hashing and role-based access (Admin, Manager, Member)
- Projects with color labels, deadlines, and auto-created boards
- Drag-and-drop Kanban boards with task priorities, due dates, and assignees
- Real-time collaboration over Socket.io: live task and board updates, comments, typing indicators, and active-user presence
- File and avatar uploads via Cloudinary (PDF, DOCX, images, ZIP)
- Activity log capturing every action across a project and its tasks
- Global search across tasks, projects, users, and boards, with filters
- Calendar view of task deadlines (FullCalendar)
- No-code IF/THEN automation rules per project
- Light and dark themes, toggleable from settings
- Installable Progressive Web App with offline caching in production builds

## Tech Stack

**Frontend:** React 18, React Router v6, Socket.io client, @hello-pangea/dnd, FullCalendar, Axios, lucide-react, date-fns, react-hot-toast

**Backend:** Node.js, Express, MongoDB with Mongoose, Socket.io, JWT, bcryptjs

**Uploads:** Multer with Cloudinary

## Project Structure

```
TaskForge/
├── client/                 React frontend
│   └── src/
│       ├── components/      layout, board, task, project, team, common
│       ├── context/         Auth, Project, Notification, Socket, Theme
│       ├── pages/           Dashboard, Projects, Board, Calendar, Search,
│       │                    Activity, Automation, Notifications, Team, Profile
│       └── services/        api.js — all API calls
└── server/                 Node/Express backend
    ├── config/             db, socket, cloudinary, activity logger
    ├── controllers/        auth, projects, boards, tasks, search, rules, upload, ...
    ├── middleware/         auth, error handler
    ├── models/             User, Project, Board, Task, Notification, Activity, Rule
    ├── routes/             one router per resource
    └── server.js           Express + Socket.io entry point
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- MongoDB (local or Atlas)
- A Cloudinary account (free) for file and avatar uploads

### Install

```bash
cd TaskForge
cd server && npm install
cd ../client && npm install
```

### Configure

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Set the server variables in `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskforge
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The app runs without Cloudinary; only file and avatar uploads will fail until those keys are set.

### Run (development)

Start the backend and frontend in two terminals:

```bash
# Terminal 1 — backend
cd server && npm run dev      # http://localhost:5000

# Terminal 2 — frontend
cd client && npm start        # http://localhost:3000
```

## Deployment

TaskForge deploys as a single service: in production the Express server serves the built React app, so the API and frontend share one origin. From the project root:

```bash
npm run build    # installs dependencies and builds the client
npm start        # runs the server, which serves the build
```

A `render.yaml` blueprint is included for deployment on Render. Provide a hosted MongoDB connection string (for example, a MongoDB Atlas cluster), a strong `JWT_SECRET`, and your Cloudinary keys as environment variables, and set `NODE_ENV` to `production`.

## API Overview

All endpoints are prefixed with `/api`.

| Resource | Base path | Purpose |
|---|---|---|
| Auth | `/api/auth` | Register, log in, profile, change password |
| Projects | `/api/projects` | Project CRUD and membership |
| Boards | `/api/boards` | Board CRUD within a project |
| Tasks | `/api/tasks` | Task CRUD and comments (`/:id/comments`) |
| Activity | `/api/activity` | Project, task, and personal audit logs |
| Search | `/api/search` | Global search with type and priority filters |
| Rules | `/api/rules` | Automation rule CRUD per project |
| Upload | `/api/upload` | Task attachments and profile avatars |
| Notifications | `/api/notifications` | List and manage notifications |

## Real-Time Sync

Socket.io broadcasts changes to everyone viewing a project: task and board create, update, move, and delete events, new comments, typing indicators, and presence (who is currently on a board, plus a global online list). The client joins a room per project and applies updates as they arrive, so boards stay current without a refresh.

## First Run

1. Register at `/register` and choose the Admin role.
2. Create a project — four default boards are created automatically.
3. Open the board and invite teammates from the Team panel.
4. Drag tasks between boards; collaborators see the change instantly.
5. Open a task to add comments or upload attachments.
6. Check the Calendar for deadlines, and set up rules under Automation.

## License

MIT

**Live demo:** https://task-forge-dusky.vercel.app/
