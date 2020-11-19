import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';

export class DrawCircleInstruction extends Instruction {


    constructor(
        ID: number,
        public colorValue: NumberValueTypePointer<NumberValueType>,
        public radiusValue: NumberValueTypePointer<NumberValueType>,
        public xValue: NumberValueTypePointer<NumberValueType>,
        public yValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.DrawCircle, name, game);
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
                command: 'drawCircle',
                color,
                radius,
                centerX,
                centerY
            });
        }];
    }

}
