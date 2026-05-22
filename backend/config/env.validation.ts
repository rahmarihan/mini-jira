import { plainToInstance } from 'class-transformer';
import { IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsOptional()
  AWS_REGION = 'eu-north-1';

  @IsString()
  @IsOptional()
  COGNITO_USER_POOL_ID = 'eu-north-1_7kSYxgEr6';

  @IsString()
  @IsOptional()
  COGNITO_CLIENT_ID = 'mu4hog4jim74lhah2s4svbv41';

  @IsString()
  @IsOptional()
  COGNITO_ISSUER?: string;

  @IsString()
  @IsOptional()
  DYNAMODB_USERS_TABLE = 'Mini-jira-Users';

  @IsString()
  @IsOptional()
  DYNAMODB_TEAMS_TABLE = 'Mini-jira-Teams';

  @IsString()
  @IsOptional()
  DYNAMODB_TASKS_TABLE = 'Mini-jira-Tasks';

  @IsString()
  @IsOptional()
  DYNAMODB_PROJECTS_TABLE = 'Mini-jira-Projects';

  @IsString()
  @IsOptional()
  DYNAMODB_AUDIT_LOG_TABLE = 'Mini-jira-AuditLog';

  @IsString()
  @IsOptional()
  DYNAMODB_COMMENTS_TABLE = 'Mini-jira-Comments';

  @IsString()
  @IsOptional()
  DYNAMODB_ACTIVITY_LOGS_TABLE = 'ActivityLogs';

  @IsString()
  @IsOptional()
  FRONTEND_ORIGIN?: string;

  @IsString()
  @IsOptional()
  CLOUDWATCH_METRICS_ENABLED?: string;

  @IsString()
  @IsOptional()
  S3_ORIGINAL_IMAGES_BUCKET = 'mini-jira-original-images-giu';

  @IsString()
  @IsOptional()
  S3_RESIZED_IMAGES_BUCKET = 'mini-jira-resized-images-giu';

  @IsString()
  @IsOptional()
  DYNAMODB_FALLBACK_TO_MEMORY = 'true';

  @IsString()
  @IsOptional()
  TASK_ASSIGNMENT_TOPIC_ARN?: string;

  @IsString()
  @IsOptional()
  DAILY_DIGEST_TOPIC_ARN?: string;

  @IsString()
  @IsOptional()
  TASK_ASSIGNMENT_QUEUE_URL?: string;

  @IsString()
  @IsOptional()
  TASK_ASSIGNMENT_DLQ_URL?: string;

  @IsString()
  @IsOptional()
  ASSIGNMENT_WORKER_LAMBDA_ARN?: string;

  @IsString()
  @IsOptional()
  DAILY_REMINDER_LAMBDA_ARN?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return {
    ...config,
    AWS_REGION: validatedConfig.AWS_REGION,
    COGNITO_USER_POOL_ID: validatedConfig.COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: validatedConfig.COGNITO_CLIENT_ID,
    COGNITO_ISSUER:
      validatedConfig.COGNITO_ISSUER ||
      `https://cognito-idp.${validatedConfig.AWS_REGION}.amazonaws.com/${validatedConfig.COGNITO_USER_POOL_ID}`,
    DYNAMODB_USERS_TABLE: validatedConfig.DYNAMODB_USERS_TABLE,
    DYNAMODB_TEAMS_TABLE: validatedConfig.DYNAMODB_TEAMS_TABLE,
    DYNAMODB_TASKS_TABLE: validatedConfig.DYNAMODB_TASKS_TABLE,
    DYNAMODB_PROJECTS_TABLE: validatedConfig.DYNAMODB_PROJECTS_TABLE,
    DYNAMODB_AUDIT_LOG_TABLE: validatedConfig.DYNAMODB_AUDIT_LOG_TABLE,
    DYNAMODB_COMMENTS_TABLE: validatedConfig.DYNAMODB_COMMENTS_TABLE,
    S3_ORIGINAL_IMAGES_BUCKET: validatedConfig.S3_ORIGINAL_IMAGES_BUCKET,
    S3_RESIZED_IMAGES_BUCKET: validatedConfig.S3_RESIZED_IMAGES_BUCKET,
    DYNAMODB_FALLBACK_TO_MEMORY: validatedConfig.DYNAMODB_FALLBACK_TO_MEMORY,
    TASK_ASSIGNMENT_TOPIC_ARN: validatedConfig.TASK_ASSIGNMENT_TOPIC_ARN,
    DAILY_DIGEST_TOPIC_ARN: validatedConfig.DAILY_DIGEST_TOPIC_ARN,
    TASK_ASSIGNMENT_QUEUE_URL: validatedConfig.TASK_ASSIGNMENT_QUEUE_URL,
    TASK_ASSIGNMENT_DLQ_URL: validatedConfig.TASK_ASSIGNMENT_DLQ_URL,
    ASSIGNMENT_WORKER_LAMBDA_ARN: validatedConfig.ASSIGNMENT_WORKER_LAMBDA_ARN,
    DAILY_REMINDER_LAMBDA_ARN: validatedConfig.DAILY_REMINDER_LAMBDA_ARN,
  };
}
