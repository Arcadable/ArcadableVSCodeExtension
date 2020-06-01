import { Value, ValuePointer, ValueType } from './value';
import { Arcadable } from '../arcadable';
export abstract class ValueArrayValueType extends Value {
    constructor(
        ID: number,
        public size: number,
        type: ValueType,
        name: string,
        game: Arcadable
    ) {
        super(ID, type, name, game);
    }
    abstract async get(): Promise<ValuePointer<Value>[]>;
    abstract async set(newValue: ValuePointer<Value>[]): Promise<void>;
    abstract async isTruthy(): Promise<boolean>;
}

export class ValueArrayValueTypePointer<T extends ValueArrayValueType> extends ValuePointer<T> {
    getObject(): T {
        return this.game.values[this.ID] as unknown as T;
    }
    async getValue(): Promise<ValuePointer<Value>[]> {
        return await (this.game.values[this.ID] as unknown as T).get();
    }
}
