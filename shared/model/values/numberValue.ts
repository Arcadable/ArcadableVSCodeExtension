import { NumberValueType } from './NumberValueType';
import { ValueType } from './value';
import { Arcadable } from '../arcadable';

export class NumberValue extends NumberValueType {

    private _VALUE!: number;
    set value(value: number) {
        this._VALUE = value;
        this.called = true;
    }
    get value(): number {
        return this._VALUE;
    }

    private _SIZE!: number;
    set size(value: number) {
        this._SIZE = value;
        this.called = true;
    }
    get size(): number {
        return this._SIZE;
    }


    constructor(
        ID: number,
        type: ValueType,
        page: number,
        value: number,
        size: number,
        name: string,
        game: Arcadable
    ) {
        super(ID, type, page, name, game);
        this.value = value;
        this.size = size;
    }


    get(executionOrder: number[]): number {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        return this.value;
    }

    set(newValue: number, executionOrder: number[]) {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        this.value = newValue;
    }
    isTruthy(executionOrder: number[]) {
        return this.get(executionOrder) !== 0;
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            page: this.page,
            value: this.value,
            size: this.size
        });
    }
}
