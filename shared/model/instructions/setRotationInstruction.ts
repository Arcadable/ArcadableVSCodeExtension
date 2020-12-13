import { Executable } from './../callStack';
import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';

export class SetRotationInstruction extends Instruction {

    constructor(
        ID: number,
        public rotationValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.SetRotation, name, game, await);
    }


    getExecutables(async: boolean): Executable[] {
        return [new Executable(async () => {
            const rotation = await this.rotationValue.getValue();

            this.game.instructionEmitter.next({
                command: 'setRotation',
                rotation,
            });
            return [];
        }, async, [], null)];
    }

}
