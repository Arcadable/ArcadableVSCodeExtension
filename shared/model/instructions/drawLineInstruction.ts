import { Arcadable } from '../arcadable';
import { Executable } from '../callStack';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';

export class DrawLineInstruction extends Instruction {


    constructor(
        ID: number,
        public colorValue: NumberValueTypePointer<NumberValueType>,
        public x1Value: NumberValueTypePointer<NumberValueType>,
        public y1Value: NumberValueTypePointer<NumberValueType>,
        public x2Value: NumberValueTypePointer<NumberValueType>,
        public y2Value: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.DrawLine, name, game, await);
    }


    getExecutables(async: boolean): Executable[] {

        return [new Executable(async () => {
            const [
                pos1X,
                pos1Y,
                pos2X,
                pos2Y,
                lineColor
            ] = await Promise.all([
                this.x1Value.getValue(),
                this.y1Value.getValue(),
                this.x2Value.getValue(),
                this.y2Value.getValue(),
                this.colorValue.getValue()
            ]);
            this.game.instructionEmitter.next({
                command: 'drawLine',
                lineColor,
                pos1X,
                pos1Y,
                pos2X,
                pos2Y,
            });
            return [];
        }, async, [], null)];
    }

}
