import { WaitInstruction } from './waitInstruction';
import { Executable } from './../callStack';
import { Arcadable } from '../arcadable';
import { LogicElement } from '../logicElement';
import { Instruction, InstructionPointer, InstructionType } from './instruction';
import { ToneInstruction } from './toneInstruction';

export class InstructionSet extends LogicElement {

    constructor(
        ID: number,
        public size: number,
        public instructions: InstructionPointer[],
        public async: boolean,
        name: string,
        game: Arcadable
    ) {
        super(ID, name, game);
    }

    async getExecutables(): Promise<Executable[]> {
        const allExecutables = await this.instructions.reduce(
            async (acc: Promise<Executable[]>, instruction: InstructionPointer) => {
                const accumulative = await acc;
                switch(this.game.instructions[instruction.ID].instructionType) {
                    case InstructionType.Wait: {
                        const newExecutable = new Executable(async () => instruction.getExecutables(this.async), this.async, instruction.await(), [], null, () => (this.game.instructions[instruction.ID] as WaitInstruction).amountValue.getValue());
                        return [...accumulative, newExecutable];
                    }
                    case InstructionType.Tone: {
                        if(instruction.await()) {
                            const newExecutable = new Executable(async () => instruction.getExecutables(this.async), this.async, false, [], null, null);
                            const toAwait = new Executable(async () => [new Executable(async () => [], this.async, false, [], null, null)], this.async, true, [], null, () => (this.game.instructions[instruction.ID] as ToneInstruction).durationValue.getValue());
                            return [...accumulative, newExecutable, toAwait];
                        }
                        break;
                    }
                }
                const newExecutable = new Executable(async () => instruction.getExecutables(this.async), this.async, instruction.await(), [], null, null);
                return [...accumulative, newExecutable];

            }, Promise.resolve([]) as Promise<Executable[]>
        );
        return this.processAwaiting(allExecutables);
    }

    async processAwaiting(executables: Executable[]): Promise<Executable[]> {
        let awaitExecutable: Executable | null = null;

        const processedExecutables = executables.reduce((acc: Executable[], executable: Executable) => {
            if(!!awaitExecutable) {
                awaitExecutable.awaiting.push(executable);
                return acc;
            } else {
                if(executable.await) {
                    awaitExecutable = executable;
                }
                return [...acc, executable];
            }
        }, [] as Executable[])

        if(!!awaitExecutable) {
            (awaitExecutable as Executable).awaiting = await this.processAwaiting((awaitExecutable as Executable).awaiting);
        }
        return processedExecutables;
    }
}
export class InstructionSetPointer {
    ID!: number;
    game!: Arcadable;
    constructor(ID: number, game: Arcadable) {
    	this.ID = ID;
    	this.game = game;
    }
    async getExecutables(): Promise<Executable[]> {
        return this.game.instructionSets[this.ID].getExecutables();
    }
}
