export interface Device {
    id: number;
    name: string;
    serial: string;
    gateway: any; // Only checked for presence
    settings: {
        activationTime: number;
    };
    model: {
        make: string;
        model: string;
    };
    actualFirmwareVersion: number;
}