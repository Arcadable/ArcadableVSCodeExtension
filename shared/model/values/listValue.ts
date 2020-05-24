import { Value, ValuePointer, ValueType } from './value';
import { Arcadable } from '../arcadable';
import { ValueArrayValueType, ValueArrayValueTypePointer } from './valueArrayValueType';
import { NumberValueTypePointer, NumberValueType } from './NumberValueType';

export class ListValue<T1 extends Value, T2 = number | number[]> extends Value {

    private _LIST_VALUE!: ValueArrayValueTypePointer<T1>;
    set listValue(value: ValueArrayValueTypePointer<T1>) {
        this._LIST_VALUE = value;
        this.called = true;
    }
    get listValue(): ValueArrayValueTypePointer<T1> {
        return this._LIST_VALUE;
    }

    private _LIST_INDEX!: NumberValueTypePointer<NumberValueType>;
    set listIndex(values: NumberValueTypePointer<NumberValueType>) {
        this._LIST_INDEX = values;
        this.called = true;
    }
    get listIndex(): NumberValueTypePointer<NumberValueType> {
        return this._LIST_INDEX;
    }

    constructor(
        ID: number,
        listValue: ValueArrayValueTypePointer<T1>,
        listIndex: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, ValueType.listDeclaration, name, game);
        this.listValue = listValue;
        this.listIndex = listIndex;
    }

    get(executionOrder: number[]): T2 {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        const index = this.listIndex.getValue(executionOrder);
        const listValue = this.listValue.getValue(executionOrder)[index];
        return listValue.getValue(executionOrder);
    }

    set(newValue: T2, executionOrder: number[]) {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        const index = this.listIndex.getValue(executionOrder);
        const listValue = this.listValue.getValue(executionOrder)[index];
        return listValue.getObject(executionOrder).set(newValue, executionOrder);
    }
    isTruthy(executionOrder: number[]) {
        const index = this.listIndex.getValue(executionOrder);
        const listValue = this.listValue.getValue(executionOrder)[index];
        return listValue.getObject(executionOrder).isTruthy(executionOrder);
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            listValue: this.listValue,
            listIndex: this.listIndex,
        });
    }
}
