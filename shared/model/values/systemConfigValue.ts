import { Arcadable } from '../arcadable';
import { SystemConfigType } from '../systemConfig';
import { NumberValueType } from './_numberValueType';
import { ValueType } from './value';

export class SystemConfigValue extends NumberValueType {


    constructor(
        ID: number,
        public configType: SystemConfigType,
        name: string,
        game: Arcadable
    ) {
        super(ID, ValueType.systemPointer, name, game);
    }


    async get(): Promise<number> {
        return this.game.systemConfig.get(this.configType);
    }

    async set(newValue: number) {
    }
    async isTruthy() {
        return (await this.get()) !== 0;
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            configType: this.configType
        });
    }
}
