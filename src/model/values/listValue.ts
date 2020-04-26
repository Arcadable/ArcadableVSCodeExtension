import { Value, ValuePointer, ValueType } from './value';
import { Arcadable } from '../arcadable';

export class ListValue<T extends Value> extends Value {

    private _CURRENT_INDEX!: number;
    set currentIndex(value: number) {
        this._CURRENT_INDEX = value;
        this.called = true;
    }
    get currentIndex(): number {
        return this._CURRENT_INDEX;
    }

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
        type: ValueType,
        page: number,
        currentIndex: number,
        size: number,
        values: ValuePointer<T>[],
        name: string,
        game: Arcadable
    ) {
        super(ID, type, page, name, game);
        this.values = values;
        this.size = size;
        this.currentIndex = currentIndex;
    }



    get(executionOrder: number[]): any {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        return this.values[this.currentIndex].getValue(executionOrder);
    }

    set(newValue: any, executionOrder: number[]) {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        this.values[this.currentIndex].getObject(executionOrder).set(newValue, executionOrder);
    }
    isTruthy(executionOrder: number[]) {
        return this.values[this.currentIndex].getObject(executionOrder).isTruthy(executionOrder);
    }

    setIndex(newIndex: number, executionOrder: number[]) {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        this.currentIndex = newIndex;
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            page: this.page,
            values: this.values,
            size: this.size,
            currentIndex: this.currentIndex
        });
    }
}
