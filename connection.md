# System Connection Map

This document explains how the final DOWINN Management Tool connects from frontend pages to backend APIs, backend services, Prisma, PostgreSQL, and Supabase Storage.

---

## 1. Core Connection Pattern

```text
User interaction
  -> Next.js page
  -> API helper in frontend/src/lib
  -> Axios client
  -> NestJS controller
  -> NestJS service
  -> Prisma
  -> PostgreSQL database
  -> response returns to frontend state
```

For image uploads:

```text
User selects image
  -> FormData
  -> NestJS FileInterceptor
  -> StorageService
  -> Supabase Storage
  -> public URL saved in PostgreSQL
```

---

## 2. Authentication Connection

### Sign In

```text
frontend/src/app/auth/page.tsx
  -> loginMember(user_id, password)
  -> frontend/src/lib/members-api.ts
  -> POST /testlogin
  -> MembersController.login()
  -> MembersService.login()
  -> prisma.user.findUnique({ userId })
  -> bcrypt.compare()
  -> { data: "ok" }
  -> localStorage["dowinn_user_id"] = user_id
```

Notes:

- The password input has an eye toggle.
- Switching between Sign In and Sign Up clears the form.
- The current version does not issue JWT tokens.
- Backend permission checks are done in services using the submitted `user_id`.

### Sign Up

```text
frontend/src/app/auth/page.tsx
  -> createMember()
  -> POST /test01/create_member
  -> MembersService.createMember()
  -> bcrypt.hash()
  -> prisma.user.create()
  -> members table
```

---

## 3. Dashboard Connection

File:

```text
frontend/src/app/page.tsx
```

Data load:

```text
Dashboard page
  -> getAllProjects()
  -> GET /test02/get_all_project
  -> projects + project_members + members

Dashboard page
  -> getAllTasks()
  -> GET /test03/get_all_task
  -> tasks + assignee member

Dashboard page
  -> getAllMembers()
  -> GET /test01/get_all_member
  -> members

Dashboard page
  -> getAllChangeLogs()
  -> GET /test04/get_all_change_log
  -> change_logs
```

Frontend calculations:

- Role-based dashboard stats
- Pending approval list
- Task overview
- Task completion
- Approval rate
- Priority overview
- Recent activity

Manager approval:

```text
Manager clicks Approve
  -> handleApproveTask()
  -> patchTask({ status: "COMPLETED" })
  -> PATCH /test03/patch_task
  -> TasksService.patchTask()
  -> validates MANAGER and DONE -> COMPLETED
  -> tasks.status = COMPLETED
  -> change_logs row created
```

---

## 4. Project Connection

### Create Project

```text
frontend/src/app/projects/page.tsx
  -> createProject()
  -> POST /test02/create_project
  -> ProjectsController.createProject()
  -> ProjectsService.createProject()
  -> validates user is MANAGER
  -> prisma.project.create()
  -> nested project_members rows
```

Tables:

- `members`
- `projects`
- `project_members`

### Edit Project And Members

```text
Projects edit modal
  -> patchProject()
  -> PATCH /test02/patch_project
  -> ProjectsService.patchProject()
  -> validates user is MANAGER
  -> updates projects table
  -> replaces project_members rows
```

### Project Notes And Image

```text
Project details/edit area
  -> updateProjectDetails()
  -> PATCH /test02/update_project_details
  -> projects.notes

Project image input
  -> uploadProjectImage()
  -> POST /test02/upload_project_image
  -> StorageService.uploadImage()
  -> Supabase Storage
  -> projects.image_url
```

---

## 5. Task Connection

### Task Page Load

```text
frontend/src/app/tasks/page.tsx
  -> getAllProjects()
  -> getAllTasks()
  -> getAllChangeLogs()
  -> getAllMembers()
```

Visibility rule:

```text
MANAGER:
  sees all tasks

MEMBER:
  sees all tasks inside projects where they are a member
  teammate tasks are view-only
```

### Create Task

Current manager flow:

```text
Manager selects project
  -> selects assignee
  -> selects priority
  -> opens Details modal
  -> enters task name and description
  -> optional notes/image
  -> clicks Create
```

Connection:

```text
handleCreateTask()
  -> createTask({
       project_id,
       user_id,
       assignee_user_id,
       name,
       status: "TODO",
       priority,
       contents
     })
  -> POST /test03/create_task
  -> TasksService.createTask()
  -> validates creator is MANAGER
  -> validates assignee belongs to project
  -> prisma.task.create()
```

Optional details:

```text
If notes exist:
  -> updateTaskDetails()
  -> PATCH /test03/update_task_details
  -> tasks.notes

If image exists:
  -> uploadTaskImage()
  -> POST /test03/upload_task_image
  -> Supabase Storage
  -> tasks.image_url
```

### Kanban Drag-And-Drop

Frontend:

```text
DndContext
  -> handleDragStart()
  -> handleDragEnd()
  -> patchTask()
```

Backend:

```text
PATCH /test03/patch_task
  -> TasksController.patchTask()
  -> TasksService.patchTask()
  -> validates current user
  -> validates role and assignment
  -> updates tasks.status
  -> creates change_logs row
```

Rules:

```text
Assignee:
  TODO <-> IN_PROGRESS <-> DONE

Manager:
  DONE -> COMPLETED

Completed:
  locked
```

### Task Details

```text
Task card click
  -> opens modal using already loaded task state
  -> shows project, assignee, status, priority, contents, notes, image, history
```

Edit rules:

```text
MANAGER:
  can edit non-completed task details

ASSIGNEE:
  can edit own non-completed task details

OTHER PROJECT MEMBER:
  view-only

COMPLETED:
  locked
```

---

## 6. Change Log Connection

Automatic status logs:

```text
Task status changes
  -> TasksService.patchTask()
  -> prisma.changeLog.create()
  -> change_logs table
```

Change Logs page:

```text
frontend/src/app/change-logs/page.tsx
  -> getAllChangeLogs()
  -> getAllTasks()
  -> getAllProjects()
  -> frontend joins task/project context
  -> search/filter/pagination
```

Displayed filters:

- Search by task name or remark
- Combined old/new status filter
- Project filter
- Reset filters
- Pagination, 10 logs per page

---

## 7. Members Connection

Members page:

```text
frontend/src/app/members/page.tsx
  -> getAllMembers()
  -> getAllProjects()
  -> getAllTasks()
```

Manager title update:

```text
Manager edits member title
  -> updateMemberTitle()
  -> PATCH /test01/update_member_title
  -> MembersService.updateMemberTitle()
  -> validates manager
  -> updates members.title
```

Member details show:

- user id
- email
- role
- title
- project memberships
- assigned tasks

---

## 8. Settings And Profile Connection

Settings page:

```text
frontend/src/app/settings/page.tsx
```

Current behavior:

- Shows current user profile settings.
- Supports logout.
- Supports profile image behavior using backend/member profile image APIs.
- Removes `dowinn_user_id` from `localStorage` on logout.

Logout:

```text
User clicks Logout
  -> localStorage.removeItem("dowinn_user_id")
  -> router.push("/auth")
```

There is no backend logout route because the current auth does not use server sessions or JWT.

---

## 9. Database Relationship Map

```text
User (members)
  -> creates many Project rows
  -> belongs to many Project rows through ProjectMember
  -> can be assigned many Task rows

Project
  -> belongs to one owner User
  -> has many ProjectMember rows
  -> has many Task rows

ProjectMember
  -> links one Project to one User

Task
  -> belongs to one Project
  -> optionally belongs to one assignee User
  -> has many ChangeLog rows

ChangeLog
  -> belongs to one Task
```

---

## 10. Storage Connection

Environment:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
```

Upload flow:

```text
Frontend file input
  -> FormData
  -> NestJS FileInterceptor
  -> StorageService.uploadImage()
  -> Supabase Storage bucket
  -> public URL
  -> saved in PostgreSQL
```

Storage use cases:

- member profile image
- project image
- task image

Limits:

- max upload size: 5 MB
- accepted input: `image/*`

---

## 11. Final Interview Explanation

You can explain the system connection like this:

```text
The frontend is built with Next.js and uses Axios helpers to call NestJS endpoints. Each backend controller only receives the request and passes it to a service. The service contains the real business rules, such as manager permissions, project membership checks, assignee-only movement, and manager approval. Prisma connects those services to PostgreSQL tables in Supabase. For images, the backend uploads the file to Supabase Storage and saves the public URL in PostgreSQL.
```
