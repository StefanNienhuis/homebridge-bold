import {Device} from '../device';
import {BoldPlatform} from '../index';
import {PlatformAccessory} from 'homebridge';
import {DeviceConfig} from '../types';

export abstract class BaseAccessory extends Device {

    protected constructor(
        protected platform: BoldPlatform,
        protected accessory: PlatformAccessory,
        protected deviceConfig: DeviceConfig
    ) {
        super(deviceConfig, platform.bold);

        this.platform.log.info(`Configuring accessory for device '${deviceConfig.name}'`);

        let informationService = this.accessory.getService(this.platform.hap.Service.AccessoryInformation);

        if (!informationService) {
            informationService = this.accessory.addService(this.platform.hap.Service.AccessoryInformation);
        }

        informationService.getCharacteristic(this.platform.hap.Characteristic.Name)
            .onGet(() => deviceConfig.name || 'Bold Device');

        informationService.getCharacteristic(this.platform.hap.Characteristic.Manufacturer)
            .onGet(() => deviceConfig.model.make || 'Bold');

        informationService.getCharacteristic(this.platform.hap.Characteristic.Model)
            .onGet(() => deviceConfig.model.model || 'Unknown');

        informationService.getCharacteristic(this.platform.hap.Characteristic.SerialNumber)
            .onGet(() => deviceConfig.serial || 'Unknown');

        informationService.getCharacteristic(this.platform.hap.Characteristic.FirmwareRevision)
            .onGet(() => `${deviceConfig.actualFirmwareVersion || 'Unknown'}`);
    }

}