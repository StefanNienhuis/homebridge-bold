import type { APIGatewayProxyHandler } from 'aws-lambda';

import { connect, disconnect } from './routes';
import { internalErrorResponse, NOT_FOUND } from '../common/respones';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        let { requestContext: { connectionId, routeKey } } = event;

        if (connectionId == null) {
            console.error('Missing connectionId');
            return internalErrorResponse('Missing connectionId');
        }

        switch (routeKey) {
        case '$connect': return connect(connectionId);
        case '$disconnect': return disconnect(connectionId);
        default: console.warn(`Unknown route: ${routeKey}`); return NOT_FOUND;
        }
    } catch (error) {
        console.error(`Unhandled exception: ${error}`);
        return internalErrorResponse(`Unhandled exception: ${error}`);
    }
};