/**
 * Seeds Cognito + DynamoDB demo users and optional demo tasks (Ali, Sara, Omar).
 * Run: npm run seed:demo (from backend/, requires .env AWS credentials)
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

dotenv.config({ path: path.join(__dirname, '../.env') });

const region = process.env.AWS_REGION || 'eu-north-1';
const userPoolId = process.env.COGNITO_USER_POOL_ID || 'eu-north-1_7kSYxgEr6';
const usersTable = process.env.DYNAMODB_USERS_TABLE || 'Mini-jira-Users';
const tasksTable = process.env.DYNAMODB_TASKS_TABLE || 'Mini-jira-Tasks';
const demoPassword = process.env.DEMO_USER_PASSWORD || 'DemoPass123!';

const DEMO_USERS = [
  {
    cognitoUsername: 'mini-jira-ali',
    name: 'Ali',
    email: 'ali@demo.com',
    role: 'Manager' as const,
    teamId: 'ALL' as const,
  },
  {
    cognitoUsername: 'mini-jira-sara',
    name: 'Sara',
    email: 'sara@demo.com',
    role: 'Employee' as const,
    teamId: 'Frontend' as const,
  },
  {
    cognitoUsername: 'mini-jira-omar',
    name: 'Omar',
    email: 'omar@demo.com',
    role: 'Employee' as const,
    teamId: 'Backend' as const,
  },
];

const cognito = new CognitoIdentityProviderClient({ region });
const dynamo = new DynamoDBClient({ region });

async function findCognitoUsernameByEmail(email: string): Promise<string | null> {
  const result = await cognito.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: `email = "${email}"`,
      Limit: 1,
    }),
  );
  return result.Users?.[0]?.Username ?? null;
}

async function getUserSub(cognitoUsername: string): Promise<string> {
  const result = await cognito.send(
    new AdminGetUserCommand({ UserPoolId: userPoolId, Username: cognitoUsername }),
  );
  const sub = result.UserAttributes?.find((a) => a.Name === 'sub')?.Value;
  if (!sub) throw new Error(`No sub for ${cognitoUsername}`);
  return sub;
}

async function upsertCognitoUser(user: (typeof DEMO_USERS)[0]) {
  let username =
    (await findCognitoUsernameByEmail(user.email)) ?? user.cognitoUsername;

  const existing = await findCognitoUsernameByEmail(user.email);
  if (existing) {
    username = existing;
    console.log(`Found existing Cognito user: ${user.email} (${username})`);
  } else {
    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: user.cognitoUsername,
        MessageAction: 'SUPPRESS',
        UserAttributes: [
          { Name: 'email', Value: user.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: user.name },
          { Name: 'custom:role', Value: user.role },
          { Name: 'custom:teamId', Value: user.teamId },
        ],
      }),
    );
    username = user.cognitoUsername;
    console.log(`Created Cognito user: ${user.email} (${username})`);
  }

  await cognito.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: [
        { Name: 'name', Value: user.name },
        { Name: 'custom:role', Value: user.role },
        { Name: 'custom:teamId', Value: user.teamId },
      ],
    }),
  );

  await cognito.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: demoPassword,
      Permanent: true,
    }),
  );

  const sub = await getUserSub(username);
  await dynamo.send(
    new PutItemCommand({
      TableName: usersTable,
      Item: marshall({
        userId: sub,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId,
      }),
    }),
  );
  console.log(`DynamoDB user: ${user.email} (${user.role}, ${user.teamId}) sub=${sub}`);
  return { ...user, sub } as SeededUser;
}

async function seedDemoTasks(ali: { sub: string; name: string }, sara: { sub: string; name: string }, omar: { sub: string; name: string }) {
  const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const tasks = [
    {
      taskId: 'demo-task-a-frontend',
      title: 'Task A — Frontend onboarding',
      description: 'Demo task assigned to Sara on the Frontend team.',
      status: 'TODO',
      priority: 'MEDIUM',
      deadline,
      assigneeId: sara.sub,
      assigneeName: sara.name,
      teamId: 'Frontend',
      createdBy: ali.sub,
      createdByName: ali.name,
      createdAt: now,
      updatedAt: now,
    },
    {
      taskId: 'demo-task-b-backend',
      title: 'Task B — Backend API hardening',
      description: 'Demo task assigned to Omar on the Backend team.',
      status: 'TODO',
      priority: 'HIGH',
      deadline,
      assigneeId: omar.sub,
      assigneeName: omar.name,
      teamId: 'Backend',
      createdBy: ali.sub,
      createdByName: ali.name,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const task of tasks) {
    await dynamo.send(
      new PutItemCommand({
        TableName: tasksTable,
        Item: marshall(task, { removeUndefinedValues: true }),
      }),
    );
    console.log(`Task seeded: ${task.title} (${task.teamId})`);
  }
}

type SeededUser = (typeof DEMO_USERS)[number] & { sub: string };

async function main() {
  console.log('Seeding Mini-Jira demo users...\n');
  const seeded: SeededUser[] = [];
  for (const u of DEMO_USERS) {
    seeded.push(await upsertCognitoUser(u));
  }

  const ali = seeded.find((u) => u.email === 'ali@demo.com')!;
  const sara = seeded.find((u) => u.email === 'sara@demo.com')!;
  const omar = seeded.find((u) => u.email === 'omar@demo.com')!;

  await seedDemoTasks(ali, sara, omar);

  console.log('\n--- Demo logins (password for all):', demoPassword, '---');
  for (const u of seeded) {
    console.log(`  ${u.name}: ${u.email} | ${u.role} | teamId=${u.teamId}`);
  }
  console.log('\nDemo scenario:');
  console.log('  Sara → sees Task A only | Omar → Task B only | Ali → both + team filter');

  writeFrontendAssigneeConfig(sara, omar);
}

function writeFrontendAssigneeConfig(
  sara: { sub: string; name: string },
  omar: { sub: string; name: string },
) {
  const outPath = path.join(
    __dirname,
    '../../frontend/src/config/demo-users.ts',
  );
  const content = `/** Auto-generated by npm run seed:demo — do not edit assigneeId by hand. */
export const DEMO_TEAM_OPTIONS = [
  { teamId: '', label: 'All Teams' },
  { teamId: 'Frontend', label: 'Frontend' },
  { teamId: 'Backend', label: 'Backend' },
] as const;

export const DEMO_ASSIGNEE_PRESETS = [
  {
    key: 'sara-frontend',
    label: 'Sara — Frontend',
    assigneeName: 'Sara',
    assigneeId: '${sara.sub}',
    teamId: 'Frontend',
  },
  {
    key: 'omar-backend',
    label: 'Omar — Backend',
    assigneeName: 'Omar',
    assigneeId: '${omar.sub}',
    teamId: 'Backend',
  },
] as const;
`;
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`\nWrote assignee subs → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
