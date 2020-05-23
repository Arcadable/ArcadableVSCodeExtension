import { Arcadable } from '../arcadable';
import { SystemConfigType } from '../systemConfig';
import { NumberValueType } from './NumberValueType';
import { ValueType } from './value';

export class SystemConfigValue extends NumberValueType {

    private _CONFIG_TYPE!: number;
    set configType(value: number) {
        this._CONFIG_TYPE = value;
        this.called = true;
    }
    get configType(): number {
        return this._CONFIG_TYPE;
    }

    constructor(
        ID: number,
        configType: SystemConfigType,
        name: string,
        game: Arcadable
    ) {
        super(ID, ValueType.systemPointer, name, game);
        this.configType = configType;
    }


    get(executionOrder: number[]): number {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        return this.game.systemConfig.get(this.configType);
    }

    set(newValue: number, executionOrder: number[]) {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
    }
    isTruthy(executionOrder: number[]) {
        return this.get(executionOrder) !== 0;
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
