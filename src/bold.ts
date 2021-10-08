import axios, { Method } from 'axios';
import { Logger } from 'homebridge';
import { Device } from './types';

export class BoldAPI {

    constructor(
        private authToken: string,
        private log: Logger
    ) {}

    private async request(method: Method, endpoint: string) {
        return await axios({
            method: method,
            url: `https://api.sesamtechnology.com${endpoint}`,
            headers: {
                'X-Auth-Token': this.authToken,
                'Content-Type': 'application/json'
            }
        });
    }

    async getDevices(): Promise<Device[]> {
        try {
            let response = await this.request('GET', '/v1/effective-device-permissions');

            if (Array.isArray(response.data)) {
                let devices = response.data as Device[];
                
                return devices.filter((device) => device.id != null && device.name && device.gateway != null);
            } else {
                this.log.error(`Unknown reponse while getting devices: ${response.data}`);
                return [];
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.log.error(`Request error while getting devices: ${error}`);

                if (error.response?.data) {
                    this.log.error(error.response.data);
                }
            } else {
                this.log.error(`Unknown error while getting devices: ${error}`);
            }

            return [];
        }
    }

    async activate(deviceId: number): Promise<boolean> {
        this.log.debug(`Activating device with id ${deviceId}`);

        try {
            await this.request('POST', `/v1/devices/${deviceId}/remote-activation`);

            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.log.error(`Request error while activating device with id ${deviceId}: ${error}`);

                if (error.response?.data) {
                    this.log.error(error.response.data);
                }
            } else {
                this.log.error(`Unknown error while activating device with id ${deviceId}: ${error}`);
            }

            return false;
        }
    }

    async refreshToken(): Promise<string | undefined> {
        this.log.debug('Refreshing auth token');

        try {
            let response = await this.request('PUT', `/v1/authentications/${this.authToken}`);
            let data = response.data as any;

            this.authToken = data.token;

            this.log.debug('Successfully refreshed auth token');
            return data.token;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.log.error(`Request error while refreshing auth token: ${error}`);

                if (error.response?.data) {
                    this.log.error(error.response.data);
                }
            } else {
                this.log.error(`Unknown error while refreshing auth token: ${error}`);
            }
        }
    }

}