import axios, { AxiosError, Method } from 'axios';
import FormData from 'form-data';
import { Logger } from 'homebridge';
import { Device } from './types';

interface APISuccess<Data> {
    success: true;
    data: Data;
}

interface APIError {
    success: false;
    error: {
        code?: string | number;
        message: string;
    }
}

type APIResponse<Data> = APISuccess<Data> | APIError;

export class BoldAPI {

    constructor(
        private accessToken: string,
        private refreshToken: string,
        private log: Logger
    ) {}

    private async request(method: Method, endpoint: string, body: unknown | undefined = undefined, headers: Record<string, unknown> | undefined = undefined): Promise<APIResponse<any>> {
        try {
            let response = await axios.request<any>({
                method: method,
                url: `https://api.sesamtechnology.com${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    ...(!Object.keys(headers || {}).some((header) => header.toLowerCase() == 'content-type') && { 'Content-Type': 'application/json' }),
                    ...headers
                },
                data: body
            });

            if ((response.data.errorCode != null && response.data.errorCode != 'OK') && (response.data.errorMessage != null && response.data.errorMessage != 'OK')) {
                return {
                    success: false,
                    error: {
                        code: response.data.errorCode,
                        message: response.data.errorMessage
                    }
                };
            }

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                let axiosError = error as AxiosError<any>;

                return {
                    success: false,
                    error: {
                        code: axiosError.response?.data.errorCode || axiosError.response?.status || axiosError.code,
                        message: axiosError.response?.data.errorMessage || `${axiosError}`
                    }
                };
            } else {
                return {
                    success: false,
                    error: {
                        message: `${error}`
                    }
                };
            }
        }
    }

    async getDevices(): Promise<Device[]> {
        this.log.debug('Getting all devices');

        let response = await this.request('GET', '/v1/effective-device-permissions');

        if (!response.success) {
            this.log.error(`Error ${response.error.code ? `(${response.error.code}) ` : ''}while getting devices: ${response.error.message}`);

            return [];
        }

        if (Array.isArray(response.data)) {
            let devices = response.data as Device[];
            let supportedDevices = devices.filter((device) => device.id != null && device.name && device.type.id == 1 && device.gateway != null);

            this.log.debug(`Total device count: ${devices.length}, Supported device count: ${supportedDevices.length}`);
            
            return supportedDevices;
        } else {
            this.log.error(`Unknown reponse while getting devices: ${response.data}`);
            return [];
        }
    }

    async activate(deviceId: number): Promise<boolean> {
        this.log.debug(`Activating device (${deviceId})`);

        let response = await this.request('POST', `/v1/devices/${deviceId}/remote-activation`);

        if (!response.success) {
            this.log.error(`Error ${response.error.code ? `(${response.error.code}) ` : ''}while activating device (${deviceId}): ${response.error.message}`);

            return false;
        }

        this.log.debug(`Successfully activated device (${deviceId})`);
        return true;
    }

    async refresh(): Promise<{ accessToken: string, refreshToken: string } | undefined> {
        this.log.debug('Refreshing access token');

        let formData = new FormData();

        formData.append('client_id', 'BoldApp');
        formData.append('client_secret', 'pgJFgnGB87f9ednFiiHygCbf');
        formData.append('refresh_token', this.refreshToken);
        formData.append('grant_type', 'refresh_token');
        
        let response = await this.request('POST', '/v2/oauth/token', formData, formData.getHeaders());

        if (!response.success) {
            this.log.error(`Error ${response.error.code ? `(${response.error.code}) ` : ''}while refreshing token: ${response.error.message}`);

            return; 
        }

        let data = response.data as any;

        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;

        this.log.debug('Successfully refreshed access token');
        return { accessToken: this.accessToken, refreshToken: this.refreshToken };
    }

}