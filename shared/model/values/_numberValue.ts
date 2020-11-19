import { NumberValueType } from './_numberValueType';
import { ValueType } from './value';
import { Arcadable } from '../arcadable';

export class NumberValue extends NumberValueType {


    constructor(
        ID: number,
        public value: number,
        public size: number,
        name: string,
        game: Arcadable
    ) {
        super(ID, ValueType.number, name, game);
    }


    async get(): Promise<number> {
        return this.value;
    }

    async set(newValue: number) {
        this.value = newValue;
    }
    async isTruthy() {
        return (await this.get()) !== 0;
    }

}
