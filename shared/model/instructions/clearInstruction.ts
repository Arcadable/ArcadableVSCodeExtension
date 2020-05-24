import { Arcadable } from '../arcadable';
import { Instruction, InstructionType } from './instruction';

export class ClearInstruction extends Instruction {

    constructor(
        ID: number,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.Clear, name, game);
    }


    execute(executionOrder: number[]): ((executionOrder: number[]) => any)[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        return [ (e: number[]) => {
            this.game.instructionEmitter.next({
                command: 'clear'
            });
        }];
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
        });
    }
}
