import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from '../values/NumberValueType';
import { Instruction, InstructionType } from './instruction';

export class DrawCircleInstruction extends Instruction {

    private _COLOR_VALUE!: NumberValueTypePointer<NumberValueType>;
    set colorValue(value: NumberValueTypePointer<NumberValueType>) {
        this._COLOR_VALUE = value;
        this.called = true;
    }
    get colorValue(): NumberValueTypePointer<NumberValueType> {
        return this._COLOR_VALUE;
    }

    private _RADIUS_VALUE!: NumberValueTypePointer<NumberValueType>;
    set radiusValue(value: NumberValueTypePointer<NumberValueType>) {
        this._RADIUS_VALUE = value;
        this.called = true;
    }
    get radiusValue(): NumberValueTypePointer<NumberValueType> {
        return this._RADIUS_VALUE;
    }

    private _X_VALUE!: NumberValueTypePointer<NumberValueType>;
    set xValue(value: NumberValueTypePointer<NumberValueType>) {
        this._X_VALUE = value;
        this.called = true;
    }
    get xValue(): NumberValueTypePointer<NumberValueType> {
        return this._X_VALUE;
    }

    private _Y_VALUE!: NumberValueTypePointer<NumberValueType>;
    set yValue(value: NumberValueTypePointer<NumberValueType>) {
        this._Y_VALUE = value;
        this.called = true;
    }
    get yValue(): NumberValueTypePointer<NumberValueType> {
        return this._Y_VALUE;
    }


    constructor(
        ID: number,
        colorValue: NumberValueTypePointer<NumberValueType>,
        radiusValue: NumberValueTypePointer<NumberValueType>,
        xValue: NumberValueTypePointer<NumberValueType>,
        yValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.DrawCircle, name, game);
        this.colorValue = colorValue;
        this.radiusValue = radiusValue;
        this.xValue = xValue;
        this.yValue = yValue;
    }


    execute(executionOrder: number[]): ((executionOrder: number[]) => any)[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        const color = this.colorValue.getValue(executionOrder);
        const radius = this.radiusValue.getValue(executionOrder);
        const centerX = this.xValue.getValue(executionOrder);
        const centerY = this.yValue.getValue(executionOrder);

        return [ (e: number[]) => {
            this.game.drawInstruction.next({
                command: 'drawCircle',
                color,
                radius,
                centerX,
                centerY
            });
        }];
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            colorValue: this.colorValue,
            radiusValue: this.radiusValue,
            xValue: this.xValue,
            yValue: this.yValue,
        });
    }
}
