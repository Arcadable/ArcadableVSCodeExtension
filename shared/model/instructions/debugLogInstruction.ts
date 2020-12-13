import { Value, ValuePointer } from './../values/value';
import { Instruction, InstructionType } from './instruction';
import { Arcadable } from '../arcadable';
import { Executable } from '../callStack';

export class DebugLogInstruction extends Instruction {

    constructor(
        ID: number,
        public logValue: ValuePointer<Value>,
        name: string,
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.DebugLog, name, game, await);

    }


    getExecutables(async: boolean): Executable[] {

        return [new Executable(async () => {
            const logValue = await this.logValue.getValue();

			this.game.instructionEmitter.next({
				command: 'log',
				value: logValue
            });
            return [];
		}, async, [], null)];
    }

}
