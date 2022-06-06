import { GoneException, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { DeleteItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import axios from 'axios';
import { dynamoClient, websocketClient } from './common/clients';
import { environment } from './common/environment';

import { errorResponse, internalErrorResponse, respone } from './common/respones';

export const handler: APIGatewayProxyHandlerV2 = async (event): Promise<APIGatewayProxyResultV2> => {
    try {
        let { queryStringParameters: query } = event;

        let code = query?.code;
        let callbackId = query?.state;

        if (code == null) {
            return errorResponse(400, 'Missing code');
        }

        if (callbackId == null) {
            return errorResponse(400, 'Missing state');
        }

        let item;
        
        try {
            let result = await dynamoClient.send(new QueryCommand({
                TableName: environment.CONNECTIONS_TABLE_NAME,
                IndexName: 'OAuthCallbackID',
                KeyConditionExpression: 'OAuthCallbackID = :oauth_callback_id',
                ExpressionAttributeValues: {
                    ':oauth_callback_id': { S: callbackId }
                }
            }));

            if (result.Items == null || result.Items.length == 0) {
                return errorResponse(400, 'Unknown callbackID');
            }

            item = result.Items[0];
        } catch (error) {
            console.error(`Error while getting item: ${error}`);

            return internalErrorResponse(`Error while getting item: ${error}`);
        }

        let connectionId = item.ConnectionID.S;

        if (connectionId == null) {
            console.error('Missing connectionId on connection');

            return internalErrorResponse('Missing connectionId on connection');
        }

        let accessToken, refreshToken;

        try {
            let form = new URLSearchParams();

            form.append('grant_type', 'authorization_code');
            form.append('code', code);
            form.append('client_id', environment.BOLD_CLIENT_ID || '');
            form.append('client_secret', environment.BOLD_CLIENT_SECRET || '');
            form.append('redirect_uri', environment.BOLD_REDIRECT_URI || '');

            let authResponse = await axios.post('https://api.boldsmartlock.com/v2/oauth/token', form.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            accessToken = authResponse.data.access_token;
            refreshToken = authResponse.data.refresh_token;
        } catch (error) {
            console.error(`Error while getting access token: ${error}`);

            if (axios.isAxiosError(error)) {
                console.error(error.response?.data);

                return errorResponse(error.response?.status ?? 500, `Bold Error: ${JSON.stringify(error.response?.data ?? '"Unknown error"')}`);
            }

            return internalErrorResponse(`Error while getting access token: ${error}`);
        }

        if (!accessToken || !refreshToken) {
            console.error('Missing access or refresh token');
            return internalErrorResponse('Missing access or refresh token');
        }

        let data = {
            action: 'oauthCallback',
            payload: {
                accessToken, refreshToken
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

        return respone(200);
    } catch (error) {
        console.error(`Unhandled exception: ${error}`);
        return internalErrorResponse(`Unhandled exception: ${error}`);
    }
};