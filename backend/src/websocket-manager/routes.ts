import { DeleteItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import type { APIGatewayProxyResult } from 'aws-lambda';

import { dynamoClient } from '../common/clients';
import { internalErrorResponse, respone } from '../common/respones';
import { environment } from '../common/environment';

export async function connect(connectionId: string): Promise<APIGatewayProxyResult> {
    try {
        await dynamoClient.send(new PutItemCommand({
            TableName: environment.CONNECTIONS_TABLE_NAME,
            Item: {
                ConnectionID: { S: connectionId }
            }
        }));
    } catch (error) {
        console.error(`Error while registering connection: ${error}`);

        return internalErrorResponse(`Error while registering connection: ${error}`);
    }

    return respone(200);
}

export async function disconnect(connectionId: string): Promise<APIGatewayProxyResult> {
    try {
        await dynamoClient.send(new DeleteItemCommand({
            TableName: environment.CONNECTIONS_TABLE_NAME,
            Key: {
                ConnectionID: { S: connectionId }
            }
        }));
    } catch (error) {
        console.error(`Error while deleting connection: ${error}`);

        return internalErrorResponse(`Error while deleting connection: ${error}`);
    }

    return respone(200);
}