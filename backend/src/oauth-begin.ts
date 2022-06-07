import { GoneException, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { dynamoClient, websocketClient } from './common/clients';
import { environment } from './common/environment';

import { errorResponse, internalErrorResponse, response } from './common/respones';

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    try {
        let { requestContext: { connectionId } } = event;

        if (connectionId == null) {
            console.error('Missing connectionId');
            return internalErrorResponse('Missing connectionId');
        }

        let callbackId = uuidv4();

        try {
            await dynamoClient.send(new UpdateItemCommand({
                TableName: environment.CONNECTIONS_TABLE_NAME,
                Key: {
                    ConnectionID: { S: connectionId }
                },
                UpdateExpression: 'SET OAuthCallbackID = :oauth_callback_id',
                ExpressionAttributeValues: {
                    ':oauth_callback_id': { S: callbackId }
                }
            }));
        } catch (error) {
            console.error(`Error while adding callback id: ${error}`);

            return internalErrorResponse(`Error while adding callback id: ${error}`);
        }

        let data = {
            action: 'oauthBegin',
            payload: {
                callbackId
            }
        };

        let dataString = JSON.stringify(data);
        let dataBuffer = new TextEncoder().encode(dataString);

        try {
            await websocketClient.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: dataBuffer
            }));
        } catch (error) {
            if (error instanceof GoneException) {
                try {
                    await dynamoClient.send(new DeleteItemCommand({
                        TableName: environment.CONNECTIONS_TABLE_NAME,
                        Key: {
                            CONNECTION_ID: { S: connectionId }
                        }
                    }));
                } catch (error) {
                    console.error(`Error while deleting connection after gone exception: ${error}`);
                }

                return errorResponse(410, 'Websocket closed');
            } else {
                console.error(`Error while posting to socket: ${error}`);
                return internalErrorResponse(`Error while posting to socket: ${error}`);
            }
        }

        return response(200);
    } catch (error) {
        console.error(`Unhandled exception: ${error}`);
        return internalErrorResponse(`Unhandled exception: ${error}`);
    }
};