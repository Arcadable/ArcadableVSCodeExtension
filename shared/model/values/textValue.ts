import { ValueType } from './value';
import { NumberArrayValueType } from './numberArrayValueType';
import { Arcadable } from '../arcadable';

export class TextValue extends NumberArrayValueType {

    private _VALUE!: number[];
    set value(value: number[]) {
        this._VALUE = value;
        this.called = true;
    }
    get value(): number[] {
        return this._VALUE;
    }

    private _LIST_SIZE!: number;
    set size(value: number) {
        this._LIST_SIZE = value;
        this.called = true;
    }
    get size(): number {
        return this._LIST_SIZE;
    }

    constructor(
        ID: number,
        value: number[],
        size: number,
        name: string,
        game: Arcadable
    ) {
        super(ID, ValueType.text, name, game);
        this.value = value;
        this.size = size;
    }


    get(executionOrder: number[]): number[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        return this.value;
    }

    set(newValue: number[], executionOrder: number[]) {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        this.value = newValue;
    }
    isTruthy(executionOrder: number[]) {
        return this.size > 0;
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            value: this.value,
            size: this.size
        });
    }
}
