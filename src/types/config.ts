import { PlatformConfig } from 'homebridge';

export interface Config extends PlatformConfig {
    authToken: string;
}