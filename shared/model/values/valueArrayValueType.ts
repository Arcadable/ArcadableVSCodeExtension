import { Value, ValuePointer } from './value';
export abstract class ValueArrayValueType extends Value {
    abstract get(executionOrder: number[]): ValuePointer<Value>[];
    abstract set(newValue: ValuePointer<Value>[], executionOrder: number[]): void;
    abstract isTruthy(executionOrder: number[]): boolean;
}

export class ValueArrayValueTypePointer<T extends ValueArrayValueType> extends ValuePointer<T> {
    getObject(executionOrder: number[]): T {
        return this.game.values[this.ID] as unknown as T;
    }
    getValue(executionOrder: number[]) {
        return (this.game.values[this.ID] as unknown as T).get(executionOrder);
    }
}
