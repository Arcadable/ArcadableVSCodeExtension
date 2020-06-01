import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';

export class FillRectInstruction extends Instruction {

    constructor(
        ID: number,
        public colorValue: NumberValueTypePointer<NumberValueType>,
        public x1Value: NumberValueTypePointer<NumberValueType>,
        public y1Value: NumberValueTypePointer<NumberValueType>,
        public x2Value: NumberValueTypePointer<NumberValueType>,
        public y2Value: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.FillRect, name, game);
      
    }


    execute(): (() => Promise<any>)[] {
        return [async () => {
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
                command: 'fillRect',
                topLeftDrawX,
                topLeftDrawY,
                width,
                height,
                drawRectColor,
            });
        }];
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            colorValue: this.colorValue,
            x1Value: this.x1Value,
            y1Value: this.y1Value,
            x2Value: this.x2Value,
            y2Value: this.y2Value,
        });
    }
}
