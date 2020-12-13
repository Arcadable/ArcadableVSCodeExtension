import { Arcadable } from '../arcadable';
import { Executable } from '../callStack';
import { Instruction, InstructionType } from './instruction';

export class ClearInstruction extends Instruction {

    constructor(
        ID: number,
        name: string,
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.Clear, name, game, await);
    }


    getExecutables(async: boolean): Executable[] {

        return [new Executable(async () => {
            this.game.instructionEmitter.next({
                command: 'clear'
            });
            return [];
        }, async, [], null)];
    }

}
