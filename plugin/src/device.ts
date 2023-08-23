import { BoldAPI } from './bold';
import {DeviceConfig} from './types';

/// Class representing an activatable Bold device.
/// This class is used by each accessory to interact with the Bold API.
export abstract class Device {

    // Getters

    /// Whether the device is currently activated
    get isActivated(): boolean {
        return this.activatedUntil > new Date();
    }

    // Private properties

    private activatedUntil: Date;

    constructor(
        private readonly config: DeviceConfig,
        private readonly bold: BoldAPI
    ) {
        // Initialize with current Date, making it not activated.
        this.activatedUntil = new Date();
    }

    // Methods

    async setState(activate: boolean): Promise<void> {
        if (activate) {
            if (await this.bold.activate(this.config.id)) {
                // Store activation end date
                let date = new Date();

                date.setSeconds(date.getSeconds() + this.config.settings.activationTime);

                this.activatedUntil = date;

                // Call state change handler
                this.onStateChange(true);

                // Deactivate after activation time
                setTimeout(() => {
                    this.setState(false);
                }, this.config.settings.activationTime * 1000);
            } else {
                // If failed to activate, set device state to deactivated.
                await this.setState(false);
            }
        } else {
            // Set activation end date to now
            this.activatedUntil = new Date();

            // Call state change handler
            this.onStateChange(false);
        }
    }

    abstract onStateChange(activated: boolean): void;

}