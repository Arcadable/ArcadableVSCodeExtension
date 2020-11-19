import { ValueType, ValuePointer } from './value';
import { Arcadable } from '../arcadable';
import { ValueArrayValueType } from './valueArrayValueType';
import { NumberValueType } from './_numberValueType';

export class TextValue<T extends NumberValueType> extends ValueArrayValueType {


    constructor(
        ID: number,
        public values: ValuePointer<T>[],
        size: number,
        name: string,
        game: Arcadable
    ) {
        super(ID, size, ValueType.text, name, game);

    }

    async get(): Promise<ValuePointer<T>[]> {
        return this.values;
    }

    async set(newValue: ValuePointer<T>[]) {
        this.values = newValue;
    }

    async isTruthy() {
        return this.size > 0;
    }
}
