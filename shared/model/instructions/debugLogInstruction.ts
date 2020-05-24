import { Value, ValuePointer } from './../values/value';
import { Instruction, InstructionType } from './instruction';
import { Arcadable } from '../arcadable';

export class DebugLogInstruction extends Instruction {

    private _LOG_VALUE!: ValuePointer<Value>;
    set logValue(value:ValuePointer<Value>) {
        this._LOG_VALUE = value;
        this.called = true;
    }
    get logValue(): ValuePointer<Value> {
        return this._LOG_VALUE;
    }

    constructor(
        ID: number,
        logValue: ValuePointer<Value>,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.DebugLog, name, game);
        this.logValue = logValue;

    }


    execute(executionOrder: number[]): ((executionOrder: number[]) => any)[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }

		const logValue = this.logValue.getValue(executionOrder);

        return [(e: number[]) => { 
			this.game.instructionEmitter.next({
				command: 'log',
				value: logValue
			});
		}];
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            logValue: this.logValue,
        });
    }
}
