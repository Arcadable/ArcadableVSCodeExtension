import { Arcadable } from '../arcadable';
import { Value, ValuePointer } from '../values/value';
import { Instruction, InstructionType } from './instruction';
import { InstructionSetPointer } from './instructionSet';

export class RunSetInstruction extends Instruction {



    private _SET!: InstructionSetPointer;
    set set(value: InstructionSetPointer) {
        this._SET = value;
        this.called = true;
    }
    get set(): InstructionSetPointer {
        return this._SET;
    }


    constructor(
        ID: number,
        set: InstructionSetPointer,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.RunSet, name, game);
        this.set = set;
    }


    execute(executionOrder: number[]): ((executionOrder: number[]) => any)[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
       
        return this.set.execute(executionOrder);
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            set: this.set
        });
    }
}
