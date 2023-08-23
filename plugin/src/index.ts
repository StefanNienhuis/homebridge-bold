import {
    API,
    APIEvent,
    Categories,
    DynamicPlatformPlugin,
    HAP,
    Logger,
    PlatformAccessory,
    PlatformConfig
} from 'homebridge';
import fs from 'fs-extra';

import {BoldAPI} from './bold';
import {Config, DeviceConfig, DeviceType} from './types';
import {PLATFORM_NAME, PLUGIN_NAME} from './const';
import {LockAccessory} from './accessories/lock-accessory';
import {SwitchAccessory} from './accessories/switch-accessory';

export default (api: API): void => {
    api.registerPlatform(PLATFORM_NAME, BoldPlatform);
};

export class BoldPlatform implements DynamicPlatformPlugin {

    private accessories: PlatformAccessory[] = [];

    public hap: HAP;
    public readonly config: Config;
    public bold: BoldAPI;

    private refreshInterval?: NodeJS.Timer;

    constructor(
        public log: Logger,
        config: PlatformConfig,
        public api: API
    ) {
        this.hap = api.hap;
        this.config = config as Config;
        this.bold = new BoldAPI(this.config, this.log);
        
        api.on(APIEvent.DID_FINISH_LAUNCHING, async () => {
            await this.refreshAccessToken();
            await this.updateDevices();

            this.refreshInterval = setInterval(async () => {
                await this.refreshAccessToken();
                await this.updateDevices();
            }, 24 * 60 * 60 * 1000);
        });

        api.on(APIEvent.SHUTDOWN, () => {
            if (this.refreshInterval != null) {
                clearInterval(this.refreshInterval);
            }
        });
    }

    // Accessories

    isSwitchAccessory(device: DeviceConfig): boolean {
        return device.type.id == DeviceType.Connect && !this.config.showControllerAsLock;
    }

    configureAccessory(accessory: PlatformAccessory): void {
        let device: DeviceConfig = accessory.context.device;

        if (!device) {
            this.log.warn(`Device not found for accessory ${accessory.UUID}. Removing...`);
            this.removeAccessory(accessory);

            return;
        }

        if (accessory.context.isSwitchAccessory) {
            new SwitchAccessory(this, accessory, device);
        } else {
            new LockAccessory(this, accessory, device);
        }

        this.accessories.push(accessory);
    }

    addAccessory(device: DeviceConfig): void {
        let accessory;

        // Separate UUIDs for lock and switch in case the config option is changed when the device already exists.
        if (this.isSwitchAccessory(device)) {
            let uuid = this.hap.uuid.generate(`BoldSwitch${device.id}`);
            accessory = new this.api.platformAccessory(device.name, uuid, Categories.SWITCH);

            accessory.context.isSwitchAccessory = true;
        } else {
            let uuid = this.hap.uuid.generate(`BoldLock${device.id}`);
            accessory = new this.api.platformAccessory(device.name, uuid, Categories.DOOR_LOCK);


            accessory.context.isSwitchAccessory = false;
        }

        accessory.context.device = device;
        
        // Services & Characteristics initialized by configureAccessory()

        this.configureAccessory(accessory);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }

    removeAccessory(accessory: PlatformAccessory): void {
        let index = this.accessories.indexOf(accessory);
        delete this.accessories[index];

        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }

    // Bold API

    async updateDevices(): Promise<void> {
        let devices: DeviceConfig[];

        try {
            devices = await this.bold.getDevices();
        } catch (error) {
            if (this.accessories.length == 0) {
                this.log.error('Unable to get devices. Check your authentication details.');
            } else {
                this.log.warn('Unable to refresh devices. Preserving cached accessories, which might be incorrect. Check your authentication details.');
            }

            return;
        }

        // Add devices
        let addDevices = devices.filter((device) => !this.accessories.find((accessory) => accessory.context.device.id == device.id && accessory.context.isSwitchAccessory == this.isSwitchAccessory(device)));

        if (addDevices.length > 0) this.log.info(`Found ${addDevices.length} new device${addDevices.length != 1 ? 's' : ''} supporting remote activation.`);

        addDevices.forEach(this.addAccessory.bind(this));

        // Remove devices
        let removeAccessories = this.accessories.filter((accessory) => !devices.find((device) => accessory.context.device.id == device.id && accessory.context.isSwitchAccessory == this.isSwitchAccessory(device)));

        if (removeAccessories.length > 0) this.log.info(`Removing ${removeAccessories.length} old device${removeAccessories.length != 1 ? 's' : ''}.`);

        removeAccessories.forEach(this.removeAccessory.bind(this));

        // Update existing devices
        for (let accessory of this.accessories.filter((accessory) => devices.find((device) => accessory.context.device.id == device.id && accessory.context.isSwitchAccessory == this.isSwitchAccessory(device)))) {
            accessory.context.device = devices.find((device) => device.id == accessory.context.device.id);
            this.api.updatePlatformAccessories(this.accessories);
        }
    }

    async refreshAccessToken(): Promise<void> {
        let config;

        try {
            config = await fs.readJSON(this.api.user.configPath());
        } catch (error) {
            this.log.error(`Error while reading config for access token refresh: ${error}`);
            return;
        }

        let platformIndex = config.platforms.findIndex((platform: any) => platform.platform == PLATFORM_NAME && platform.accessToken == this.bold.config.accessToken);

        let hasWarned = false;
        if (platformIndex == -1) {
            this.log.warn("Warning while reading config for access token refresh: Couldn't find platform with current access token. Using first entry of Bold config.");
            hasWarned = true;

            platformIndex = config.platforms.findIndex((platform: any) => platform.platform == PLATFORM_NAME);
        }

        if (platformIndex == -1) {
            this.log.error("Error while reading config for access token refresh: Couldn't find entry of Bold platform. Skipping token refresh.");
            return;
        }

        let refreshedTokens = await this.bold.refresh();

        if (!refreshedTokens) {
            return;
        }

        // Reloading config in case it was updated while refreshing
        try {
            config = await fs.readJSON(this.api.user.configPath());
        } catch (error) {
            this.log.error(`Error while reading config for access token refresh: ${error}`);
            return;
        }

        platformIndex = config.platforms.findIndex((platform: any) => platform.platform == PLATFORM_NAME && platform.accessToken == this.bold.config.accessToken);
        
        if (platformIndex == -1 && !hasWarned) {
            this.log.warn("Warning while reading config for access token refresh: Couldn't find platform with current access token. Using first entry of Bold config.");
            platformIndex = config.platforms.findIndex((platform: any) => platform.platform == PLATFORM_NAME);
        }

        if (platformIndex == -1) {
            this.log.error("Error while reading config for access token refresh: Couldn't find entry of Bold platform. Skipping token refresh.");
        }
        
        config.platforms[platformIndex].accessToken = refreshedTokens.accessToken;
        config.platforms[platformIndex].refreshToken = refreshedTokens.refreshToken;
        
        await fs.writeJSON(this.api.user.configPath(), config, { spaces: 4 });

        this.bold.config = { ...this.bold.config, accessToken: refreshedTokens.accessToken, refreshToken: refreshedTokens.refreshToken };
    }

}