import { ValueType } from './value';
import { NumberArrayValueType } from './_numberArrayValueType';
import { Arcadable } from '../arcadable';

export class TextValue extends NumberArrayValueType {


    constructor(
        ID: number,
        public value: number[],
        public size: number,
        name: string,
        game: Arcadable
    ) {
        super(ID, ValueType.text, name, game);

    }


    async get(): Promise<number[]> {
        return this.value;
    }

    async set(newValue: number[]) {
        this.value = newValue;
    }
    async isTruthy() {
        return this.size > 0;
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            value: this.value,
            size: this.size
        });
    }
}
