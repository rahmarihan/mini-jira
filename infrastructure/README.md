# Mini-Jira Infrastructure (M5)

## DynamoDB tables (7)

| Table | Owner | Partition key | GSIs |
|-------|-------|---------------|------|
| `Mini-jira-Users` | M1 | `userId` | `email-index` |
| `Mini-jira-Teams` | M1 | `teamId` | — |
| `Mini-jira-Tasks` | M2 | `taskId` | `teamId-index`, `assigneeId-index` |
| `Mini-jira-Projects` | M2 | `projectId` | — |
| `Mini-jira-AuditLog` | M2 | `logId` | `taskId-index` |
| `Mini-jira-Comments` | M3 | `commentId` | `taskId-index` |
| `Mini-jira-Notifications` | M4 | `notificationId` | `userId-index` |

Names match `backend/.env.example` and M1 `env.validation.ts`.

## Create tables

```bash
chmod +x backend/scripts/create-tables.sh
AWS_REGION=eu-north-1 ./backend/scripts/create-tables.sh
```

Or via wrapper:

```bash
chmod +x infrastructure/dynamodb/create-tables.sh
AWS_REGION=eu-north-1 ./infrastructure/dynamodb/create-tables.sh
```

## Delete tables (dev only)

```bash
AWS_REGION=eu-north-1 ./infrastructure/dynamodb/delete-tables.sh
```

## Local dev without AWS

Set in `backend/.env`:

```env
DYNAMODB_FALLBACK_TO_MEMORY=true
```

**Note:** M2 `tasks.service.ts` still references literal table name `Tasks` until M2 wires `DYNAMODB_TASKS_TABLE`. Use in-memory fallback for local API testing until then.
