import { Value, ValuePointer, ValueType } from './value';
import { Arcadable } from '../arcadable';
import { ValueArrayValueType } from './valueArrayValueType';

export class ListDeclaration<T extends Value> extends ValueArrayValueType {

    private _SIZE!: number;
    set size(value: number) {
        this._SIZE = value;
        this.called = true;
    }
    get size(): number {
        return this._SIZE;
    }

    private _VALUES!: ValuePointer<T>[];
    set values(values: ValuePointer<T>[]) {
        this._VALUES = values;
        this.called = true;
    }
    get values(): ValuePointer<T>[] {
        return this._VALUES;
    }

    constructor(
        ID: number,
        size: number,
        values: ValuePointer<T>[],
        name: string,
        game: Arcadable
    ) {
        super(ID, ValueType.listDeclaration, name, game);
        this.values = values;
        this.size = size;
    }



    get(executionOrder: number[]): ValuePointer<T>[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        return this.values;
    }

    set(newValue: ValuePointer<T>[], executionOrder: number[]) {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        this.values = newValue;
    }
    isTruthy(executionOrder: number[]) {
        return true;
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            values: this.values,
            size: this.size,
        });
    }
}
