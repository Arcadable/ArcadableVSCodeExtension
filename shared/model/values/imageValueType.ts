import { Value, ValuePointer } from './value';
export abstract class ImageValueType extends Value {
    abstract get(): Promise<{data: number[], width: number, height: number, keyColor: number}>;
    abstract set(newValue: {data: number[], width: number, height: number, keyColor: number}): Promise<void>;
    abstract isTruthy(): Promise<boolean>;
}

export class ImageValueTypePointer<T extends ImageValueType> extends ValuePointer<T> {
    getObject(): T {
        return this.game.values[this.ID] as unknown as T;
    }
    async getValue(): Promise<{data: number[], width: number, height: number, keyColor: number}> {
        return await (this.game.values[this.ID] as unknown as T).get();
    }
}

