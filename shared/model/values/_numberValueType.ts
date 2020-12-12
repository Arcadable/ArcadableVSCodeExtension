import { Value, ValuePointer } from './value';
export abstract class NumberValueType extends Value {
    abstract get(): Promise<number>;
    abstract set(newValue: number): Promise<void>;
    abstract isTruthy(): Promise<boolean>;
}

export class NumberValueTypePointer<T extends NumberValueType> extends ValuePointer<T> {
    getObject(): T {
        return this.game.values[this.ID] as unknown as T;
    }
    async getValue(): Promise<number> {
        return await (this.game.values[this.ID] as unknown as T).get();
    }
}

