import { Instruction, InstructionType } from './instruction';
import { Arcadable } from '../arcadable';
import { Executable } from '../callStack';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';

export class WaitInstruction extends Instruction {

    constructor(
        ID: number,
        public amountValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable,
    ) {
        super(ID, InstructionType.Wait, name, game, true);

    }


    async getExecutables(async: boolean): Promise<Executable[]> {
        return [new Executable(async () => {
            return [];
		}, async, false, [], null, null)];
    }

}
