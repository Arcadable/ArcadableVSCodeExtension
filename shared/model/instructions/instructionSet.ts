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
    private _IS_ROOT: boolean = false;
    set isRoot(value: boolean) {
        this._IS_ROOT = value;
    }
    get isRoot(): boolean {
        return this._IS_ROOT;
    }


    constructor(
        ID: number,
        page: number,
        isRoot: boolean,
        size: number,
        instructions: InstructionPointer[],
        name: string,
        game: Arcadable
    ) {
        super(ID, page, name, game);
        this.isRoot = isRoot;
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
            page: this.page,
            size: this.size,
            isRoot: this.isRoot,
            instructions: this.instructions
        });
    }
}
export class InstructionSetPointer {
    ID!: number;
    game!: Arcadable;
    execute(executionOrder: number[]) {
        return this.game.instructionSets[this.ID].execute();
    }
}
