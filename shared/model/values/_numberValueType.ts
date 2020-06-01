import { Value, ValuePointer } from './value';
export abstract class NumberValueType extends Value {
    abstract async get(): Promise<number>;
    abstract async set(newValue: number): Promise<void>;
    abstract async isTruthy(): Promise<boolean>;
}

export class NumberValueTypePointer<T extends NumberValueType> extends ValuePointer<T> {
    getObject(): T {
        return this.game.values[this.ID] as unknown as T;
    }
    async getValue(): Promise<any> {
        return await (this.game.values[this.ID] as unknown as T).get();
    }
}

