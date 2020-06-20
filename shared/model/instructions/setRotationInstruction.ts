import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';

export class SetRotationInstruction extends Instruction {

    constructor(
        ID: number,
        public rotationValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.SetRotation, name, game);
    }


    execute(): (() => Promise<any>)[] {
        return [async () => {
            const rotation = await this.rotationValue.getValue();

            this.game.instructionEmitter.next({
                command: 'setRotation',
                rotation,
            });
        }];
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            rotationValue: this.rotationValue,
        });
    }
}
