import { Arcadable } from '../arcadable';
import { LogicElement } from '../logicElement';
import { Instruction, InstructionPointer } from './instruction';

export class InstructionSet extends LogicElement {

    constructor(
        ID: number,
        public size: number,
        public instructions: InstructionPointer[],
        name: string,
        game: Arcadable
    ) {
        super(ID, name, game);
    }

    execute(): (() => Promise<any>)[] {
        return this.instructions.map(
            (instruction: InstructionPointer) => async () => await instruction.execute()
        );
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            size: this.size,
            instructions: this.instructions
        });
    }
}
export class InstructionSetPointer {
    ID!: number;
    game!: Arcadable;
    constructor(ID: number, game: Arcadable) {
    	this.ID = ID;
    	this.game = game;
    }
    execute(): (() => Promise<any>)[] {
        return this.game.instructionSets[this.ID].execute();
    }
}
