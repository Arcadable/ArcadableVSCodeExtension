import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from './NumberValueType';
import { ValueType } from './value';

export class PixelValue extends NumberValueType {

    private _X_CALC!: NumberValueTypePointer<NumberValueType>;
    set XCalc(value: NumberValueTypePointer<NumberValueType>) {
        this._X_CALC = value;
        this.called = true;
    }
    get XCalc(): NumberValueTypePointer<NumberValueType> {
        return this._X_CALC;
    }

    private _Y_CALC!: NumberValueTypePointer<NumberValueType>;
    set YCalc(value: NumberValueTypePointer<NumberValueType>) {
        this._Y_CALC = value;
        this.called = true;
    }
    get YCalc(): NumberValueTypePointer<NumberValueType> {
        return this._Y_CALC;
    }

    constructor(
        ID: number,
        xCalc: NumberValueTypePointer<NumberValueType>,
        yCalc: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, ValueType.pixelIndex, name, game);
        this.XCalc = xCalc;
        this.YCalc = yCalc;
    }


    get(executionOrder: number[]): number {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        /*new Promise((res, rej) => {
            this.game.drawInstruction.next({
                command: 'getPixel',
                callback: (color: number) => {
                    res(color);
                }
            })
        }).then((color) => {
            return color;
        })*/
        return 0;
    }

    set(newValue: number, executionOrder: number[]) {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        this.game.drawInstruction.next({
            command: 'drawPixel',
            x: this.XCalc.getValue(executionOrder),
            y: this.YCalc.getValue(executionOrder),
            pixelColor: newValue,
        });
    }
    isTruthy(executionOrder: number[]) {
        return this.get(executionOrder) !== 0;
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            xCalc: this.XCalc.ID,
            yCalc: this.YCalc.ID
        });
    }
}
