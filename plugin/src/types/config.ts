import { PlatformConfig } from 'homebridge';

export interface Config extends PlatformConfig {
    accessToken: string;
    refreshToken: string;
}