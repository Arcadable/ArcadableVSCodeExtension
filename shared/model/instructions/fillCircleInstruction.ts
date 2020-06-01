import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';

export class FillCircleInstruction extends Instruction {


    constructor(
        ID: number,
        public colorValue: NumberValueTypePointer<NumberValueType>,
        public radiusValue: NumberValueTypePointer<NumberValueType>,
        public xValue: NumberValueTypePointer<NumberValueType>,
        public yValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.FillCircle, name, game);
    }


    execute(): (() => Promise<any>)[] {
        return [async () => {
            const [
                color,
                radius,
                centerX,
                centerY
            ] = await Promise.all([
                this.colorValue.getValue(),
                this.radiusValue.getValue(),
                this.xValue.getValue(),
                this.yValue.getValue()
            ]);

            this.game.instructionEmitter.next({
                command: 'fillCircle',
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
