import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import axios from 'axios';
import { environment } from './common/environment';

import { errorResponse, internalErrorResponse, response } from './common/respones';

export const handler: APIGatewayProxyHandlerV2 = async (event): Promise<APIGatewayProxyResultV2> => {
    try {
        let { body: bodyString } = event;

        let { refreshToken } = JSON.parse(bodyString || '{}');

        if (refreshToken == null) {
            return errorResponse(400, 'Missing refresh token');
        }

        let accessToken, newRefreshToken;

        try {
            let form = new URLSearchParams();

            form.append('grant_type', 'refresh_token');
            form.append('refresh_token', refreshToken);
            form.append('client_id', environment.BOLD_CLIENT_ID || '');
            form.append('client_secret', environment.BOLD_CLIENT_SECRET || '');

            let authResponse = await axios.post('https://api.boldsmartlock.com/v2/oauth/token', form.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            accessToken = authResponse.data.access_token;
            newRefreshToken = authResponse.data.refresh_token;
        } catch (error) {
            console.error(`Error while refreshing access token: ${error}`);

            if (axios.isAxiosError(error)) {
                console.error(error.response?.data);

                return errorResponse(error.response?.status ?? 500, `Bold Error: ${JSON.stringify(error.response?.data ?? '"Unknown error"')}`);
            }

            return internalErrorResponse(`Error while refreshing access token: ${error}`);
        }

        if (!accessToken || !newRefreshToken) {
            console.error('Missing access or new refresh token');
            return internalErrorResponse('Missing access or new refresh token');
        }

        return response(200, { accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        console.error(`Unhandled exception: ${error}`);
        return internalErrorResponse(`Unhandled exception: ${error}`);
    }
};