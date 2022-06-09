import { API, APIEvent, CharacteristicValue, DynamicPlatformPlugin, HAP, Logger, PlatformAccessory, PlatformConfig, Categories, HapStatusError, Nullable } from 'homebridge';
import fs from 'fs-extra';

import { BoldAPI } from './bold';
import { Device, Config } from './types';
import { PLUGIN_NAME, PLATFORM_NAME } from './const';

export default (api: API): void => {
    api.registerPlatform(PLATFORM_NAME, BoldPlatform);
};

class BoldPlatform implements DynamicPlatformPlugin {

    private accessories: PlatformAccessory[] = [];

    private hap: HAP;
    // private config: Config;
    private bold: BoldAPI;

    private refreshInterval?: NodeJS.Timer;

    private unlockedLocks: Map<number, Date> = new Map();

    constructor(
        private log: Logger,
        config: PlatformConfig,
        private api: API
    ) {
        this.hap = api.hap;
        this.bold = new BoldAPI(config as Config, this.log);
        
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

    configureAccessory(accessory: PlatformAccessory) {
        let device: Device = accessory.context.device;

        if (!device) {
            this.log.warn(`Device not found for accessory ${accessory.UUID}. Removing...`);
            this.removeAccessory(accessory);

            return;
        }

        this.log.info(`Configuring accessory with device name '${device.name}'`);

        let lockService = accessory.getService(this.hap.Service.LockMechanism);

        if (!lockService) {
            lockService = accessory.addService(this.hap.Service.LockMechanism);
        }

        let currentState = lockService.getCharacteristic(this.hap.Characteristic.LockCurrentState);
        let targetState = lockService.getCharacteristic(this.hap.Characteristic.LockTargetState);

        currentState.onGet(this.getLockState.bind(this, device));
        targetState.onGet(this.getLockState.bind(this, device))
                   .onSet(this.setLockState.bind(this, device));

        let informationService = accessory.getService(this.hap.Service.AccessoryInformation);

        if (!informationService) {
            informationService = accessory.addService(this.hap.Service.AccessoryInformation);
        }

        informationService.getCharacteristic(this.hap.Characteristic.Name)
                          .onGet(() => device.name || 'Bold Lock');

        informationService.getCharacteristic(this.hap.Characteristic.Manufacturer)
                          .onGet(() => device.model.make || 'Bold');

        informationService.getCharacteristic(this.hap.Characteristic.Model)
                          .onGet(() => device.model.model || 'Lock');

        informationService.getCharacteristic(this.hap.Characteristic.SerialNumber)
                          .onGet(() => device.serial || 'Unknown');

        informationService.getCharacteristic(this.hap.Characteristic.FirmwareRevision)
                          .onGet(() => `${device.actualFirmwareVersion || 'Unknown'}`);

        this.accessories.push(accessory);
    }

    addAccessory(device: Device): void {
        let uuid = this.hap.uuid.generate(`BoldLock${device.id}`);
        let accessory = new this.api.platformAccessory(device.name, uuid, Categories.DOOR_LOCK);

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

    // States

    getLockState(device: Device) {
        if (!this.unlockedLocks.has(device.id)) {
            return 1;
        } else if ((this.unlockedLocks.get(device.id) || new Date()) >= new Date()) {
            return 0;
        } else {
            this.unlockedLocks.delete(device.id);
            return 1;
        }
    }

    async setLockState(device: Device, value: CharacteristicValue) {
        if (value == 0) {
            if (await this.bold.activate(device.id)) {
                this.updateLockState(device, 0);

                let lockDate = new Date();

                lockDate.setSeconds(lockDate.getSeconds() + device.settings.activationTime);

                this.unlockedLocks.set(device.id, lockDate);

                setTimeout(() => {
                    this.updateLockState(device, 1);
                }, device.settings.activationTime * 1000);
            } else {
                this.updateLockState(device, 1);
            }
        } else if (value == 1) {
            this.updateLockState(device, 1);
        }
    }

    updateLockState(device: Device, value: HapStatusError | Error | Nullable<CharacteristicValue>) {
        let accessory = this.accessories.find((accessory) => accessory.context.device.id == device.id);
        let service = accessory?.getService(this.hap.Service.LockMechanism);

        service?.getCharacteristic(this.hap.Characteristic.LockCurrentState)
                .updateValue(value);

        service?.getCharacteristic(this.hap.Characteristic.LockTargetState)
                .updateValue(value);
    }

    // Bold API

    async updateDevices() {
        let devices = await this.bold.getDevices();

        // Add devices
        let addDevices = devices.filter((device) => !this.accessories.find((accessory) => accessory.context.device.id == device.id));

        if (addDevices.length > 0) this.log.info(`Found ${addDevices.length} new device${addDevices.length != 1 ? 's' : ''} supporting remote activation.`);

        addDevices.forEach(this.addAccessory.bind(this));

        // Remove devices
        let removeAccessories = this.accessories.filter((accessory) => !devices.find((device) => accessory.context.device.id == device.id));

        if (removeAccessories.length > 0) this.log.info(`Removing ${removeAccessories.length} old device${removeAccessories.length != 1 ? 's' : ''}.`);

        removeAccessories.forEach(this.removeAccessory.bind(this));

        // Update existing devices
        for (let accessory of this.accessories.filter((accessory) => devices.find((device) => accessory.context.device.id == device.id))) {
            accessory.context.device = devices.find((device) => device.id == accessory.context.device.id);
            this.api.updatePlatformAccessories(this.accessories);
        }
    }

    async refreshAccessToken() {
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
        
        if (platformIndex == -1 && hasWarned == false) {
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