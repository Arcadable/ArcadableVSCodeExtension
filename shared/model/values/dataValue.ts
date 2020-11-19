import { Value, ValuePointer, ValueType } from './value';
import { Arcadable } from '../arcadable';
import { NumberArrayValueType } from './numberArrayValueType';

export class DataValue extends NumberArrayValueType {

    constructor(
        ID: number,
        public data: number[],
        name: string,
        game: Arcadable
    ) {
        super(ID, data.length, ValueType.data, name, game);
    }

    async get(): Promise<number[]> {
        return this.data;
    }

    async set(s: number[]) {
        return;
    }

    async isTruthy() {
        return true;
    }


}
