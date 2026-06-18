# System Documentation - DOWINN Management Tool

This document explains the current full-stack project management system in a beginner-friendly but technical way. It is written so you can use it while studying the codebase or explaining the project during a technical assessment.

---

## Table Of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack Explanation](#2-tech-stack-explanation)
3. [Current Business Rules](#3-current-business-rules)
4. [System Flow](#4-system-flow)
5. [File And Folder Mapping](#5-file-and-folder-mapping)
6. [API Documentation](#6-api-documentation)
7. [Database Documentation](#7-database-documentation)
8. [Feature-By-Feature Explanation](#8-feature-by-feature-explanation)
9. [Connection Mapping](#9-connection-mapping)
10. [Process Timeline](#10-process-timeline)
11. [Beginner Explanation Of Important Parts](#11-beginner-explanation-of-important-parts)
12. [Assessment Presentation Summary](#12-assessment-presentation-summary)

---

## 1. Project Overview

### What The System Is

DOWINN Management Tool is a full-stack project management application. It lets users sign up and sign in, lets managers create projects and tasks, lets members work on assigned tasks, and records task status changes through change logs.

The system has two main applications:

```text
Frontend: Next.js + Tailwind CSS
Backend: NestJS + Prisma
Database: PostgreSQL through Supabase
```

### What Problem It Solves

The system helps a team organize project work:

- Members need accounts.
- Managers need to create projects and assign members.
- Managers need to create tasks and assign them to members.
- Members need to see project work and update assigned tasks.
- Teammates should see each other's work in the same project.
- Managers need a final approval step.
- Status changes need history for accountability.
- The dashboard should summarize project/task health.

### Main Users

| User Type | Main Purpose |
|---|---|
| MANAGER | Creates projects, edits projects, assigns members, creates tasks, assigns tasks, approves work |
| MEMBER | Views projects they belong to, views tasks in those projects, updates tasks assigned to them |
| Assignee | The member assigned to a specific task; can move/edit that task unless completed |
| Viewer | A member viewing a teammate's task in the same project; can inspect but not edit |

### Main Features Included

- Member sign-up and sign-in
- Password visibility toggle on sign in/sign up
- Auth form clears when switching between Sign In and Sign Up
- Password hashing with `bcryptjs`
- Role hierarchy: `MANAGER` and `MEMBER`
- Optional member title for display, such as `Lead Programmer` or `Software Engineer`
- Profile image upload through Supabase Storage
- Project creation and update
- Multiple members per project
- Project notes and image upload
- Manager-only task creation
- New tasks always start as `TODO`
- Task details modal for task name, description, notes, and image
- Task priority: `Low`, `Medium`, `High`
- Kanban drag-and-drop task board
- Members can view all tasks inside their projects
- Members can only move/edit their own assigned tasks
- Assignees can move assigned tasks between `TODO`, `IN_PROGRESS`, and `DONE`
- Managers approve `DONE` tasks into `COMPLETED`
- `COMPLETED` tasks are locked
- Automatic change logs for status updates
- Change log search/filter/pagination
- Dashboard with role-based stats, pending approvals, priority overview, recent activity, task completion, and approval rate
- Swagger API documentation at `/api_test`
- Seed endpoint at `POST /initialize`

---

## 2. Tech Stack Explanation

### Frontend

| Technology | Purpose | Why It Was Used |
|---|---|---|
| Next.js | Frontend framework and routing | Gives file-based pages and React structure |
| React | UI rendering and state | Lets pages update when API data changes |
| TypeScript | Type safety | Helps catch mistakes before runtime |
| Tailwind CSS | Styling | Fast utility-first styling |
| Axios | API calls | Centralized HTTP client for backend requests |
| dnd-kit | Drag-and-drop | Handles Kanban card movement |

### Backend

| Technology | Purpose | Why It Was Used |
|---|---|---|
| NestJS | API framework | Organizes backend into modules, controllers, and services |
| TypeScript | Backend type safety | Safer DTOs, services, and Prisma queries |
| Prisma | ORM | Maps TypeScript code to PostgreSQL tables |
| PostgreSQL | Database | Stores relational data cleanly |
| Supabase | Hosted PostgreSQL and Storage | Provides database and image storage |
| bcryptjs | Password hashing | Avoids plain-text passwords |
| class-validator | DTO validation | Validates request body fields |
| class-transformer | Type conversion | Converts incoming string numbers into numbers |
| Swagger/OpenAPI | API docs | Interactive API test page at `/api_test` |

### Important Note About Authentication

`@nestjs/jwt` is installed, but the current implementation is not using JWT guards yet.

Current authentication is simple:

```text
User logs in
Backend validates user_id and password
Frontend stores user_id in localStorage
Pages use localStorage user_id to decide current user
Backend services still validate role/permission by looking up user_id
```

This means backend service checks are important because the frontend alone is not secure.

---

## 3. Current Business Rules

### Role Rules

```text
MANAGER:
- Can see all projects.
- Can see all tasks.
- Can create projects.
- Can update projects.
- Can add/remove project members.
- Can create and assign tasks.
- Can approve DONE tasks into COMPLETED.
- Can update member titles.

MEMBER:
- Can see projects where they are a project member.
- Can see all tasks inside those projects.
- Can view teammate tasks in the same project.
- Can only move/edit tasks assigned to them.
- Cannot create projects.
- Cannot create tasks.
- Cannot approve tasks into COMPLETED.
```

### Project Visibility

```text
MANAGER = all projects
MEMBER = only projects where project.members contains their user_id
```

### Task Visibility

```text
MANAGER = all tasks
MEMBER = all tasks inside projects they belong to
```

This is intentional. A member should know what teammates are doing inside the same project, but they should not be able to modify teammate tasks.

### Task Action Rules

```text
MANAGER:
- Can create tasks.
- Can assign tasks to project members.
- Can approve DONE -> COMPLETED.

ASSIGNEE:
- Can move own assigned task between TODO, IN_PROGRESS, and DONE.
- Can move backward, for example DONE -> IN_PROGRESS or IN_PROGRESS -> TODO.
- Can update notes/image/details while task is not COMPLETED.

OTHER PROJECT MEMBER:
- Can view teammate tasks.
- Cannot move teammate tasks.
- Cannot edit teammate task details.

COMPLETED TASK:
- Locked from further updates.
```

### Current Task Creation Behavior

Managers create tasks from the task page.

The main create form contains:

- Project
- Assignee
- Priority
- Details button
- Create button

The Details modal contains:

- Task Name
- Task Description
- Notes
- Image

New tasks always start as:

```text
TODO
```

The status field was removed from the create form because a new task should always begin in Todo.

---

## 4. System Flow

### High-Level Data Flow

```text
User action
  |
  v
Next.js page/component
  |
  v
Axios API function
  |
  v
NestJS controller
  |
  v
NestJS service
  |
  v
Prisma service
  |
  v
PostgreSQL/Supabase
  |
  v
Response returns to frontend
```

### Login Flow

```text
User enters user_id and password
  |
  v
Auth page calls login API
  |
  v
POST /testlogin
  |
  v
MembersService finds user by user_id
  |
  v
bcrypt compares password with password_hash
  |
  v
Backend returns { data: "ok" }
  |
  v
Frontend stores user_id in localStorage
```

### Project Flow

```text
Manager creates project
  |
  v
Frontend sends project name, description, and member_user_ids
  |
  v
POST /test02/create_project
  |
  v
ProjectsService verifies creator is MANAGER
  |
  v
Prisma creates project and project member rows
  |
  v
Project appears in frontend and database
```

### Task Creation Flow

```text
Manager selects project, assignee, priority
  |
  v
Manager opens Details modal
  |
  v
Manager enters task name, description, optional notes/image
  |
  v
Frontend sends POST /test03/create_task with status TODO
  |
  v
Backend verifies creator is MANAGER
  |
  v
Backend verifies assignee belongs to project
  |
  v
Prisma creates task
  |
  v
If notes exist, frontend calls PATCH /test03/update_task_details
  |
  v
If image exists, frontend calls POST /test03/upload_task_image
```

### Task Kanban Flow

```text
Assignee drags own task
  |
  v
Frontend checks current user is assignee
  |
  v
Frontend blocks COMPLETED for members
  |
  v
PATCH /test03/patch_task
  |
  v
TasksService checks role, assignment, and status rules
  |
  v
Prisma updates task status
  |
  v
ChangeLog row is created
```

### Approval Flow

```text
Assignee moves task to DONE
  |
  v
Dashboard shows it in Pending Approval
  |
  v
Manager clicks Approve
  |
  v
PATCH /test03/patch_task with status COMPLETED
  |
  v
Backend verifies manager can move DONE -> COMPLETED
  |
  v
Task becomes COMPLETED and locked
```

---

## 5. File And Folder Mapping

### Root

| Path | Purpose |
|---|---|
| `frontend/` | Next.js frontend application |
| `backend/` | NestJS backend application |
| `SYSTEM_DOCUMENTATION.md` | Main technical documentation |

### Frontend Important Files

| File/Folder | Purpose |
|---|---|
| `frontend/src/app/page.tsx` | Dashboard page |
| `frontend/src/app/auth/page.tsx` | Sign in/sign up page |
| `frontend/src/app/projects/page.tsx` | Project list, create, edit, member management, notes/images |
| `frontend/src/app/tasks/page.tsx` | Kanban board, task creation, task details, drag-and-drop |
| `frontend/src/app/change-logs/page.tsx` | Change log page with search/filter/pagination |
| `frontend/src/app/members/page.tsx` | Member list and member details |
| `frontend/src/app/settings/page.tsx` | User settings/profile actions |
| `frontend/src/components/app-shell.tsx` | Shared navbar/sidebar layout and logged-in user display |
| `frontend/src/lib/api.ts` | Shared Axios instance |
| `frontend/src/lib/members-api.ts` | Member/auth API functions |
| `frontend/src/lib/projects-api.ts` | Project API functions |
| `frontend/src/lib/tasks-api.ts` | Task API functions |
| `frontend/src/lib/change-logs-api.ts` | Change log API functions |

### Backend Important Files

| File/Folder | Purpose |
|---|---|
| `backend/src/main.ts` | NestJS app bootstrap, validation, CORS, Swagger |
| `backend/src/app.module.ts` | Root module wiring all backend modules |
| `backend/src/prisma/prisma.service.ts` | Shared Prisma database service |
| `backend/src/storage/storage.service.ts` | Supabase Storage upload logic |
| `backend/src/members/` | Member/auth controllers, services, DTOs |
| `backend/src/projects/` | Project controllers, services, DTOs |
| `backend/src/tasks/` | Task controllers, services, DTOs |
| `backend/src/change-logs/` | Change log controllers, services, DTOs |
| `backend/src/initialize/` | Seed/init endpoint |
| `backend/prisma/schema.prisma` | Database models and enums |
| `backend/prisma/migrations/` | Database migration history |

### Backend Module Pattern

Each backend feature usually has:

```text
module.ts      = registers the feature
controller.ts  = defines API routes
service.ts     = contains business logic
dto/*.dto.ts   = validates request/query bodies
```

Example:

```text
TasksController receives PATCH /test03/patch_task
  |
  v
TasksService.patchTask() checks rules and updates database
```

---

## 6. API Documentation

All successful responses follow the company style:

```json
{
  "data": {}
}
```

Some business-rule failures also return a string inside `data`, for example:

```json
{
  "data": "Only Manager Can Create Task"
}
```

### Members / Auth APIs

| Method | Endpoint | Purpose | Frontend Caller | Backend Handler | Database |
|---|---|---|---|---|---|
| POST | `/testlogin` | Sign in | `members-api.ts` | `MembersController.login()` -> `MembersService.login()` | `members` |
| POST | `/test01/create_member` | Sign up | `members-api.ts` | `createMember()` | `members` |
| GET | `/test01/get_all_member` | Get all members | `members-api.ts` | `getAllMember()` | `members` |
| GET | `/test01/get_member?id=1` | Get one member | `members-api.ts` | `getMember()` | `members` |
| PATCH | `/test01/update_member` | Update email/password | `members-api.ts` | `updateMember()` | `members` |
| PATCH | `/test01/update_member_title` | Manager updates member title | `members-api.ts` | `updateMemberTitle()` | `members` |
| POST | `/test01/upload_member_profile_image` | Upload profile image | `members-api.ts` | `uploadMemberProfileImage()` | `members`, Supabase Storage |
| PATCH | `/test01/remove_member_profile_image` | Remove profile image URL | `members-api.ts` | `removeMemberProfileImage()` | `members` |

Example login request:

```json
{
  "user_id": "demo_manager",
  "password": "password123"
}
```

Example member response:

```json
{
  "data": {
    "id": 1,
    "user_id": "demo_manager",
    "email": "manager@email.com",
    "role": "MANAGER",
    "title": "Lead Programmer",
    "profile_image_url": "https://..."
  }
}
```

### Project APIs

| Method | Endpoint | Purpose | Frontend Caller | Backend Handler | Database |
|---|---|---|---|---|---|
| POST | `/test02/create_project` | Create project | `projects-api.ts` | `ProjectsController.createProject()` -> `ProjectsService.createProject()` | `projects`, `project_members` |
| GET | `/test02/get_all_project` | Get all projects | `projects-api.ts` | `getAllProject()` | `projects`, `project_members`, `members` |
| GET | `/test02/get_project?id=1` | Get one project | `projects-api.ts` | `getProject()` | `projects` |
| PATCH | `/test02/patch_project` | Update project and members | `projects-api.ts` | `patchProject()` | `projects`, `project_members` |
| PATCH | `/test02/update_project_details` | Update project notes | `projects-api.ts` | `updateProjectDetails()` | `projects` |
| POST | `/test02/upload_project_image` | Upload project image | `projects-api.ts` | `uploadProjectImage()` | `projects`, Supabase Storage |

Example create project request:

```json
{
  "user_id": "demo_manager",
  "member_user_ids": ["demo_manager", "demo_member"],
  "name": "Management Tool",
  "description": "Simple project management tool"
}
```

### Task APIs

| Method | Endpoint | Purpose | Frontend Caller | Backend Handler | Database |
|---|---|---|---|---|---|
| POST | `/test03/create_task` | Create task | `tasks-api.ts` | `TasksController.createTask()` -> `TasksService.createTask()` | `tasks` |
| GET | `/test03/get_all_task` | Get all tasks | `tasks-api.ts` | `getAllTask()` | `tasks`, `members` |
| GET | `/test03/get_task?id=1` | Get one task | `tasks-api.ts` | `getTask()` | `tasks` |
| PATCH | `/test03/patch_task` | Update status/manager task fields | `tasks-api.ts` | `patchTask()` | `tasks`, `change_logs` |
| PATCH | `/test03/update_task_details` | Update task notes/details | `tasks-api.ts` | `updateTaskDetails()` | `tasks` |
| POST | `/test03/upload_task_image` | Upload task image | `tasks-api.ts` | `uploadTaskImage()` | `tasks`, Supabase Storage |

Current frontend create task request:

```json
{
  "project_id": 1,
  "user_id": "demo_manager",
  "assignee_user_id": "demo_member",
  "name": "Build task board",
  "status": "TODO",
  "priority": "High",
  "contents": "Create Kanban columns and drag movement"
}
```

Important:

- The frontend always sends `status: "TODO"` when creating tasks.
- Members can move assigned tasks between `TODO`, `IN_PROGRESS`, and `DONE`.
- Managers approve `DONE` into `COMPLETED`.

### Change Log APIs

| Method | Endpoint | Purpose | Frontend Caller | Backend Handler | Database |
|---|---|---|---|---|---|
| POST | `/test04/create_changelog` | Manual create log | `change-logs-api.ts` | `createChangeLog()` | `change_logs` |
| GET | `/test04/get_all_change_log` | Get all logs | `change-logs-api.ts` | `getAllChangeLog()` | `change_logs` |
| GET | `/test04/get_change_log?id=1` | Get one log | `change-logs-api.ts` | `getChangeLog()` | `change_logs` |
| PATCH | `/test04/update_change_log` | Update log | `change-logs-api.ts` | `updateChangeLog()` | `change_logs` |

Most logs are created automatically inside `TasksService.patchTask()` when a task status changes.

### Initialize API

| Method | Endpoint | Purpose | Backend Handler | Database |
|---|---|---|---|---|
| POST | `/initialize` | Seed demo data | `InitializeController.initializeDatabase()` -> `InitializeService.initializeDatabase()` | all main tables |

The seed creates demo manager/member users, projects, tasks, memberships, and change logs.

---

## 7. Database Documentation

Database schema is defined in:

```text
backend/prisma/schema.prisma
```

### User Model

Mapped table:

```text
members
```

| Field | Purpose |
|---|---|
| `id` | Internal numeric primary key |
| `userId` | Login username, mapped to `user_id` |
| `email` | Unique email |
| `passwordHash` | Hashed password, mapped to `password_hash` |
| `role` | `MANAGER` or `MEMBER` |
| `title` | Optional display title |
| `profileImageUrl` | Profile image URL from Supabase Storage |
| `projects` | Projects created by the user |
| `projectMemberships` | Projects where user is a member |
| `assignedTasks` | Tasks assigned to this user |
| `createdAt`, `updatedAt` | Timestamps |

Why it exists:

Users are needed for authentication, assignment, roles, and display identity.

### Project Model

Mapped table:

```text
projects
```

| Field | Purpose |
|---|---|
| `id` | Project primary key |
| `userId` | Creator/owner user id |
| `name` | Project name |
| `description` | Project description |
| `notes` | Extra project notes |
| `imageUrl` | Project image URL |
| `members` | Many-to-many membership rows |
| `tasks` | Tasks under the project |
| `createdAt`, `updatedAt` | Timestamps |

Why it exists:

A project groups related tasks and members.

### ProjectMember Model

Mapped table:

```text
project_members
```

| Field | Purpose |
|---|---|
| `id` | Membership primary key |
| `projectId` | Connected project |
| `userId` | Connected user |
| `role` | Project-level label such as `owner` or `member` |
| `createdAt` | Membership timestamp |

Why it exists:

This table allows one project to have many members and one member to belong to many projects.

### Task Model

Mapped table:

```text
tasks
```

| Field | Purpose |
|---|---|
| `id` | Task primary key |
| `projectId` | Project that owns the task |
| `assigneeUserId` | User assigned to the task |
| `name` | Task name |
| `status` | `TODO`, `IN_PROGRESS`, `DONE`, `COMPLETED` |
| `priority` | `Low`, `Medium`, `High` |
| `contents` | Task description |
| `notes` | Extra task notes |
| `imageUrl` | Task image URL |
| `dueDate` | Backend/database field for future due-date feature |
| `changeLogs` | Related status history |
| `createdAt`, `updatedAt` | Timestamps |

Important:

`dueDate` exists in the backend/database, but the due date feature is currently hidden from the frontend because it is not being used yet.

### ChangeLog Model

Mapped table:

```text
change_logs
```

| Field | Purpose |
|---|---|
| `id` | Log primary key |
| `taskId` | Related task |
| `oldStatus` | Previous task status |
| `newStatus` | New task status |
| `remark` | Human-readable change description |
| `createdAt`, `updatedAt` | Timestamps |

Why it exists:

It creates an audit trail of task status changes.

### Enums

```text
TaskStatus:
- TODO
- IN_PROGRESS
- DONE
- COMPLETED

TaskPriority:
- Low
- Medium
- High

UserRole:
- MANAGER
- MEMBER
```

---

## 8. Feature-By-Feature Explanation

### Authentication

What it does:

Users can sign up and sign in.

Why it is needed:

The system needs to know who is using it so it can apply role and assignment rules.

How it works:

1. Sign-up sends `user_id`, `email`, and `password`.
2. Backend validates the data.
3. Password is hashed with `bcryptjs`.
4. User is stored in `members`.
5. Sign-in compares password with the hash.
6. Frontend stores `user_id` in `localStorage`.

Current UI behavior:

- The password field has an eye button to show/hide the password.
- Switching between Sign In and Sign Up clears the form fields.
- Password visibility resets to hidden when switching modes.

Files involved:

- `frontend/src/app/auth/page.tsx`
- `frontend/src/lib/members-api.ts`
- `backend/src/members/members.controller.ts`
- `backend/src/members/members.service.ts`
- `backend/prisma/schema.prisma`

If removed:

The system would not know who is manager/member or who can update tasks.

### Role And Title System

What it does:

Role controls permissions. Title is only display text.

Example:

```text
Role: MANAGER
Title: Lead Programmer

Role: MEMBER
Title: Junior Programmer
```

Why it is needed:

It separates real access control from job titles.

Files involved:

- `backend/prisma/schema.prisma`
- `backend/src/members/members.service.ts`
- `frontend/src/app/members/page.tsx`
- `frontend/src/components/app-shell.tsx`

If removed:

Everyone would need the same permission level, or permission logic would become unclear.

### Project Creation And Update

What it does:

Managers can create projects and assign multiple members. Managers can later edit project data and project members.

Why it is needed:

Projects are the workspace containers for tasks.

Files involved:

- `frontend/src/app/projects/page.tsx`
- `frontend/src/lib/projects-api.ts`
- `backend/src/projects/projects.controller.ts`
- `backend/src/projects/projects.service.ts`
- `projects`
- `project_members`

Important behavior:

- Members are selected from a searchable list.
- Project descriptions are plain text in the list.
- Project notes/images are managed in project details/edit flow.
- Only managers can create/update projects.

### Task Creation

What it does:

Managers create tasks and assign them to a project member.

Why it is needed:

Tasks represent actual work.

Current frontend flow:

1. Manager chooses project.
2. Manager chooses assignee.
3. Manager chooses priority.
4. Manager opens Details.
5. Manager enters task name, description, notes, and optional image.
6. Manager clicks Create.
7. Frontend creates task with status `TODO`.

Files involved:

- `frontend/src/app/tasks/page.tsx`
- `frontend/src/lib/tasks-api.ts`
- `backend/src/tasks/tasks.controller.ts`
- `backend/src/tasks/tasks.service.ts`
- `tasks`

If removed:

There would be no way to assign work to members.

### Task Visibility And View-Only Rules

What it does:

Members can see all tasks inside projects they belong to.

Why it is needed:

Team members need awareness of teammate work.

Rules:

```text
Manager = sees all tasks
Member = sees all tasks in member projects
Assignee = can edit/move own task
Other project member = view only
```

Files involved:

- `frontend/src/app/tasks/page.tsx`
- `backend/src/tasks/tasks.service.ts`

If removed:

Members would only see their own tasks and lose project-level awareness.

### Drag-And-Drop Task Status

What it does:

Task cards can be dragged between Kanban columns.

Columns:

```text
TODO
IN_PROGRESS
DONE
COMPLETED
```

Rules:

```text
Assignee can move own task between TODO, IN_PROGRESS, DONE in any direction.
Manager can move DONE to COMPLETED.
COMPLETED tasks are locked.
```

Files involved:

- `frontend/src/app/tasks/page.tsx`
- `@dnd-kit/core`
- `backend/src/tasks/tasks.service.ts`

If removed:

Users would need a less interactive way to update status.

### Change Logs

What it does:

Every task status change creates a log.

Example remarks:

```text
demo_member moved task from TODO to IN_PROGRESS
demo_manager approved task from DONE to COMPLETED
```

Why it is needed:

It gives accountability and history.

Files involved:

- `backend/src/tasks/tasks.service.ts`
- `backend/src/change-logs/change-logs.controller.ts`
- `backend/src/change-logs/change-logs.service.ts`
- `frontend/src/app/change-logs/page.tsx`
- `change_logs`

### Dashboard

What it does:

The dashboard summarizes useful project/task information.

Current dashboard features:

- Role-based stats
- Pending approval section
- Manager approve button
- Task overview donut
- Task completion percentage
- Approval rate
- Priority overview
- Recent activity

Removed behavior:

Project Progress was removed because projects can be long-term and may always receive new tasks, so project completion can be misleading.

Files involved:

- `frontend/src/app/page.tsx`
- `frontend/src/lib/projects-api.ts`
- `frontend/src/lib/tasks-api.ts`
- `frontend/src/lib/members-api.ts`
- `frontend/src/lib/change-logs-api.ts`

### Seed / Initialize

What it does:

Creates demo data for testing.

Why it is needed:

It helps test the app quickly without manually creating all users/projects/tasks.

Endpoint:

```text
POST /initialize
```

Files involved:

- `backend/src/initialize/initialize.controller.ts`
- `backend/src/initialize/initialize.service.ts`

### Image Uploads

What it does:

Users can upload:

- profile images
- project images
- task images

Why it is needed:

It makes records richer and demonstrates file upload integration.

How it works:

1. Frontend sends `multipart/form-data`.
2. Backend uses `FileInterceptor`.
3. Backend sends file to Supabase Storage.
4. Public URL is saved in PostgreSQL.

Limits:

```text
Max file size: 5 MB
Accepted frontend input: image/*
Storage bucket example: management-tool-images
```

Files involved:

- `backend/src/storage/storage.service.ts`
- `backend/src/members/members.controller.ts`
- `backend/src/projects/projects.controller.ts`
- `backend/src/tasks/tasks.controller.ts`

---

## 9. Connection Mapping

### Authentication

```text
Auth Page
  -> membersApi.login()
  -> POST /testlogin
  -> MembersController.login()
  -> MembersService.login()
  -> Prisma User/members table
```

### Project Creation

```text
Projects Page
  -> createProject()
  -> POST /test02/create_project
  -> ProjectsController.createProject()
  -> ProjectsService.createProject()
  -> Prisma Project + ProjectMember
  -> projects + project_members tables
```

### Project Edit Members

```text
Projects Page Edit Modal
  -> patchProject()
  -> PATCH /test02/patch_project
  -> ProjectsController.patchProject()
  -> ProjectsService.patchProject()
  -> projects + project_members tables
```

### Task Creation Modal

```text
Tasks Page Create Form + Details Modal
  -> createTask()
  -> POST /test03/create_task
  -> TasksController.createTask()
  -> TasksService.createTask()
  -> tasks table
```

### Task Notes

```text
Task Details Modal
  -> updateTaskDetails()
  -> PATCH /test03/update_task_details
  -> TasksController.updateTaskDetails()
  -> TasksService.updateTaskDetails()
  -> tasks table
```

### Task Image Upload

```text
Task Details Modal
  -> uploadTaskImage()
  -> POST /test03/upload_task_image
  -> TasksController.uploadTaskImage()
  -> TasksService.uploadTaskImage()
  -> StorageService.uploadImage()
  -> Supabase Storage + tasks.image_url
```

### Kanban Drag-And-Drop

```text
Task Card Drag
  -> handleDragEnd()
  -> patchTask()
  -> PATCH /test03/patch_task
  -> TasksController.patchTask()
  -> TasksService.patchTask()
  -> tasks table
  -> change_logs table
```

### Dashboard Approval Button

```text
Dashboard Pending Approval
  -> handleApproveTask()
  -> patchTask(status: COMPLETED)
  -> PATCH /test03/patch_task
  -> TasksService.patchTask()
  -> tasks.status = COMPLETED
  -> change_logs row created
```

### Change Logs Page

```text
Change Logs Page
  -> getAllChangeLogs()
  -> GET /test04/get_all_change_log
  -> ChangeLogsController.getAllChangeLog()
  -> ChangeLogsService.getAllChangeLog()
  -> change_logs table
```

---

## 10. Process Timeline

### 1. Project Setup

- Created frontend with Next.js.
- Created backend with NestJS.
- Installed Tailwind CSS, Axios, Prisma, Swagger, and validation packages.

### 2. Database Setup

- Connected backend to Supabase PostgreSQL.
- Created Prisma schema.
- Ran migrations to create database tables.
- Generated Prisma client.

### 3. Swagger Setup

- Added Swagger UI at `/api_test`.
- Matched company-style endpoint names such as `/test01`, `/test02`, `/test03`, `/test04`.

### 4. Authentication

- Created member sign-up and sign-in.
- Added password hashing.
- Stored current user in frontend `localStorage`.
- Added password eye toggle.
- Cleared form state when switching between Sign In and Sign Up.

### 5. Project Feature

- Added create project.
- Added update project.
- Added multiple project members.
- Added project notes/images.

### 6. Task Feature

- Added create task.
- Added priority.
- Added assignee.
- Added task notes/images.
- Simplified create task flow so status is always `TODO`.
- Moved task name into details modal.

### 7. Role-Based Rules

- Added `MANAGER` and `MEMBER`.
- Added title field for display.
- Managers gained global project/task visibility.
- Members gained project-scoped visibility.

### 8. Kanban And Approval

- Added drag-and-drop board.
- Members can move assigned tasks between `TODO`, `IN_PROGRESS`, and `DONE`.
- Managers approve `DONE` to `COMPLETED`.
- Completed tasks are locked.

### 9. Change Logs

- Added automatic status-change history.
- Added change log page with search/filter/pagination.

### 10. Dashboard Improvements

- Added role-based dashboard stats.
- Added pending approval section.
- Added manager approve button.
- Added priority overview.
- Added recent activity.
- Removed project progress because projects are long-running.

### 11. Storage

- Added Supabase Storage upload support.
- Connected profile/project/task images to public URLs.

---

## 11. Beginner Explanation Of Important Parts

### Why Did We Create DTOs?

DTO means Data Transfer Object.

DTOs describe what data an API expects.

Example:

```text
Create task expects project_id, user_id, assignee_user_id, name, status, priority, contents.
```

If DTOs are removed, invalid data can more easily reach the service logic.

### Why Did We Create Services?

Services contain the real business logic.

Example:

```text
TasksService checks if user is manager, if assignee belongs to project, and if status movement is allowed.
```

If services are removed, controllers become messy and hard to maintain.

### Why Did We Create Controllers?

Controllers define API routes.

Example:

```text
@Patch('test03/patch_task')
```

If controllers are removed, the frontend has no API endpoints to call.

### Why Did We Create Prisma Models?

Prisma models define database structure in TypeScript-friendly form.

If Prisma schema is removed, the backend loses a clear map of database tables and relationships.

### Why Do We Need ProjectMember?

A project can have many members, and a member can join many projects.

This is a many-to-many relationship, so it needs a linking table.

Without it, a project could only have one user or membership would be hard to query.

### Why Do We Need Change Logs?

Change logs answer:

```text
Who moved this task?
What was the old status?
What is the new status?
When did it happen?
```

Without change logs, task status history would disappear.

### Why Is Completed Locked?

`COMPLETED` means the manager reviewed and approved the task.

If it could still be changed freely, approval would lose meaning.

### Why Can Members See Teammate Tasks?

Project collaboration requires visibility.

Members can see all tasks in their projects, but they can only edit/move their own assigned tasks.

This balances teamwork and permission control.

### Why Is Project Progress Removed?

Projects can be long-term. A project may always receive new tasks for improvements, bugs, or future upgrades.

Because of that, a project completion percentage can be misleading. The dashboard now focuses on task completion and approval rate instead.

---

## 12. Assessment Presentation Summary

You can explain the system like this:

```text
This is a full-stack project management tool built with Next.js, NestJS, Prisma, and PostgreSQL.

The system has two permission roles: MANAGER and MEMBER. Managers can create projects, add project members, create tasks, assign tasks, and approve completed work. Members can view projects they belong to and all tasks inside those projects, but they can only move or edit tasks assigned to them.

Tasks follow a workflow: TODO, IN_PROGRESS, DONE, and COMPLETED. A member moves their own task between TODO, IN_PROGRESS, and DONE. DONE means the assignee says the task is finished. COMPLETED means a manager reviewed and approved it. Once a task is COMPLETED, it is locked.

Every task status update creates a change log, so the system has an audit trail. The dashboard summarizes role-based statistics, pending approvals, priorities, recent activity, task completion, and approval rate.

The backend uses NestJS controllers and services, Prisma for database access, PostgreSQL through Supabase for storage, and Swagger for API documentation. The frontend uses Next.js, Tailwind CSS, Axios, and dnd-kit for the Kanban drag-and-drop board.
```

---

## Common Local Commands

Backend:

```bash
cd backend
npm run start:dev
npm run build
npx prisma generate
npx prisma migrate dev
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
```

Useful local URLs:

```text
Frontend: http://localhost:3000
Backend: http://localhost:3001
Swagger: http://localhost:3001/api_test
```

## Final Project State

The current documentation describes the final assessment version of the system. Future improvements can still be added, but the implemented feature set is complete for the current project scope.
