import { Arcadable } from '../arcadable';
import { NumberArrayValueTypePointer } from '../values/NumberArrayValueType';
import { NumberValueType, NumberValueTypePointer } from '../values/NumberValueType';
import { TextValue } from '../values/textValue';
import { Instruction, InstructionType } from './instruction';

export class DrawTextInstruction extends Instruction {

    private _COLOR_VALUE!: NumberValueTypePointer<NumberValueType>;
    set colorValue(value: NumberValueTypePointer<NumberValueType>) {
        this._COLOR_VALUE = value;
        this.called = true;
    }
    get colorValue(): NumberValueTypePointer<NumberValueType> {
        return this._COLOR_VALUE;
    }

    private _SCALE_VALUE!: NumberValueTypePointer<NumberValueType>;
    set scaleValue(value: NumberValueTypePointer<NumberValueType>) {
        this._SCALE_VALUE = value;
        this.called = true;
    }
    get scaleValue(): NumberValueTypePointer<NumberValueType> {
        return this._SCALE_VALUE;
    }


    private _TEXT_VALUE!: NumberArrayValueTypePointer<TextValue>;
    set textValue(value: NumberArrayValueTypePointer<TextValue>) {
        this._TEXT_VALUE = value;
        this.called = true;
    }
    get textValue(): NumberArrayValueTypePointer<TextValue> {
        return this._TEXT_VALUE;
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
        instructionType: InstructionType,
        page: number,
        colorValue: NumberValueTypePointer<NumberValueType>,
        scaleValue: NumberValueTypePointer<NumberValueType>,
        xValue: NumberValueTypePointer<NumberValueType>,
        yValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, instructionType, page, name, game);
        this.colorValue = colorValue;
        this.scaleValue = scaleValue;
        this.xValue = xValue;
        this.yValue = yValue;
    }


    execute(executionOrder: number[]): ((executionOrder: number[]) => any)[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        const pixelTextX = this.xValue.getValue(executionOrder);
        let pixelTextY = this.yValue.getValue(executionOrder);
        const scale = this.scaleValue.getValue(executionOrder);
        pixelTextY += scale * 8;
        const textColor = this.colorValue.getValue(executionOrder);
        const text = this.textValue.getValue(executionOrder).reduce((acc, curr) => acc + String.fromCharCode(curr), '');

        return [ (e: number[]) => {
            this.game.drawInstruction.next({
                command: 'drawText',
                pixelTextX,
                pixelTextY,
                scale,
                textColor,
                text,
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
            scale: this.scaleValue,
            text: this.textValue,
            xValue: this.xValue,
            yValue: this.yValue,
        });
    }
}
