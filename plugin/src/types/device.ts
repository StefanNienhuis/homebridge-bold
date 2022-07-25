export interface Device {
    id: number;
    name: string;
    serial: string;
    gateway: any; // Only checked for presence
    owner: {
        organizationId: number;
    };
    type: {
        id: number; // ID = 1 for locks
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
}