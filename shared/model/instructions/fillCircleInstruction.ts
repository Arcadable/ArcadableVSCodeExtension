import { Arcadable } from '../arcadable';
import { Executable } from '../callStack';
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
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.FillCircle, name, game, await);
    }


    async getExecutables(async: boolean): Promise<Executable[]> {
        return [new Executable(async () => {
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
            return [];
        }, async, false, [], null, null)];
    }

}
