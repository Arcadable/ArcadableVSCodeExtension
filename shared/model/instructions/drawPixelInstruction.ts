import { Arcadable } from '../arcadable';
import { Executable } from '../callStack';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';

export class DrawPixelInstruction extends Instruction {

    constructor(
        ID: number,
        public colorValue: NumberValueTypePointer<NumberValueType>,
        public xValue: NumberValueTypePointer<NumberValueType>,
        public yValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.DrawPixel, name, game, await);
    }


    async getExecutables(async: boolean): Promise<Executable[]> {

        return [new Executable(async () => {

            const [
                x,
                y,
                pixelColor
            ] = await Promise.all([
                this.xValue.getValue(),
                this.yValue.getValue(),
                this.colorValue.getValue(),
            ]);
            this.game.instructionEmitter.next({
                command: 'drawPixel',
                x,
                y,
                pixelColor,
            });
            return [];
        }, async, false, [], null, null)];
    }

}
