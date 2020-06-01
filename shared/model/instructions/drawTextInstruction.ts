import { Arcadable } from '../arcadable';
import { NumberArrayValueTypePointer } from '../values/_numberArrayValueType';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { TextValue } from '../values/textValue';
import { Instruction, InstructionType } from './instruction';

export class DrawTextInstruction extends Instruction {

    constructor(
        ID: number,
        public colorValue: NumberValueTypePointer<NumberValueType>,
        public scaleValue: NumberValueTypePointer<NumberValueType>,
        public textValue: NumberArrayValueTypePointer<TextValue>,
        public xValue: NumberValueTypePointer<NumberValueType>,
        public yValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.DrawText, name, game);
    }


    execute(): (() => Promise<any>)[] {

        return [async () => {
            let [
                pixelTextX,
                pixelTextY,
                scale,
                textColor,
                text,
            ] = await Promise.all([
                this.xValue.getValue(),
                this.yValue.getValue(),
                this.scaleValue.getValue(),
                this.colorValue.getValue(),
                this.textValue.getValue()
            ]);
    
            text = text.reduce((acc: string, curr: number) => acc + String.fromCharCode(curr), '');
            pixelTextY += scale * 8;

            this.game.instructionEmitter.next({
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
            colorValue: this.colorValue,
            scale: this.scaleValue,
            text: this.textValue,
            xValue: this.xValue,
            yValue: this.yValue,
        });
    }
}
