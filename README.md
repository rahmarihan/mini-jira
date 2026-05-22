# Mini-Jira on AWS

Team task management application (Next.js + NestJS) deployed for high availability in **eu-north-1**.

## Live application

| Resource | Value |
|----------|--------|
| **Production URL (CloudFront)** | **https://d3sty91ryq307z.cloudfront.net** |
| **ALB** | `mini-jira-alb-74822711.eu-north-1.elb.amazonaws.com` |
| **Region** | `eu-north-1` |
| **AWS Account** | `507210367772` |

**CloudWatch dashboard:** [mini-jira-notifications-dashboard](https://eu-north-1.console.aws.amazon.com/cloudwatch/home?region=eu-north-1#dashboards/dashboard/mini-jira-notifications-dashboard)

**Auto Scaling Group:** [mini-jira-asg](https://eu-north-1.console.aws.amazon.com/ec2/home?region=eu-north-1#AutoScalingGroupDetails:id=mini-jira-asg;view=details)

---

## Architecture

```
Users → CloudFront (d3sty91ryq307z.cloudfront.net)
          → ALB (mini-jira-alb)
              → ASG mini-jira-asg (2× t2.micro, multi-AZ)
                  → NestJS API :3000
          → Cognito (auth)
          → DynamoDB (tasks, users, audit, …)
          → S3 (task images) + Lambda resizeTaskImage
          → SNS/SQS → assignment-worker-lambda, daily-reminder-lambda
```

Operations guide: [`infrastructure/RUNBOOK.md`](infrastructure/RUNBOOK.md)

---

## Repository layout

| Path | Description |
|------|-------------|
| `frontend/` | Next.js App Router UI |
| `backend/` | NestJS API |
| `infrastructure/` | User-data, SSM, CloudWatch, IAM policy templates |

---

## Local development

```bash
# Backend (port 3001 recommended — frontend defaults API to 3001)
cd backend && PORT=3001 npm run start:dev

# Frontend
cd frontend && npm run dev
# http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:3001` in `frontend/.env.local` if needed.

---

## AWS resource inventory

### Compute & networking

| Resource | Identifier |
|----------|------------|
| CloudFront distribution | `d3sty91ryq307z.cloudfront.net` |
| Application Load Balancer | `mini-jira-alb-74822711.eu-north-1.elb.amazonaws.com` |
| Auto Scaling Group | `mini-jira-asg` |
| EC2 instance | `i-0cabde365d7a06081` |
| EC2 instance | `i-0dbb8744f4376b3cb` |
| IAM instance role | `arn:aws:iam::507210367772:role/MiniJira-EC2-Role` |

### Cognito

| Resource | Value |
|----------|--------|
| User Pool ID | `eu-north-1_7kSYxgEr6` |
| App Client ID | `mu4hog4jim74lhah2s4svbv41` |

### DynamoDB tables

| Table | ARN |
|-------|-----|
| ActivityLogs | `arn:aws:dynamodb:eu-north-1:507210367772:table/ActivityLogs` |
| Mini-jira-AuditLog | `arn:aws:dynamodb:eu-north-1:507210367772:table/Mini-jira-AuditLog` |
| Mini-jira-Comments | `arn:aws:dynamodb:eu-north-1:507210367772:table/Mini-jira-Comments` |
| Mini-jira-Projects | `arn:aws:dynamodb:eu-north-1:507210367772:table/Mini-jira-Projects` |
| Mini-jira-Tasks | `arn:aws:dynamodb:eu-north-1:507210367772:table/Mini-jira-Tasks` |
| Mini-jira-Teams | `arn:aws:dynamodb:eu-north-1:507210367772:table/Mini-jira-Teams` |
| Mini-jira-Users | `arn:aws:dynamodb:eu-north-1:507210367772:table/Mini-jira-Users` |

### Lambda functions

| Function | ARN |
|----------|-----|
| assignment-worker-lambda | `arn:aws:lambda:eu-north-1:507210367772:function:assignment-worker-lambda` |
| daily-reminder-lambda | `arn:aws:lambda:eu-north-1:507210367772:function:daily-reminder-lambda` |
| resizeTaskImage | `arn:aws:lambda:eu-north-1:507210367772:function:resizeTaskImage` |

### Messaging

| Resource | ARN / URL |
|----------|-----------|
| SNS task-assignment-topic | `arn:aws:sns:eu-north-1:507210367772:task-assignment-topic` |
| SNS daily-digest-topic | `arn:aws:sns:eu-north-1:507210367772:daily-digest-topic` |
| SQS task-assignment-queue | `https://sqs.eu-north-1.amazonaws.com/507210367772/task-assignment-queue` |
| SQS task-assignment-dlq | `https://sqs.eu-north-1.amazonaws.com/507210367772/task-assignment-dlq` |

---

## Production configuration

### SSM Parameter Store

Sync template values to `/mini-jira/prod/*`:

```bash
chmod +x infrastructure/ssm/sync-parameters.sh
./infrastructure/ssm/sync-parameters.sh
```

Template: [`infrastructure/ssm/parameters.example.env`](infrastructure/ssm/parameters.example.env)

### EC2 bootstrap

Launch template **user data:** [`infrastructure/ec2/user-data.sh`](infrastructure/ec2/user-data.sh)  
IAM policy for instances: [`infrastructure/iam/ec2-instance-policy.json`](infrastructure/iam/ec2-instance-policy.json)

### Frontend (production build)

```env
NEXT_PUBLIC_API_URL=https://d3sty91ryq307z.cloudfront.net
```

Use the same origin if CloudFront routes API traffic to the ALB; otherwise set the ALB/API path your distribution uses.

### Monitoring

```bash
chmod +x infrastructure/cloudwatch/deploy-monitoring.sh infrastructure/scripts/verify-infrastructure.sh
./infrastructure/cloudwatch/deploy-monitoring.sh
./infrastructure/scripts/verify-infrastructure.sh
```

- **Dashboard:** tasks/day, tasks closed by team, avg time-to-close, EC2 CPU, SNS, overdue tasks  
- **Alarm:** `mini-jira-overdue-tasks-high` → `daily-digest-topic` when overdue count > 10  

Publish custom metrics to namespace `MiniJira/Tasks` from the API or `daily-reminder-lambda` (see RUNBOOK).

---

## Verify deployment checklist

- [ ] 2× `t2.micro` instances **running** in different AZs  
- [ ] ASG health check = **ELB**, targets **healthy**  
- [ ] ALB HTTPS listener + target group on port **3000**  
- [ ] CloudFront origin = ALB, API/cache behaviors correct  
- [ ] User-data completes (`/var/log/mini-jira-user-data.log`)  
- [ ] SSM parameters present under `/mini-jira/prod/`  
- [ ] CloudWatch dashboard + overdue alarm active  
- [ ] SNS subscription confirmed for alarm notifications  

---

## Team

| Area | Owner |
|------|--------|
| Auth (Cognito) | M1 |
| Kanban / tasks | M2 |
| Projects API | M3 |
| Audit / activity | M4 |
| Dashboard UI / layout | M5 |
| AWS HA / CDN / monitoring | Infrastructure |

## License

Private / academic use — see course requirements.
