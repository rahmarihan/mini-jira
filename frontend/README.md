# Mini-Jira on AWS
### Software Cloud Computing 2026
**NestJS + Next.js TypeScript Stack | AWS Cloud Architecture | DynamoDB | S3 | Lambda | Cognito**

---

## 🌐 Live Application

> **[https://d9cq3auro8woj.cloudfront.net](https://d9cq3auro8woj.cloudfront.net)**

Click the link above to open the live deployed web application. No additional configuration required.

---

## 🎥 Demo Video

> 📹 *https://drive.google.com/file/d/1kr9j2d1IauiX7zwJU4z3fizAmCDhOWRS/view?usp=drive_link*

---

## 1. Executive Summary

Mini-Jira is a lightweight Jira/Trello-style task management web application designed to run on AWS. It supports manager and employee roles, multiple teams, task assignment, server-side team isolation, comments, image attachments, status tracking, event-driven services, and deployment in a high-availability AWS architecture.

- **Frontend:** Next.js with a polished Kanban board, task modal, comments, image upload, authentication screens, team filters, and loading/error states.
- **Backend:** NestJS REST API with modular services for auth, tasks, projects, comments, files, notifications, and DynamoDB integration.
- **Persistence:** DynamoDB tables for Users, Teams, Projects, Tasks, Comments, AuditLog/ActivityLogs, with GSIs for team and assignee queries.
- **AWS Services:** Cognito, DynamoDB, S3, Lambda, SNS, SQS, EventBridge, CloudWatch, EC2, ALB, Auto Scaling, CloudFront, VPC/IAM.
- **Core Demo Scenario:** Ali as Manager assigns one task to Sara on Frontend and one task to Omar on Backend. Sara and Omar only see their own team tasks, while Ali sees all tasks and can filter by team.

---

## 2. Architecture Diagram

![Mini-Jira AWS Architecture - 5 Member Scope](./architecture.png)

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Users (Browser)                            │
│              Manager Ali  |  Employee Sara  |  Employee Omar        │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Amazon CloudFront (CDN)                          │
│              d9cq3auro8woj.cloudfront.net                          │
│                                                                     │
│   /api/*  ──────────────────────────────► ALB Origin               │
│   /*      ──────────────────────────────► S3 Static Website Origin │
└─────────────────────────────────────────────────────────────────────┘
         │                                          │
         ▼                                          ▼
┌────────────────┐                    ┌─────────────────────────────┐
│ Application    │                    │ S3 Static Website Bucket    │
│ Load Balancer  │                    │ mini-jira-frontend-1        │
│ (ALB)          │                    │ Next.js build output        │
└───────┬────────┘                    └─────────────────────────────┘
        │ Routes to healthy targets
        ▼
┌──────────────────────────────────────────────────┐
│           EC2 Auto Scaling Group                 │
│                                                  │
│  ┌─────────────────┐    ┌─────────────────┐      │
│  │  EC2 Instance   │    │  EC2 Instance   │      │
│  │  eu-north-1a    │    │  eu-north-1b    │      │
│  │  NestJS :3001   │    │  NestJS :3001   │      │
│  └────────┬────────┘    └────────┬────────┘      │
└───────────┼─────────────────────┼────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS Services Layer                           │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Cognito    │  │   DynamoDB   │  │    S3 Buckets            │  │
│  │  User Pool   │  │              │  │  - Originals (private)   │  │
│  │  ID Tokens   │  │  Users       │  │  - Resized  (private)    │  │
│  │  role+teamId │  │  Teams       │  └──────────────────────────┘  │
│  └──────────────┘  │  Tasks       │            │                    │
│                    │  Projects    │       S3 PUT event              │
│  ┌──────────────┐  │  Comments    │            ▼                    │
│  │  CloudWatch  │  │  AuditLog    │  ┌──────────────────────────┐  │
│  │  Logs        │  └──────────────┘  │   Lambda Image Resize    │  │
│  │  Metrics     │                    │   Trigger on S3 PUT      │  │
│  │  Dashboard   │  ┌──────────────┐  │   Writes thumbnail to    │  │
│  │  Alarms→SNS  │  │  SNS / SQS   │  │   resized bucket         │  │
│  └──────────────┘  │  EventBridge │  └──────────────────────────┘  │
│                    │  Assignment  │                                  │
│                    │  Worker λ    │                                  │
│                    │  Daily Digest│                                  │
│                    └──────────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### End-to-End Request Flow

1. User signs in through Cognito and receives identity tokens.
2. Frontend stores the authentication token and sends it in the `Authorization` header to the NestJS backend.
3. Backend guards validate the token and extract `userId`, `email`, `role`, and `teamId`.
4. Task, project, comment, and file requests are authorized based on role/team rules.
5. Structured data is stored in DynamoDB; binary attachments are stored in S3.
6. S3 object creation triggers Lambda to resize the uploaded image and store a thumbnail in the resized bucket.
7. Private S3 images are displayed using presigned GET URLs rather than public bucket policies.
8. Notification events fan out through SNS/SQS, while CloudWatch collects logs, metrics, dashboards, and alarms.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind/shadcn-style UI | Kanban board, login/register, task modal, comments, image upload, filters |
| Backend | NestJS, TypeScript, REST APIs | Controllers, services, guards, DTO validation, business logic |
| Authentication | AWS Cognito | User pool, app client, role/team attributes, token validation |
| Database | Amazon DynamoDB | Stores users, teams, tasks, projects, comments, audit/activity logs |
| Files | Amazon S3 | Stores original task image attachments and resized thumbnails |
| Serverless | AWS Lambda | Image resize, assignment worker, daily digest jobs |
| Events | SNS, SQS, EventBridge | Assignment fan-out, queue buffering, scheduled digest |
| Monitoring | CloudWatch | Logs, custom metrics, dashboards, alarms |

---

## 4. Project Scope and Functional Requirements

### User Roles

| Role | Access Level | Key Capabilities |
|---|---|---|
| Manager | Company-wide | Creates projects and tasks, assigns employees across teams, sees all tasks and dashboards |
| Employee | Own team only | Views and updates only tasks belonging to their team; can comment and attach files |
| Admin | Administrative | Can be merged with Manager; creates teams and manages users |

### Core Functional Requirements

- **Tasks CRUD:** create, read, update, delete tasks with title, description, status, priority, deadline, assignee, team, and optional image attachment.
- **Projects CRUD:** create, read, update, delete projects.
- **Comments:** create and read comment threads per task.
- **Task lifecycle:** `To Do` → `In Progress` → `In Review` → `Done`
- **Audit logging:** record status changes with actor and timestamp.
- **Server-side team isolation:** employee access is enforced in the backend, not only hidden in the UI.
- **Image pipeline:** upload images to S3, resize via Lambda, display thumbnails, retain old images on update, and delete current images when task is deleted.
- **Event-driven notifications:** SNS/SQS assignment events, worker Lambda, daily EventBridge digest, and CloudWatch custom metrics.
- **Monitoring:** CloudWatch dashboard with task and EC2 metrics plus at least one alarm that publishes to SNS.
- **Deployment:** highly available deployment across two AZs using EC2 Auto Scaling Group, ALB, and CloudFront.

---

## 5. Workload Breakdown

### Member 1 — Auth & User Management
Cognito, NestJS guards, Users/Teams tables, role/team identity.

| Backend / API | Frontend | AWS Services | Status |
|---|---|---|---|
| Cognito sign-in/sign-up flow, JWT/Cognito token validation middleware, Role guards for Manager/Employee, Users and Teams DynamoDB tables, Server-side team isolation support | Login page, Register page, Auth context/token storage, Protected route wrapper | Cognito user pool/app client/custom attributes, IAM least-privilege support, VPC networking baseline | Auth/login and protected request flow integrated and tested locally. Frontend sends the Cognito ID token to backend guards. |

### Member 2 — Tasks & Projects CRUD
Core feature owner for tasks, projects, status flow, Kanban UI.

| Backend / API | Frontend | AWS Services | Status |
|---|---|---|---|
| Tasks CRUD API, Projects CRUD API, Tasks table and GSIs on teamId/assigneeId, Status transition logic, Audit log for status changes, Server-side team filtering | Kanban board, Task detail modal, Create/edit task form, Manager team filter dropdown | DynamoDB Tasks table, DynamoDB Projects table, DynamoDB AuditLog table | Task persistence fixed and verified: task fields saved correctly and team filtering works. |

### Member 3 — S3 Images, Lambda Pipeline & Comments
File uploads, thumbnail generation, comments feature.

| Backend / API | Frontend | AWS Services | Status |
|---|---|---|---|
| Presigned S3 PUT endpoint, Link image metadata to Tasks table, Retain old images on update, Delete current image and thumbnail when task deleted, Comments create/read API, Comments table and taskId GSI | Image upload/replace component, Thumbnail display on task cards and modal, Comments thread inside task modal, Image type validation | S3 originals bucket, S3 resized bucket, Lambda image resize trigger on S3 PUT | Implemented and verified end-to-end: upload, resize, metadata sync, signed read URLs, replacement with old versions retained, comments, and delete cleanup. |

### Member 4 — Event-Driven Notifications
SNS, SQS, worker Lambda, daily digest, activity events.

| Backend / API | Frontend | AWS Services | Status |
|---|---|---|---|
| Publish SNS event on assignment, SNS fan-out to email and SQS, SQS queue + DLQ, Assignment Worker Lambda writes activity log, Worker publishes TasksAssignedPerTeam metric, Daily Digest Lambda scans due tasks, EventBridge 9 AM schedule | Activity log view, Notification toast for assignment | SNS topic, SQS queue/DLQ, EventBridge schedule, Lambda Assignment Worker, Lambda Daily Digest | Should be verified through assignment demo, email/SQS fan-out, activity log creation, and CloudWatch custom metric publication. |

### Member 5 — Infrastructure, HA Deployment & Monitoring
EC2, ALB, Auto Scaling, CloudFront, CloudWatch, architecture diagram.

| Backend / API | Frontend | AWS Services | Status |
|---|---|---|---|
| EC2 instances across two AZs, Auto Scaling Group health checks, Application Load Balancer, CloudFront distribution, User Data deployment script, Environment variables/secrets management | Overall UI polish, Loading states/skeletons, Error toasts, Manager dashboard summary widgets | EC2 + ASG, ALB, CloudFront, CloudWatch dashboard and alarm, VPC/subnets/IAM | Production target includes CloudWatch widgets for tasks created/day, tasks closed/day per team, average time-to-close, and EC2 CPU, plus SNS alarm for overdue tasks. |

---

## 6. DynamoDB Data Model

| Table | Partition Key | Indexes | Owner |
|---|---|---|---|
| Mini-jira-Users | userId | email-index, teamId-index if needed | M1 |
| Mini-jira-Teams | teamId | — | M1 |
| Mini-jira-Tasks | taskId | teamId-index, assigneeId-index | M2 |
| Mini-jira-Projects | projectId | — | M2 |
| Mini-jira-Comments | commentId | taskId-index | M3 |
| Mini-jira-AuditLog / ActivityLogs | logId | taskId-index | M2/M4 |

**Design reasoning:**
- The `teamId-index` supports server-side team isolation.
- The `assigneeId-index` supports user-specific task lookups.
- Comments and audit entries are queried through `taskId`-based GSIs.

---

## 7. Backend API Design

| Endpoint | Purpose | Owner |
|---|---|---|
| `POST /auth/login` | Login through Cognito and receive tokens | M1 |
| `POST /auth/register` | Register user via Cognito | M1 |
| `GET /auth/me` | Return current authenticated user | M1 |
| `POST /tasks` | Create task with manager permissions and team/assignee metadata | M2 |
| `GET /tasks` | List tasks with server-side team filtering | M2 |
| `GET /tasks/:id` | Read task only if manager or allowed team member | M2 |
| `PATCH /tasks/:id` | Update task fields and/or image metadata | M2/M3 |
| `PATCH /tasks/:id/status` | Move task through status lifecycle and write audit log | M2 |
| `DELETE /tasks/:id` | Delete task and invoke S3 cleanup for current image/thumbnail | M2/M3 |
| `GET /tasks/:id/audit-log` | Read status/activity history | M2/M4 |
| `POST /projects` | Create project | M2 |
| `GET /projects` | List projects | M2 |
| `PATCH /projects/:id` | Update project | M2 |
| `DELETE /projects/:id` | Delete project | M2 |
| `POST /tasks/:taskId/comments` | Add comment to a task | M3 |
| `GET /tasks/:taskId/comments` | Read comment thread for a task | M3 |
| `POST /tasks/:taskId/files/upload-url` | Generate presigned PUT URL and update task image metadata | M3 |

---

## 8. Key System Workflows

### 8.1 Authentication and Team Authorization
- User signs in through Cognito.
- Frontend receives an ID token and sends it as Bearer token to the backend.
- NestJS auth guard verifies the token and exposes `userId`, `sub`, `email`, `name`, `role`, and `teamId`.
- Manager can access all tasks and filter by team.
- Employee can only access tasks belonging to their team; direct ID guessing is blocked by backend checks.

### 8.2 Task CRUD and Kanban
- Manager creates tasks with title, description, priority, deadline, assignee, and team.
- Tasks appear in Kanban columns: **To Do → In Progress → In Review → Done**.
- Status changes update the task and create an audit log entry.
- Team filtering is enforced server-side after every task fetch.

### 8.3 Comments
- Task modal loads comments with `GET /tasks/:taskId/comments`.
- User submits comments with `POST /tasks/:taskId/comments`.
- Comments stored in `Mini-jira-Comments` and indexed by `taskId`.
- Comment access relies on the same server-side task/team authorization checks.

### 8.4 Image Upload, Resize, Display, Replacement, and Delete

```
Frontend                Backend              S3 Originals        Lambda           S3 Resized
   │                       │                      │                 │                 │
   │  POST /files/upload-url│                      │                 │                 │
   │──────────────────────►│                      │                 │                 │
   │  ◄── presigned PUT URL│                      │                 │                 │
   │                       │                      │                 │                 │
   │  PUT image (direct)   │                      │                 │                 │
   │─────────────────────────────────────────────►│                 │                 │
   │                       │                      │ S3 PUT event    │                 │
   │                       │                      │────────────────►│                 │
   │                       │                      │                 │  write thumbnail│
   │                       │                      │                 │────────────────►│
   │  GET presigned URL    │                      │                 │                 │
   │──────────────────────►│                      │                 │                 │
   │  ◄── signed GET URL   │                      │                 │                 │
   │  display image        │                      │                 │                 │
```

- Thumbnail naming convention: `{name}-scaled.jpg`
- Old S3 objects are retained on image replacement (versioning).
- On task delete: current original and thumbnail are removed from S3.

### 8.5 Event-Driven Notifications

```
Manager assigns task
        │
        ▼
  NestJS Backend
  publishes SNS event
        │
        ▼
   SNS Topic
   ┌─────┴────────┐
   ▼              ▼
Email to       SQS Queue
Assignee          │
                  ▼
          Assignment Worker λ
          ├── writes ActivityLog to DynamoDB
          └── publishes TasksAssignedPerTeam metric to CloudWatch

Daily at 9:00 AM
        │
  EventBridge Schedule
        │
        ▼
  Daily Digest λ
  scans due tasks → sends digest email via SNS
```

### 8.6 Monitoring and Deployment

**CloudWatch Dashboard includes:**
- Tasks created per day
- Tasks closed per day per team
- Average time-to-close
- EC2 CPU utilization

**CloudWatch Alarm:** notifies via SNS when overdue tasks exceed threshold.

**Production Deployment:**
```
CloudFront → ALB → EC2 Auto Scaling Group (2 AZs: eu-north-1a, eu-north-1b)
                        └── NestJS backend on port 3001
CloudFront → S3 Static Website (Next.js frontend)
```

---

## 9. Security and Access Control

- **Cognito** manages user identities and tokens.
- Backend validates Cognito tokens on every protected request.
- **Role-based guards** separate Manager and Employee behavior.
- **Team isolation** is enforced server-side by checking `user.teamId` against `task.teamId`.
- **S3 buckets remain private;** the frontend uses presigned PUT URLs for upload and presigned GET URLs for display.
- **IAM roles** follow least privilege for EC2, Lambda, and application identities.
- Environment variables and secrets are stored securely using SSM Parameter Store or Secrets Manager — not in Git.

---

## 10. Deployment & Run Instructions

### Backend (EC2)
```bash
cd /home/ssm-user/app~/backend
npm run build
pm2 restart mini-jira-backend
pm2 save
```

### Verify backend health
```bash
curl http://localhost:3001/health
# Expected: {"status":"OK","timestamp":"..."}
```

### Frontend
Built and deployed as static files to the S3 bucket `mini-jira-frontend-1`, served via CloudFront.

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://d9cq3auro8woj.cloudfront.net/api
```

---

*Mini-Jira — Software Cloud Computing 2026*
