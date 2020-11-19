import { Value, ValuePointer, ValueType } from './value';
import { Arcadable } from '../arcadable';
export abstract class NumberArrayValueType extends Value {
    constructor(
        ID: number,
        public size: number,
        type: ValueType,
        name: string,
        game: Arcadable
    ) {
        super(ID, type, name, game);
    }
    abstract async get(): Promise<number[]>;
    abstract async set(newValue: number[]): Promise<void>;
    abstract async isTruthy(): Promise<boolean>;
}

export class NumberArrayValueTypePointer<T extends NumberArrayValueType> extends ValuePointer<T> {
    getObject(): T {
        return this.game.values[this.ID] as unknown as T;
    }
    async getValue(): Promise<number[]> {
        return await (this.game.values[this.ID] as unknown as T).get();
    }
}
