import { Arcadable } from '../arcadable';
import { LogicElement } from '../logicElement';
import { Instruction, InstructionPointer } from './instruction';

export class InstructionSet extends LogicElement {

    private _INSTRUCTIONS: InstructionPointer[] = [];
    set instructions(value: InstructionPointer[]) {
        this._INSTRUCTIONS = value;
    }
    get instructions(): InstructionPointer[] {
        return this._INSTRUCTIONS;
    }
    private _SIZE!: number;
    set size(value: number) {
        this._SIZE = value;
    }
    get size(): number {
        return this._SIZE;
    }


    constructor(
        ID: number,
        size: number,
        instructions: InstructionPointer[],
        name: string,
        game: Arcadable
    ) {
        super(ID, name, game);
        this.size = size;
        this.instructions = instructions;
    }

    execute(): ((executionOrder: number[]) => any)[] {
        return this.instructions.map(
            (instruction: InstructionPointer) => (e: number[]) => instruction.execute(e)
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
    execute(executionOrder: number[]) {
        return this.game.instructionSets[this.ID].execute();
    }
}
