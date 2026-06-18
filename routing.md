# Routing And Mapping Documentation

This document maps the final frontend routes, backend API routes, service methods, and database tables for the DOWINN Management Tool.

---

## 1. Architecture Summary

| Layer | Technology | Main Files |
|---|---|---|
| Frontend routing | Next.js App Router | `frontend/src/app/**/page.tsx` |
| Shared layout | React component | `frontend/src/components/app-shell.tsx` |
| API client | Axios | `frontend/src/lib/api.ts`, `frontend/src/lib/*-api.ts` |
| Backend routing | NestJS controllers | `backend/src/**/*controller.ts` |
| Backend logic | NestJS services | `backend/src/**/*service.ts` |
| Database mapping | Prisma | `backend/prisma/schema.prisma` |
| Database/storage | Supabase | PostgreSQL and Storage bucket |

Standard request path:

```text
Frontend page
  -> API helper
  -> Axios client
  -> NestJS controller
  -> NestJS service
  -> Prisma
  -> PostgreSQL/Supabase Storage
```

---

## 2. Frontend Routing Map

| Route | Page File | Main Purpose | Main APIs |
|---|---|---|---|
| `/auth` | `frontend/src/app/auth/page.tsx` | Sign in/sign up, password eye toggle, clears form when switching mode | `loginMember()`, `createMember()` |
| `/` | `frontend/src/app/page.tsx` | Role-aware dashboard, pending approvals, priority overview, recent activity | `getAllProjects()`, `getAllTasks()`, `getAllMembers()`, `getAllChangeLogs()`, `patchTask()` |
| `/projects` | `frontend/src/app/projects/page.tsx` | Create/edit projects, manage project members, project notes/images | `getAllProjects()`, `getAllTasks()`, `getAllMembers()`, `createProject()`, `patchProject()`, `updateProjectDetails()`, `uploadProjectImage()` |
| `/tasks` | `frontend/src/app/tasks/page.tsx` | Kanban board, task creation, task details, task filters, image upload | `getAllProjects()`, `getAllTasks()`, `getAllChangeLogs()`, `getAllMembers()`, `createTask()`, `patchTask()`, `updateTaskDetails()`, `uploadTaskImage()` |
| `/change-logs` | `frontend/src/app/change-logs/page.tsx` | Status history with search, status/project filters, pagination | `getAllChangeLogs()`, `getAllTasks()`, `getAllProjects()` |
| `/members` | `frontend/src/app/members/page.tsx` | Member list, member details, title editing for managers, assigned tasks | `getAllMembers()`, `getAllProjects()`, `getAllTasks()`, `updateMemberTitle()` |
| `/settings` | `frontend/src/app/settings/page.tsx` | User settings, profile image, local display preferences, logout | member profile APIs and browser storage |

Protected pages use `AppShell`, which checks `localStorage["dowinn_user_id"]`. If missing, the user is redirected to `/auth`.

---

## 3. Backend Routing Map

### Members And Auth

| Method | Route | Controller Method | Service Method | Purpose |
|---|---|---|---|---|
| POST | `/testlogin` | `MembersController.login()` | `MembersService.login()` | Validate `user_id` and password |
| POST | `/test01/create_member` | `createMember()` | `createMember()` | Create member account |
| GET | `/test01/get_all_member` | `getAllMember()` | `getAllMember()` | Return members without password hashes |
| GET | `/test01/get_member?id=1` | `getMember()` | `getMember()` | Return one member |
| PATCH | `/test01/update_member` | `updateMember()` | `updateMember()` | Update email/password |
| PATCH | `/test01/update_member_title` | `updateMemberTitle()` | `updateMemberTitle()` | Manager updates member title |
| POST | `/test01/upload_member_profile_image` | `uploadMemberProfileImage()` | `uploadMemberProfileImage()` | Upload profile image |
| PATCH | `/test01/remove_member_profile_image` | `removeMemberProfileImage()` | `removeMemberProfileImage()` | Remove profile image URL |

### Projects

| Method | Route | Controller Method | Service Method | Purpose |
|---|---|---|---|---|
| POST | `/test02/create_project` | `ProjectsController.createProject()` | `ProjectsService.createProject()` | Manager creates project and members |
| GET | `/test02/get_all_project` | `getAllProject()` | `getAllProject()` | Return projects with members |
| GET | `/test02/get_project?id=1` | `getProject()` | `getProject()` | Return one project |
| PATCH | `/test02/patch_project` | `patchProject()` | `patchProject()` | Manager updates project and member list |
| PATCH | `/test02/update_project_details` | `updateProjectDetails()` | `updateProjectDetails()` | Manager updates project notes |
| POST | `/test02/upload_project_image` | `uploadProjectImage()` | `uploadProjectImage()` | Upload project image |

### Tasks

| Method | Route | Controller Method | Service Method | Purpose |
|---|---|---|---|---|
| POST | `/test03/create_task` | `TasksController.createTask()` | `TasksService.createTask()` | Manager creates task with `TODO` status |
| GET | `/test03/get_all_task` | `getAllTask()` | `getAllTask()` | Return all tasks |
| GET | `/test03/get_task?id=1` | `getTask()` | `getTask()` | Return one task |
| PATCH | `/test03/patch_task` | `patchTask()` | `patchTask()` | Move status, approve task, or manager update |
| PATCH | `/test03/update_task_details` | `updateTaskDetails()` | `updateTaskDetails()` | Update task notes/details |
| POST | `/test03/upload_task_image` | `uploadTaskImage()` | `uploadTaskImage()` | Upload task image |

### Change Logs

| Method | Route | Controller Method | Service Method | Purpose |
|---|---|---|---|---|
| POST | `/test04/create_changelog` | `ChangeLogsController.createChangeLog()` | `ChangeLogsService.createChangeLog()` | Manual log creation |
| GET | `/test04/get_all_change_log` | `getAllChangeLog()` | `getAllChangeLog()` | Return all logs |
| GET | `/test04/get_change_log?id=1` | `getChangeLog()` | `getChangeLog()` | Return one log |
| PATCH | `/test04/update_change_log` | `updateChangeLog()` | `updateChangeLog()` | Update log record |

### Utility

| Method | Route | Controller Method | Service Method | Purpose |
|---|---|---|---|---|
| POST | `/initialize` | `InitializeController.initializeDatabase()` | `InitializeService.initializeDatabase()` | Seed demo data |
| GET | `/api_test` | Swagger setup in `main.ts` | none | Interactive API documentation |

---

## 4. Database Model Mapping

| Prisma Model | Table | Main Use |
|---|---|---|
| `User` | `members` | Member accounts, role, title, profile image |
| `Project` | `projects` | Project records |
| `ProjectMember` | `project_members` | Many-to-many project membership |
| `Task` | `tasks` | Tasks, assignee, status, priority, notes, image |
| `ChangeLog` | `change_logs` | Task status movement history |

---

## 5. Main User Flows

### Sign In

```text
/auth
  -> loginMember()
  -> POST /testlogin
  -> MembersController.login()
  -> MembersService.login()
  -> prisma.user.findUnique()
  -> bcrypt password compare
  -> frontend stores dowinn_user_id
```

### Sign Up

```text
/auth
  -> createMember()
  -> POST /test01/create_member
  -> MembersService.createMember()
  -> bcrypt hashes password
  -> members table
```

### Dashboard Load

```text
/
  -> getAllProjects()
  -> getAllTasks()
  -> getAllMembers()
  -> getAllChangeLogs()
  -> frontend calculates role stats, pending approvals, priority overview, recent activity
```

### Dashboard Approval

```text
Manager clicks Approve
  -> patchTask(status: "COMPLETED")
  -> PATCH /test03/patch_task
  -> TasksService.patchTask()
  -> validates manager and DONE -> COMPLETED
  -> updates tasks.status
  -> creates change_logs row
```

### Project Create/Edit

```text
/projects
  -> createProject() or patchProject()
  -> project controller
  -> project service
  -> validates MANAGER
  -> updates projects and project_members
```

### Task Create

```text
/tasks
  -> manager chooses project, assignee, priority
  -> manager opens Details modal
  -> enters task name, description, notes, image
  -> createTask(status: "TODO")
  -> optional updateTaskDetails()
  -> optional uploadTaskImage()
```

### Task Visibility

```text
MANAGER:
  -> frontend displays all tasks

MEMBER:
  -> frontend displays tasks inside projects where member belongs
  -> teammate tasks are view-only
```

### Kanban Movement

```text
Assignee drags own task
  -> handleDragEnd()
  -> patchTask()
  -> backend validates assignee and status
  -> allowed between TODO, IN_PROGRESS, DONE
  -> COMPLETED blocked for members
```

---

## 6. Page-To-Data Mapping

| Page | Reads | Writes |
|---|---|---|
| `/auth` | `members` for login | `members` for sign up |
| `/` | `projects`, `tasks`, `members`, `change_logs` | `tasks`, `change_logs` when manager approves |
| `/projects` | `projects`, `project_members`, `members`, `tasks` | `projects`, `project_members`, project image URL |
| `/tasks` | `projects`, `project_members`, `members`, `tasks`, `change_logs` | `tasks`, `change_logs`, task image URL |
| `/change-logs` | `change_logs`, `tasks`, `projects` | none from normal UI |
| `/members` | `members`, `projects`, `tasks` | member title |
| `/settings` | current user and profile info | profile image URL, local settings, logout state |

---

## 7. Final Route Notes

- There are no dynamic frontend routes such as `/projects/[id]` or `/tasks/[id]`.
- Project details and task details are handled with modals inside their page.
- There are no `DELETE` endpoints.
- File uploads use `multipart/form-data`.
- Image upload max size is `5 MB`.
- Swagger is available at `http://localhost:3001/api_test`.
- New tasks always start as `TODO`.
- `COMPLETED` tasks are read-only.
