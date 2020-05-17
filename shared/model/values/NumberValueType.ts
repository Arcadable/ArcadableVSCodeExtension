import { Value, ValuePointer } from './value';
export abstract class NumberValueType extends Value {
    abstract get(executionOrder: number[]): number;
    abstract set(newValue: number, executionOrder: number[]): void;
    abstract isTruthy(executionOrder: number[]): boolean;
}

export class NumberValueTypePointer<T extends NumberValueType> extends ValuePointer<T> {
    getObject(executionOrder: number[]): T {
        return this.game.values[this.ID] as unknown as T;
    }
    getValue(executionOrder: number[]) {
        return (this.game.values[this.ID] as unknown as T).get(executionOrder);
    }
}

