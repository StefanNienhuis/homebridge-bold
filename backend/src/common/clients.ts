import { ApiGatewayManagementApiClient } from '@aws-sdk/client-apigatewaymanagementapi';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { environment } from './environment';

export const dynamoClient = new DynamoDBClient({ region: environment.AWS_REGION, ...(environment.AWS_REGION == 'localhost' && { endpoint: 'http://localhost:8000' }) });
export const websocketClient = new ApiGatewayManagementApiClient({ region: environment.AWS_REGION, endpoint: environment.WEBSOCKET_MANAGEMENT_ENDPOINT });