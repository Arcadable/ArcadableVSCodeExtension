import { Arcadable } from '../arcadable';
import { Instruction, InstructionType } from './instruction';

export class ClearInstruction extends Instruction {

    constructor(
        ID: number,
        instructionType: InstructionType,
        page: number,
        name: string,
        game: Arcadable
    ) {
        super(ID, instructionType, page, name, game);
    }


    execute(executionOrder: number[]): ((executionOrder: number[]) => any)[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

        return [ (e: number[]) => {
            this.game.drawInstruction.next({
                command: 'clear'
            });
        }];
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            page: this.page,
        });
    }
}
