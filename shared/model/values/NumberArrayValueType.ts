import { Value, ValuePointer } from './value';
export abstract class NumberArrayValueType extends Value {
    abstract get(executionOrder: number[]): number[];
    abstract set(newValue: number[], executionOrder: number[]): void;
    abstract isTruthy(executionOrder: number[]): boolean;
}

export class NumberArrayValueTypePointer<T extends NumberArrayValueType> extends ValuePointer<T> {
    getObject(executionOrder: number[]): T {
        return this.game.values[this.ID] as unknown as T;
    }
    getValue(executionOrder: number[]) {
        return (this.game.values[this.ID] as unknown as T).get(executionOrder);
    }
}
