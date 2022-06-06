import { APIGatewayProxyResult } from 'aws-lambda';

export function respone(statusCode: number, data?: Record<string, unknown>): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify({
            success: true,
            data
        }) : ''
    };
}

export function errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
    return {
        statusCode,
        body: JSON.stringify({
            success: false,
            error: {
                code: statusCode,
                message: message
            }
        })
    };
}

export function internalErrorResponse(debugMessage: string): APIGatewayProxyResult {
    return {
        statusCode: 500,
        body: JSON.stringify({
            success: false,
            error: {
                code: 500,
                message: 'Internal Server Error',
                debugMessage
            }
        })
    };
}

export const NOT_FOUND: APIGatewayProxyResult = {
    statusCode: 404,
    body: JSON.stringify({
        success: false,
        error: {
            code: 404,
            message: 'Not found'
        }
    })
};