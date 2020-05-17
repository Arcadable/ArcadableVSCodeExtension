import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from '../values/NumberValueType';
import { Instruction, InstructionType } from './instruction';

export class DrawLineInstruction extends Instruction {

    private _COLOR_VALUE!: NumberValueTypePointer<NumberValueType>;
    set colorValue(value: NumberValueTypePointer<NumberValueType>) {
        this._COLOR_VALUE = value;
        this.called = true;
    }
    get colorValue(): NumberValueTypePointer<NumberValueType> {
        return this._COLOR_VALUE;
    }

    private _X1_VALUE!: NumberValueTypePointer<NumberValueType>;
    set x1Value(value: NumberValueTypePointer<NumberValueType>) {
        this._X1_VALUE = value;
        this.called = true;
    }
    get x1Value(): NumberValueTypePointer<NumberValueType> {
        return this._X1_VALUE;
    }

    private _Y1_VALUE!: NumberValueTypePointer<NumberValueType>;
    set y1Value(value: NumberValueTypePointer<NumberValueType>) {
        this._Y1_VALUE = value;
        this.called = true;
    }
    get y1Value(): NumberValueTypePointer<NumberValueType> {
        return this._Y1_VALUE;
    }

    private _X2_VALUE!: NumberValueTypePointer<NumberValueType>;
    set x2Value(value: NumberValueTypePointer<NumberValueType>) {
        this._X2_VALUE = value;
        this.called = true;
    }
    get x2Value(): NumberValueTypePointer<NumberValueType> {
        return this._X2_VALUE;
    }

    private _Y2_VALUE!: NumberValueTypePointer<NumberValueType>;
    set y2Value(value: NumberValueTypePointer<NumberValueType>) {
        this._Y2_VALUE = value;
        this.called = true;
    }
    get y2Value(): NumberValueTypePointer<NumberValueType> {
        return this._Y2_VALUE;
    }

    constructor(
        ID: number,
        instructionType: InstructionType,
        page: number,
        colorValue: NumberValueTypePointer<NumberValueType>,
        x1Value: NumberValueTypePointer<NumberValueType>,
        y1Value: NumberValueTypePointer<NumberValueType>,
        x2Value: NumberValueTypePointer<NumberValueType>,
        y2Value: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, instructionType, page, name, game);
        this.colorValue = colorValue;
        this.x1Value = x1Value;
        this.y1Value = y1Value;
        this.x2Value = x2Value;
        this.y2Value = y2Value;
    }


    execute(executionOrder: number[]): ((executionOrder: number[]) => any)[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }


        const pos1X = this.x1Value.getValue(executionOrder);
        const pos1Y = this.y1Value.getValue(executionOrder);
        const pos2X = this.x2Value.getValue(executionOrder);
        const pos2Y = this.y2Value.getValue(executionOrder);

        const lineColor = this.colorValue.getValue(executionOrder);
        return [ (e: number[]) => {
            this.game.drawInstruction.next({
                command: 'drawLine',
                lineColor,
                pos1X,
                pos1Y,
                pos2X,
                pos2Y,
            });
        }];
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            page: this.page,
            colorValue: this.colorValue,
            x1Value: this.x1Value,
            y1Value: this.y1Value,
            x2Value: this.x2Value,
            y2Value: this.y2Value,
        });
    }
}
