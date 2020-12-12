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
    abstract get(): Promise<number[]>;
    abstract set(newValue: number[]): Promise<void>;
    abstract isTruthy(): Promise<boolean>;
}

export class NumberArrayValueTypePointer<T extends NumberArrayValueType> extends ValuePointer<T> {
    getObject(): T {
        return this.game.values[this.ID] as unknown as T;
    }
    async getValue(): Promise<number[]> {
        return await (this.game.values[this.ID] as unknown as T).get();
    }
}
