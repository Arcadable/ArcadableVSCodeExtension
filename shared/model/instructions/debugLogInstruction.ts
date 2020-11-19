import { Value, ValuePointer } from './../values/value';
import { Instruction, InstructionType } from './instruction';
import { Arcadable } from '../arcadable';

export class DebugLogInstruction extends Instruction {

    constructor(
        ID: number,
        public logValue: ValuePointer<Value>,
        name: string,
        game: Arcadable
    ) {
        super(ID, InstructionType.DebugLog, name, game);

    }


    execute(): (() => Promise<any>)[] {

        return [async () => {
            const logValue = await this.logValue.getValue();

			this.game.instructionEmitter.next({
				command: 'log',
				value: logValue
			});
		}];
    }

}
