export enum DeviceType {
    Lock = 1,
    Connect = 2
}

export interface DeviceConfig {
    id: number;
    name: string;
    serial: string;
    gateway: any; // Only checked for presence
    owner: {
        organizationId: number;
    };
    type: {
        id: DeviceType
    };
    settings: {
        activationTime: number;
    };
    model: {
        id: number;
        make: string;
        model: string;
    };
    actualFirmwareVersion: number;
    featureSet: {
        isActivatable: boolean;
    }
}