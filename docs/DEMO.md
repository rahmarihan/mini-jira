# Mini-Jira demo users & scenario

## Accounts (password for all: `DemoPass123!`)

| Name | Email | Role | teamId |
|------|-------|------|--------|
| Ali | ali@demo.com | Manager | ALL |
| Sara | sara@demo.com | Employee | Frontend |
| Omar | omar@demo.com | Employee | Backend |

## Seed (one-time)

From `backend/` with AWS credentials in `.env`:

```bash
npm run seed:demo
```

This creates/updates Cognito users, DynamoDB user rows, and demo tasks:

- **Task A** — Frontend, assignee Sara (`demo-task-a-frontend`)
- **Task B** — Backend, assignee Omar (`demo-task-b-backend`)

After seed, copy printed Cognito `sub` values into `frontend/src/config/demo-users.ts` → `DEMO_ASSIGNEE_PRESETS[].assigneeId` for quick-assign in the create-task form (optional if using seeded tasks only).

## Demo day flow (no code changes)

1. **Ali** logs in → **Dashboard** (all teams, filter by Frontend/Backend) + **Kanban** → Task A & B.
2. **Sara** logs in → **Dashboard** (Frontend metrics only) + **Kanban** → **only Task A**.
3. **Omar** logs in → **Dashboard** (Backend metrics only) + **Kanban** → **only Task B**.
4. Ali can create new tasks via **New Task** on Dashboard/Kanban (managers only).

## Server-side enforcement

- `GET /tasks`: employees only receive tasks where `task.teamId === user.teamId`; managers see all (optional `?teamId=` filter).
- `GET /tasks/:id`, `PATCH`, status: forbidden if wrong team for employees.
- `POST /tasks`: **Manager only** (`@Roles('Manager')`).
