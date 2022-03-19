export interface Device {
    id: number;
    name: string;
    serial: string;
    gateway: any; // Only checked for presence
    type: {
        id: number; // ID = 1 for locks
    }
    settings: {
        activationTime: number;
    };
    model: {
        make: string;
        model: string;
    };
    actualFirmwareVersion: number;
}