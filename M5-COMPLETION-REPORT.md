# M5 Completion Report — Infrastructure & UI

**Member:** M5 (Infrastructure)  
**Status:** Ready for handoff to M1, M2, M3, M4

---

## 1. Files created (M5 ownership)

### Frontend — Dashboard (UI shells for M2)

| File | Default export | Named export | Types exported |
|------|----------------|--------------|----------------|
| `frontend/src/app/dashboard/page.tsx` | `DashboardPage` | — | — |
| `frontend/src/components/dashboard/StatsCards.tsx` | ✅ | `StatsCards` | `StatsCardsProps`, `DashboardStats` |
| `frontend/src/components/dashboard/TeamDashboard.tsx` | ✅ | `TeamDashboard` | `TeamDashboardProps`, `TeamMember` |
| `frontend/src/components/dashboard/SkeletonLoader.tsx` | ✅ | `SkeletonLoader` | `SkeletonVariant` |
| `frontend/src/components/dashboard/index.ts` | — | barrel | re-exports above |

**StatsCards props (M2):**

```typescript
stats?: { total: number; completed: number; inProgress: number; overdue: number };
loading?: boolean;
```

**TeamDashboard props (M2):**

```typescript
teamId?: string;
members?: Array<{ name: string; role: string; taskCount: number }>;
loading?: boolean;
```

**SkeletonLoader props (M2):**

```typescript
variant?: 'card' | 'list' | 'table' | 'kanban';
count?: number;
className?: string;
loading?: boolean; // via parent; component uses variant for layout
```

### Frontend — Layout (M1 + M2)

| File | Default export | Named export |
|------|----------------|--------------|
| `frontend/src/components/layout/Navbar.tsx` | ✅ | `Navbar` |
| `frontend/src/components/layout/Sidebar.tsx` | ✅ | `Sidebar` |
| `frontend/src/components/layout/AppShell.tsx` | ✅ | `AppShell` |
| `frontend/src/components/layout/TeamSelector.tsx` | ✅ | `TeamSelector` |
| `frontend/src/components/layout/AuthHydrator.tsx` | ✅ | — (M1 session init) |
| `frontend/src/components/layout/index.ts` | — | barrel |

Navbar uses M1 `useAuth()` — **no mock users**. Manager team dropdown uses `teams` prop from `AppShell` (Frontend / Backend IDs only).

### Frontend — shadcn/ui (M1 + M2)

| File | Exports |
|------|---------|
| `frontend/src/components/ui/button.tsx` | `Button`, `buttonVariants` |
| `frontend/src/components/ui/card.tsx` | `Card`, `CardHeader`, `CardContent`, `CardTitle`, … |
| `frontend/src/components/ui/dialog.tsx` | `Dialog`, `DialogTrigger`, `DialogContent`, … |
| `frontend/src/components/ui/input.tsx` | `Input` |
| `frontend/src/components/ui/select.tsx` | `Select`, `SelectTrigger`, `SelectValue`, `SelectItem`, … |
| `frontend/src/components/ui/textarea.tsx` | `Textarea` |
| `frontend/src/components/ui/index.ts` | **barrel** — all of the above |

**Import examples for teammates:**

```typescript
import { Button, Input, Card } from '@/src/components/ui';
import { StatsCards, TeamDashboard, SkeletonLoader } from '@/src/components/dashboard';
import { Navbar, Sidebar, AppShell } from '@/src/components/layout';
```

### Frontend — Config & env

| File | Purpose |
|------|---------|
| `frontend/components.json` | shadcn aliases → `@/src/components/ui` |
| `frontend/src/app/globals.css` | shadcn base + dark tokens + skeleton shimmer |
| `frontend/middleware.ts` | Route protection (cookie `token`) |
| `frontend/.env.local.example` | `NEXT_PUBLIC_API_URL=http://localhost:3001` |
| `frontend/lib/axios.ts` | M1 `mini-jira.idToken` in `Authorization` header |

### Backend — Infrastructure (M5)

| File | Purpose |
|------|---------|
| `backend/scripts/create-tables.sh` | **Canonical** AWS CLI script (`Mini-jira-*` names) |
| `infrastructure/dynamodb/create-tables.sh` | Wrapper → `backend/scripts/create-tables.sh` |
| `infrastructure/dynamodb/delete-tables.sh` | Dev teardown |
| `infrastructure/README.md` | Table docs + usage |
| `backend/.env.example` | Cognito, DynamoDB names, `DYNAMODB_FALLBACK_TO_MEMORY` |
| `backend/src/common/interceptors/logging.interceptor.ts` | Optional HTTP logging (not registered) |

---

## 2. Member dependency matrix

### M1 (Auth) — ✅ Ready

| Need | Status | Location |
|------|--------|----------|
| `Mini-jira-Users` table script | ✅ | `backend/scripts/create-tables.sh` |
| `Mini-jira-Teams` table script | ✅ | same |
| `input`, `button`, `card` | ✅ | `src/components/ui/` + `index.ts` |
| `Navbar`, `Sidebar` | ✅ | `src/components/layout/` |
| `/dashboard` route | ✅ | `src/app/dashboard/page.tsx` |
| `NEXT_PUBLIC_API_URL` example | ✅ | `.env.local.example` |

M1 owns: `auth/*`, `auth.store.ts`, `LoginForm`, `RegisterForm`, Cognito guard.

### M2 (Tasks/Projects) — ✅ Ready

| Need | Status | Location |
|------|--------|----------|
| `/dashboard` page | ✅ | layout shell only |
| `dialog`, `button`, `input`, `select`, `textarea`, `card` | ✅ | `src/components/ui/` |
| `SkeletonLoader` | ✅ | variants: card, list, table, kanban |
| `StatsCards`, `TeamDashboard` | ✅ | typed props, no fetching |
| `Navbar`, `Sidebar`, `AppShell` | ✅ | wired in `src/app/layout.tsx` |
| Tasks / Projects / AuditLog tables | ✅ | `Mini-jira-Tasks`, `Mini-jira-Projects`, `Mini-jira-AuditLog` in script |

M2 owns: wire `dashboard/page.tsx`, `useTasks`, pass props to M5 shells; align `tasks.service.ts` table constant with `DYNAMODB_TASKS_TABLE` if using real DynamoDB.

### M3 (Files/Comments) — N/A direct; table included

| Need | Status |
|------|--------|
| `Mini-jira-Comments` in create script | ✅ |

### M4 (Notifications) — N/A direct; table included

| Need | Status |
|------|--------|
| `Mini-jira-Notifications` in create script | ✅ |

---

## 3. DynamoDB tables (script)

Run (requires AWS CLI + credentials):

```bash
chmod +x backend/scripts/create-tables.sh
AWS_REGION=eu-north-1 ./backend/scripts/create-tables.sh
```

| Table | PK | GSI |
|-------|-----|-----|
| Mini-jira-Users | userId | email-index |
| Mini-jira-Teams | teamId | — |
| Mini-jira-Tasks | taskId | teamId-index, assigneeId-index |
| Mini-jira-Projects | projectId | — |
| Mini-jira-AuditLog | logId | taskId-index |
| Mini-jira-Comments | commentId | taskId-index |
| Mini-jira-Notifications | notificationId | userId-index |

Override names via env vars: `DYNAMODB_USERS_TABLE`, etc. (see `backend/.env.example`).

Local dev without AWS: `DYNAMODB_FALLBACK_TO_MEMORY=true` in `backend/.env`.

---

## 4. Boundaries (no conflicts)

| Area | M5 provides | M1/M2 own |
|------|-------------|-----------|
| Auth / Cognito | Layout shell, route, axios token hook-up | login, store, guards |
| Task CRUD | UI shells + tables script | services, controllers, kanban data |
| Dashboard data | Props + skeleton/empty UI only | `useTasks`, stats/members on `/dashboard` |
| Task board | — (not on dashboard) | `/kanban` — columns, cards, TaskModal |
| Mock data | **None** in M5 components | test users in Cognito |

---

## 5. Known gaps (not M5 blockers)

1. **Legacy folder:** `frontend/components/ui/` duplicates exist — use `@/src/components/ui` only.
2. **M2 table names:** `tasks.service.ts` uses literal `'Tasks'`; AWS script creates `Mini-jira-Tasks` — M2 should read `process.env.DYNAMODB_TASKS_TABLE` or keep in-memory fallback.
3. **Projects API:** `ProjectsController` lacks `CognitoAuthGuard` — M1/backend fix.
4. **Dashboard page:** UI shell with `loading` skeletons until M2 wires `stats`, `members`, and `loading={false}`. No task board (Kanban only).
5. **`.env.local`:** Not committed — copy from `.env.local.example`.

---

## 6. Verification commands

```bash
# Frontend
cd frontend && npx tsc --noEmit && npm run build && npm run lint

# Backend
cd backend && npm run build
```

---

## 7. Success criteria checklist

- [x] M1 can import Navbar, Sidebar, Button, Input, Card  
- [x] M1 has Users + Teams table creation script  
- [x] M2 can import StatsCards, TeamDashboard, SkeletonLoader, Dialog, Select, Textarea  
- [x] M2 has Tasks, Projects, AuditLog table scripts  
- [x] `/dashboard` route exists  
- [x] shadcn/ui installed under `src/components/ui/` with barrel `index.ts`  
- [x] TypeScript interfaces exported for M2  
- [x] No hardcoded mock users in M5 UI  

**M5 handoff: complete.**
