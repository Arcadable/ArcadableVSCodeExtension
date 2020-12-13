import { ImageValueType, ImageValueTypePointer } from './../values/imageValueType';
import { Arcadable } from '../arcadable';
import { ImageValue } from '../values/imageValue';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';
import { Executable } from '../callStack';

export class DrawImageInstruction extends Instruction {


    constructor(
        ID: number,
        public xValue: NumberValueTypePointer<NumberValueType>,
        public yValue: NumberValueTypePointer<NumberValueType>,
        public imageValue: ImageValueTypePointer<ImageValueType>,
        name: string,
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.DrawImage, name, game, await);
    }


    getExecutables(async: boolean): Executable[] {

        return [new Executable(async () => {
            const [
                x,
                y,
                data
            ] = await Promise.all([
                this.xValue.getValue(),
                this.yValue.getValue(),
                this.imageValue.getValue()
            ]);
    
            this.game.instructionEmitter.next({
                command: 'drawImage',
                x,
                y,
                w: data.width,
                h: data.height,
                keyColor: data.keyColor,
                data: data.data
            });
            return [];
        }, async, [], null)];
    }

}
