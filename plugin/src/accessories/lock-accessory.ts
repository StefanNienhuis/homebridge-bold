import { BoldPlatform } from '../';
import { PlatformAccessory } from 'homebridge';
import { DeviceConfig } from '../types';
import { BaseAccessory } from './base-accessory';

enum LockState {
    Unlocked = 0,
    Locked = 1
}

export class LockAccessory extends BaseAccessory {

    constructor(
        protected platform: BoldPlatform,
        protected accessory: PlatformAccessory,
        protected deviceConfig: DeviceConfig
    ) {
        super(platform, accessory, deviceConfig);

        let lockService = accessory.getService(this.platform.hap.Service.LockMechanism);

        if (!lockService) {
            lockService = accessory.addService(this.platform.hap.Service.LockMechanism);
        }

        let currentState = lockService.getCharacteristic(this.platform.hap.Characteristic.LockCurrentState);
        let targetState = lockService.getCharacteristic(this.platform.hap.Characteristic.LockTargetState);

        currentState.onGet(() => this.isActivated ? LockState.Unlocked : LockState.Locked);

        targetState.onGet(() => this.isActivated ? LockState.Unlocked : LockState.Locked)
                   .onSet((newState) => this.setState(newState == LockState.Unlocked));
    }

    onStateChange(activated: boolean): void {
        let service = this.accessory.getService(this.platform.hap.Service.LockMechanism);

        service?.getCharacteristic(this.platform.hap.Characteristic.LockCurrentState)
                .updateValue(activated ? LockState.Unlocked : LockState.Locked);

        service?.getCharacteristic(this.platform.hap.Characteristic.LockTargetState)
                .updateValue(activated ? LockState.Unlocked : LockState.Locked);
    }

}