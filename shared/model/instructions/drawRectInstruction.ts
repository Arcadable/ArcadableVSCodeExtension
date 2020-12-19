import { Arcadable } from '../arcadable';
import { Executable } from '../callStack';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';

export class DrawRectInstruction extends Instruction {



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
        super(ID, InstructionType.DrawRect, name, game, await);
    }


    async getExecutables(async: boolean): Promise<Executable[]> {

        return [new Executable(async () => {
            const [
                topLeftDrawX,
                topLeftDrawY,
                bottomRightDrawX,
                bottomRightDrawY,
                drawRectColor,
            ] = await Promise.all([
                this.x1Value.getValue(),
                this.y1Value.getValue(),
                this.x2Value.getValue(),
                this.y2Value.getValue(),
                this.colorValue.getValue()
            ]);
            const width = bottomRightDrawX - topLeftDrawX;
            const height = bottomRightDrawY - topLeftDrawY;


            this.game.instructionEmitter.next({
                command: 'drawRect',
                topLeftDrawX,
                topLeftDrawY,
                width,
                height,
                drawRectColor,
            });
            return [];
        }, async, false, [], null, null)];
    }


}
