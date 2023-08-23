import { BoldPlatform } from '../';
import { DeviceConfig } from '../types';
import { BaseAccessory } from './base-accessory';
import { PlatformAccessory } from 'homebridge';

export class SwitchAccessory extends BaseAccessory {

    constructor(
        protected platform: BoldPlatform,
        protected accessory: PlatformAccessory,
        protected deviceConfig: DeviceConfig
    ) {
        super(platform, accessory, deviceConfig);

        let switchService = accessory.getService(this.platform.hap.Service.Switch);

        if (!switchService) {
            switchService = accessory.addService(this.platform.hap.Service.Switch);
        }

        let on = switchService.getCharacteristic(this.platform.hap.Characteristic.On);

        on.onGet(() => this.isActivated)
          .onSet((newState) => this.setState(newState == true));
    }

    onStateChange(activated: boolean): void {
        let service = this.accessory.getService(this.platform.hap.Service.Switch);

        service?.getCharacteristic(this.platform.hap.Characteristic.On)
                .updateValue(activated);
    }

}