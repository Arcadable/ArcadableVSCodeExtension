import { ImageValueType, ImageValueTypePointer } from './../values/imageValueType';
import { Arcadable } from '../arcadable';
import { ImageValue } from '../values/imageValue';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';

export class DrawImageInstruction extends Instruction {


    constructor(
        ID: number,
        public xValue: NumberValueTypePointer<NumberValueType>,
        public yValue: NumberValueTypePointer<NumberValueType>,
        public imageValue: ImageValueTypePointer<ImageValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.DrawImage, name, game);
    }


    execute(): (() => Promise<any>)[] {

        return [async () => {
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
        }];
    }

}
