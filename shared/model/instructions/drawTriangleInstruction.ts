import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';

export class DrawTriangleInstruction extends Instruction {


    constructor(
        ID: number,
        public colorValue: NumberValueTypePointer<NumberValueType>,
        public x1Value: NumberValueTypePointer<NumberValueType>,
        public y1Value: NumberValueTypePointer<NumberValueType>,
        public x2Value: NumberValueTypePointer<NumberValueType>,
        public y2Value: NumberValueTypePointer<NumberValueType>,
        public x3Value: NumberValueTypePointer<NumberValueType>,
        public y3Value: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.DrawTriangle, name, game);
    }


    execute(): (() => Promise<any>)[] {

        return [async () => {
            const [
                triangleColor,
                pixel1X,
                pixel1Y,
                pixel2X,
                pixel2Y,
                pixel3X,
                pixel3Y
            ] = await Promise.all([
                this.colorValue.getValue(),
                this.x1Value.getValue(),
                this.y1Value.getValue(),
                this.x2Value.getValue(),
                this.y2Value.getValue(),
                this.x3Value.getValue(),
                this.y3Value.getValue()
            ]);

            
            this.game.instructionEmitter.next({
                command: 'drawTriangle',
                triangleColor,
                pixel1X,
                pixel1Y,
                pixel2X,
                pixel2Y,
                pixel3X,
                pixel3Y,
            });
        }];
    }

}
