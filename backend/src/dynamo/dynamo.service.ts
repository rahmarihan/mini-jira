// backend/src/dynamo/dynamo.service.ts
import { Injectable } from '@nestjs/common';
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
  private client: DynamoDBClient;

  constructor() {
    this.client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async putItem(tableName: string, item: Record<string, any>): Promise<void> {
    await this.client.send(
      new PutItemCommand({
        TableName: tableName,
        Item: marshall(item, { removeUndefinedValues: true }),
      }),
    );
  }

  async getItem(
    tableName: string,
    key: Record<string, any>,
  ): Promise<Record<string, any> | null> {
    const result = await this.client.send(
      new GetItemCommand({
        TableName: tableName,
        Key: marshall(key),
      }),
    );
    return result.Item ? unmarshall(result.Item) : null;
  }

  async updateItem(
    tableName: string,
    key: Record<string, any>,
    updates: Record<string, any>,
  ): Promise<Record<string, any>> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([k, v]) => {
      updateExpressions.push(`#${k} = :${k}`);
      expressionAttributeNames[`#${k}`] = k;
      expressionAttributeValues[`:${k}`] = v;
    });

    const result = await this.client.send(
      new UpdateItemCommand({
        TableName: tableName,
        Key: marshall(key),
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues, {
          removeUndefinedValues: true,
        }),
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes ? unmarshall(result.Attributes) : {};
  }

  async deleteItem(
    tableName: string,
    key: Record<string, any>,
  ): Promise<void> {
    await this.client.send(
      new DeleteItemCommand({
        TableName: tableName,
        Key: marshall(key),
      }),
    );
  }

  async queryByIndex(
    tableName: string,
    indexName: string,
    keyName: string,
    keyValue: string,
  ): Promise<Record<string, any>[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#key = :value',
        ExpressionAttributeNames: { '#key': keyName },
        ExpressionAttributeValues: marshall({ ':value': keyValue }),
      }),
    );
    return (result.Items || []).map((item) => unmarshall(item));
  }

  async scan(tableName: string): Promise<Record<string, any>[]> {
    const result = await this.client.send(
      new ScanCommand({ TableName: tableName }),
    );
    return (result.Items || []).map((item) => unmarshall(item));
  }
}