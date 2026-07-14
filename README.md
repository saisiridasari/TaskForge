# TaskForge

TaskForge is a full-stack MERN project management platform built around real-time collaboration and an integrated AI project manager. Teams organize work on Kanban boards, attach files to tasks, track every change in an activity log, automate routine notifications, and view deadlines on a calendar — with updates syncing live across everyone viewing a project. On top of that, TaskForge can generate an entire project plan from a plain-language description, and every task carries its own AI assistant for explanations, starter code, tests, and risk review.

**Live demo:** https://task-forge-dusky.vercel.app/

## Features

### Core
- JWT authentication with bcrypt hashing and role-based access (Admin, Manager, Member)
- Projects with color labels, deadlines, and auto-created boards
- Drag-and-drop Kanban boards with task priorities, due dates, and assignees
- Real-time collaboration over Socket.io: live task and board updates, comments, typing indicators, and active-user presence
- File and avatar uploads via Cloudinary (PDF, DOCX, images, ZIP)
- Activity log capturing every action across a project and its tasks, including AI-driven ones
- Global search across tasks, projects, users, and boards, with filters
- Calendar view of task deadlines (FullCalendar)
- No-code IF/THEN automation rules per project
- Public landing page, plus light/dark themes toggleable from the sidebar and persisted per user

### AI-Powered Project Management
- **AI project generation** — describe an idea in plain language and get a complete project plan: boards, tasks, priorities, difficulty, estimated hours, dependencies, required npm packages and environment variables, suggested git branches/commits, testing checklists, deployment notes, and identified risks
- **Automatic task scheduling** — due dates are computed from each task's estimated hours and dependency chain, not left blank or guessed by the model
- **AI task intelligence panel** — on any task: explain it, generate starter code, generate test cases, get a time estimate, or run a risk/security/performance review, plus free-form Q&A with per-task conversation memory
- **AI Draft review workflow** — AI-generated tasks are visually flagged until a human reviews and clears them, so AI output is never silently indistinguishable from human-authored work
- **Invite-by-email autocomplete** — search and select existing workspace members instead of typing a full email

## Tech Stack

**Frontend:** React 18, React Router v6, Socket.io client, @hello-pangea/dnd, FullCalendar, Axios, date-fns, react-hot-toast

**Backend:** Node.js, Express, MongoDB with Mongoose, Socket.io, JWT, bcryptjs

**AI:** Google Gemini API (`@google/genai`), Zod for structured-output validation

**Uploads:** Multer with Cloudinary

## Project Structure

```
TaskForge/
├── client/                 React frontend
│   └── src/
│       ├── components/      layout, board, task, project, team, common
│       │   ├── task/          TaskModal (includes the AI panel tab)
│       │   └── project/       ProjectModal, AIGenerateProjectModal
│       ├── context/         Auth, Project, Notification, Socket, Theme
│       ├── pages/           Landing, Dashboard, Projects, Board, Calendar,
│       │                    Search, Activity, Automation, Notifications,
│       │                    Team, Profile, Login, Register
│       └── services/        api.js — all API calls, including aiAPI
└── server/                 Node/Express backend
    ├── config/             db, socket, cloudinary, gemini, activity logger
    ├── controllers/        auth, projects, boards, tasks, search, rules,
    │                        upload, ai
    ├── middleware/         auth, verifyProjectMember, aiRateLimit, error handler
    ├── models/             User, Project, Board, Task, Notification, Activity,
    │                        Rule, ProjectGeneration, AIUsage, TaskConversation
    ├── services/           projectGenerationService, projectPlanWriter,
    │                        taskContextAssembler, taskIntelligenceService,
    │                        responseValidator, prompts/, schemas/
    ├── routes/             one router per resource, plus ai.js
    └── server.js           Express + Socket.io entry point
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- MongoDB (local or Atlas)
- A Cloudinary account (free) for file and avatar uploads
- A Gemini API key (free tier available) for AI features — get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

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

GEMINI_API_KEY=your_gemini_api_key
AI_MONTHLY_REQUEST_LIMIT=500
AI_MONTHLY_TOKEN_LIMIT=1000000
```

The app runs without Cloudinary or a Gemini key; only file/avatar uploads and AI features will be unavailable until those are set.

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

A `render.yaml` blueprint is included for deployment on Render. Provide a hosted MongoDB connection string (for example, a MongoDB Atlas cluster), a strong `JWT_SECRET`, your Cloudinary keys, and a `GEMINI_API_KEY`, and set `NODE_ENV` to `production`.

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
| AI | `/api/ai` | Project generation (`/projects/generate`), task Q&A (`/tasks/:id/ask`), draft review (`/tasks/:id/review`) |

## Real-Time Sync

Socket.io broadcasts changes to everyone viewing a project: task and board create, update, move, and delete events, new comments, typing indicators, and presence (who is currently on a board, plus a global online list). The client joins a room per project and applies updates as they arrive, so boards stay current without a refresh.

## AI Architecture Notes

A few design decisions worth calling out for anyone reviewing the code:

- **Every AI response is schema-validated before it touches the database.** Gemini's structured output is checked against a Zod schema plus semantic rules (no self-referential dependencies, no duplicate task titles, dependency references must resolve within the same batch) before any `Board`/`Task` document is created. Invalid output triggers an automatic retry with the specific validation errors fed back to the model, up to three attempts, before failing cleanly.
- **Task due dates are computed, not guessed.** Gemini has no notion of the current date and can't produce a real calendar date on its own — due dates are derived server-side from each task's estimated hours and its position in the dependency graph.
- **Rate limiting and usage tracking are enforced server-side** (`AIUsage` model, `aiRateLimit` middleware) on a monthly request/token budget per user, independent of any client-side controls.
- **Project-membership checks are enforced on every AI route** (`verifyProjectMember` middleware) before a request can read or write project-scoped data — closing an access-control gap that existed on some routes prior to the AI work.

## First Run

1. Register at `/register` and choose the Admin role.
2. Create a project manually, or click **Generate with AI** and describe an idea to have a full plan created for you.
3. Open the board and invite teammates from the Team panel (autocomplete search by name or email).
4. Drag tasks between boards; collaborators see the change instantly.
5. Open a task to add comments, upload attachments, or use the **AI** tab to ask questions about it.
6. Check the Calendar for deadlines, and set up rules under Automation.
7. Toggle light/dark mode from the sidebar — your preference is remembered on your next visit.
