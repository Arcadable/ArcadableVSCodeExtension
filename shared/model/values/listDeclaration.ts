import { Value, ValuePointer, ValueType } from './value';
import { Arcadable } from '../arcadable';
import { ValueArrayValueType } from './valueArrayValueType';

export class ListDeclaration<T extends Value> extends ValueArrayValueType {


    constructor(
        ID: number,
        size: number,
        public values: ValuePointer<T>[],
        name: string,
        game: Arcadable
    ) {
        super(ID, size, ValueType.listDeclaration, name, game);
    }



    async get(): Promise<ValuePointer<T>[]> {
        return this.values;
    }

    async set(newValue: ValuePointer<T>[]) {
        this.values = newValue;
    }
    async isTruthy() {
        return true;
    }


}
