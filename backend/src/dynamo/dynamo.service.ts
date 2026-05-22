// backend/src/dynamo/dynamo.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

@Injectable()
export class DynamoService {
  private readonly client: DynamoDBClient;
  private readonly logger = new Logger(DynamoService.name);
  private readonly localTables = new Map<
    string,
    Map<string, Record<string, any>>
  >();
  private warnedAboutFallback = false;

  constructor() {
    this.client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'eu-north-1',
    });
  }

  async putItem(tableName: string, item: Record<string, any>): Promise<void> {
    try {
      await this.client.send(
        new PutItemCommand({
          TableName: tableName,
          Item: marshall(item, { removeUndefinedValues: true }),
        }),
      );
    } catch (error) {
      if (!this.shouldUseLocalFallback(error)) throw error;
      this.warnAboutLocalFallback(error);
      this.localPutItem(tableName, item);
    }
  }

  async getItem(
    tableName: string,
    key: Record<string, any>,
  ): Promise<Record<string, any> | null> {
    try {
      const result = await this.client.send(
        new GetItemCommand({
          TableName: tableName,
          Key: marshall(key),
        }),
      );
      return result.Item ? unmarshall(result.Item) : null;
    } catch (error) {
      if (!this.shouldUseLocalFallback(error)) throw error;
      this.warnAboutLocalFallback(error);
      return this.localGetItem(tableName, key);
    }
  }

  async updateItem(
    tableName: string,
    key: Record<string, any>,
    updates: Record<string, any>,
  ): Promise<Record<string, any>> {
    // Filter out undefined values before building expressions
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );

    if (Object.keys(filteredUpdates).length === 0) {
      // Nothing to update — fetch and return current item
      const current = await this.getItem(tableName, key);
      return current ?? {};
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const marshaledValues: Record<string, any> = {};

    Object.entries(filteredUpdates).forEach(([k, v]) => {
      const nameKey = `#attr_${k}`;
      const valueKey = `:val_${k}`;
      updateExpressions.push(`${nameKey} = ${valueKey}`);
      expressionAttributeNames[nameKey] = k;
      // marshall the individual value directly
      marshaledValues[valueKey] = marshall({ _: v })._;
    });

    try {
      const result = await this.client.send(
        new UpdateItemCommand({
          TableName: tableName,
          Key: marshall(key),
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: marshaledValues,
          ReturnValues: 'ALL_NEW',
        }),
      );
      return result.Attributes ? unmarshall(result.Attributes) : {};
    } catch (error) {
      if (!this.shouldUseLocalFallback(error)) throw error;
      this.warnAboutLocalFallback(error);
      return this.localUpdateItem(tableName, key, filteredUpdates);
    }
  }

  async deleteItem(tableName: string, key: Record<string, any>): Promise<void> {
    try {
      await this.client.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: marshall(key),
        }),
      );
    } catch (error) {
      if (!this.shouldUseLocalFallback(error)) throw error;
      this.warnAboutLocalFallback(error);
      this.localDeleteItem(tableName, key);
    }
  }

  async queryByIndex(
    tableName: string,
    indexName: string,
    keyName: string,
    keyValue: string,
  ): Promise<Record<string, any>[]> {
    try {
      const result = await this.client.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: indexName,
          KeyConditionExpression: '#key = :value',
          ExpressionAttributeNames: { '#key': keyName },
          ExpressionAttributeValues: {
            ':value': marshall({ _: keyValue })._,
          },
        }),
      );
      return (result.Items || []).map((item) => unmarshall(item));
    } catch (error) {
      if (!this.shouldUseLocalFallback(error)) throw error;
      this.warnAboutLocalFallback(error);
      return this.localQueryByIndex(tableName, keyName, keyValue);
    }
  }

  async scan(tableName: string): Promise<Record<string, any>[]> {
    try {
      const result = await this.client.send(
        new ScanCommand({ TableName: tableName }),
      );
      return (result.Items || []).map((item) => unmarshall(item));
    } catch (error) {
      if (!this.shouldUseLocalFallback(error)) throw error;
      this.warnAboutLocalFallback(error);
      return this.localScan(tableName);
    }
  }

  private shouldUseLocalFallback(error: unknown) {
    if (process.env.DYNAMODB_FALLBACK_TO_MEMORY === 'false') return false;
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.DYNAMODB_FALLBACK_TO_MEMORY !== 'true'
    ) {
      return false;
    }

    return (
      this.isMissingCredentialsError(error) || this.isMissingTableError(error)
    );
  }

  private isMissingCredentialsError(error: unknown) {
    const name = this.getErrorName(error);
    const message = this.getErrorMessage(error);
    return (
      name === 'CredentialsProviderError' ||
      message.includes('Could not load credentials from any providers')
    );
  }

  private isMissingTableError(error: unknown) {
    const name = this.getErrorName(error);
    const message = this.getErrorMessage(error);
    return (
      name === 'ResourceNotFoundException' ||
      message.includes('Requested resource not found')
    );
  }

  private warnAboutLocalFallback(error: unknown) {
    if (this.warnedAboutFallback) return;
    this.warnedAboutFallback = true;
    this.logger.warn(
      `Using in-memory DynamoDB fallback: ${this.getErrorMessage(error)}. Data resets when the backend restarts.`,
    );
  }

  private localPutItem(tableName: string, item: Record<string, any>) {
    this.getLocalTable(tableName).set(
      this.getLocalKeyFromItem(item),
      this.cloneItem(item),
    );
  }

  private localGetItem(tableName: string, key: Record<string, any>) {
    const item = this.getLocalTable(tableName).get(this.getLocalKey(key));
    return item ? this.cloneItem(item) : null;
  }

  private localUpdateItem(
    tableName: string,
    key: Record<string, any>,
    updates: Record<string, any>,
  ) {
    const table = this.getLocalTable(tableName);
    const localKey = this.getLocalKey(key);
    const item = {
      ...(table.get(localKey) || {}),
      ...key,
      ...updates,
    };
    table.set(localKey, this.cloneItem(item));
    return this.cloneItem(item);
  }

  private localDeleteItem(tableName: string, key: Record<string, any>) {
    this.getLocalTable(tableName).delete(this.getLocalKey(key));
  }

  private localQueryByIndex(
    tableName: string,
    keyName: string,
    keyValue: string,
  ) {
    return this.localScan(tableName).filter(
      (item) => item[keyName] === keyValue,
    );
  }

  private localScan(tableName: string) {
    return [...this.getLocalTable(tableName).values()].map((item) =>
      this.cloneItem(item),
    );
  }

  private getLocalTable(tableName: string) {
    if (!this.localTables.has(tableName)) {
      this.localTables.set(tableName, new Map<string, Record<string, any>>());
    }
    return this.localTables.get(tableName)!;
  }

  private getLocalKey(key: Record<string, any>) {
    const [keyName, keyValue] = Object.entries(key)[0] || ['id', 'unknown'];
    return `${keyName}:${String(keyValue)}`;
  }

  private getLocalKeyFromItem(item: Record<string, any>) {
    const keyName = [
      'taskId',
      'projectId',
      'logId',
      'userId',
      'teamId',
      'commentId',
      'fileId',
      'notificationId',
      'id',
    ].find((candidate) => item[candidate] !== undefined);

    if (!keyName) {
      return JSON.stringify(item);
    }

    return `${keyName}:${String(item[keyName])}`;
  }

  private cloneItem(item: Record<string, any>) {
    return { ...item };
  }

  private getErrorName(error: unknown) {
    return error instanceof Error ? error.name : '';
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
