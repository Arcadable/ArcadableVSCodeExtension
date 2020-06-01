import { Value, ValuePointer } from './value';
export abstract class NumberArrayValueType extends Value {
    abstract async get(): Promise<number[]>;
    abstract async set(newValue: number[]): Promise<void>;
    abstract async isTruthy(): Promise<boolean>;
}

export class NumberArrayValueTypePointer<T extends NumberArrayValueType> extends ValuePointer<T> {
    getObject(): T {
        return this.game.values[this.ID] as unknown as T;
    }
    async getValue(): Promise<any>{
        return (this.game.values[this.ID] as unknown as T).get();
    }
}
