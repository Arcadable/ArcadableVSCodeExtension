import { Subject, timer } from 'rxjs';
import { Instruction } from './instructions/instruction';
import { InstructionSet } from './instructions/instructionSet';
import { SystemConfig } from './systemConfig';
import { EvaluationValue } from './values/evaluationValue';
import { Value, ValueType } from './values/value';

export class Arcadable {
	instructionEmitter = new Subject<any>();
	interruptedEmitter = new Subject<any>();

    values: {[key: number]: Value} = {};
    instructions: {[key: number]: Instruction} = {};
    instructionSets: {[key: number]: InstructionSet} = {};
	mainInstructionSet: number = 0;
	renderInstructionSet: number = 0;
    systemConfig: SystemConfig;

	prevMainMillis = 0;
	prevRenderMillis = 0;
    startMillis = 0;

    constructor(
    	systemConfig: SystemConfig
    ) {
    	this.systemConfig = systemConfig;
    	this.startMillis = new Date().getTime();
    }

    setGameLogic(
    	values: {[key: number]: Value},
    	instructions: {[key: number]: Instruction},
    	instructionSets: {[key: number]: InstructionSet},
		mainInstructionSet: number,
		renderInstructionSet: number
    ) {
		Object.keys(this.values).forEach(k => (this.values[+k] as any).game = undefined );
		Object.keys(this.instructions).forEach(k => (this.instructions[+k] as any).game = undefined );
		Object.keys(this.instructionSets).forEach(k => (this.instructionSets[+k] as any).game = undefined );

    	this.values = values;
    	this.instructions = instructions;
    	this.instructionSets = instructionSets;
		this.mainInstructionSet = mainInstructionSet;
		this.renderInstructionSet = renderInstructionSet;

    }

    start() {

    	Object.keys(this.values).forEach(k => {
    		if ((this.values[Number(k)] as Value).type === ValueType.evaluation) {
    			(this.values[Number(k)] as EvaluationValue)._STATIC_RESULT = undefined;
    		}
    	});

		this.systemConfig.startMillis = new Date().getTime();
		this.startMain();
		this.startRender();
	}
	stop(error?: {message: string, values: number[], instructions: number[]}) {
		this.interruptedEmitter.next(error);
    }
	startRender() {
		const timerSubscr = timer(0, this.systemConfig.targetRenderMillis).subscribe(async () => {
			try {
				await this.doRenderStep();
			} catch (e) {
				this.instructionEmitter.next({message: 'An unexpected error occured.'});
			}
		});
		const interruptSubscr = this.interruptedEmitter.subscribe(e => {
			timerSubscr.unsubscribe();
			interruptSubscr.unsubscribe();
		})
	}

	startMain() {
		const timerSubscr = timer(0, this.systemConfig.targetMainMillis).subscribe(async () => {
			try {
				await this.doMainStep();
			} catch (e) {
				this.instructionEmitter.next({message: 'An unexpected error occured.'});
			}
		});
		const interruptSubscr = this.interruptedEmitter.subscribe(e => {
			timerSubscr.unsubscribe();
			interruptSubscr.unsubscribe();
		})
	}


    private async doMainStep() {
    	this.systemConfig.fetchInputValues();
    	const mainInstructionSet = this.instructionSets[
    		this.mainInstructionSet
		] as InstructionSet;

		const executables = mainInstructionSet.instructions.map((instructionPointer) =>
			(async () => await this.execute(async () => await instructionPointer.execute()))
		);
		await executables.reduce(async (p, fn) => { await p; return fn() }, Promise.resolve())

	}
	private async doRenderStep() {
    	const renderInstructionSet = this.instructionSets[
    		this.renderInstructionSet
		] as InstructionSet;

		const executables = renderInstructionSet.instructions.map((instructionPointer) =>
			(async () => await this.execute(async () => await instructionPointer.execute()))
		);
		await executables.reduce(async (p, fn) => { await p; return fn() }, Promise.resolve())

		this.instructionEmitter.next({command: 'renderDone'})
    }


    async execute(action: () => Promise<(() => any)[]>) {
		const actions = (await action()) || [];
		const executables = actions.map((a, i) =>
			(async () => await this.execute(a))
		);
		await executables.reduce(async (p, fn) => { await p; return fn() }, Promise.resolve())
    }


}
