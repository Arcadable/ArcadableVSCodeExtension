import { NumberValueType } from './NumberValueType';
import { ValueType } from './value';
import { Arcadable } from '../arcadable';

export class AnalogInputValue extends NumberValueType {

    private _INDEX!: number;
    set index(value: number) {
        this._INDEX = value;
        this.called = true;
    }
    get index(): number {
        return this._INDEX;
    }

    constructor(
        ID: number,
        type: ValueType,
        page: number,
        index: number,
        name: string,
        game: Arcadable
      ) {
          super(ID, type, page, name, game);
          this.index = index;
      }

    get(executionOrder: number[]): number {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        return this.game.systemConfig.analogInputValues[this.index];
    }

    set(newValue: number, executionOrder: number[]) {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
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
            index: this.index,
        });
    }
}
