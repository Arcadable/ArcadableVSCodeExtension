import { exec } from 'child_process';
import { Subject, timer } from 'rxjs';
import { CallStack, Executable } from './callStack';
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
	
	mainCallStack: CallStack = new CallStack();
	renderCallStack: CallStack = new CallStack();

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
		this.mainCallStack = new CallStack(10000);
		this.renderCallStack = new CallStack(10000);

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
		this.mainCallStack.prepareStep();
    	const mainInstructionSet = this.instructionSets[
    		this.mainInstructionSet
		] as InstructionSet;
		this.mainCallStack.pushfront(...(await mainInstructionSet.getExecutables()));

		this.processCallStack(this.mainCallStack);
	}

	private async processCallStack(callStack: CallStack) {
		if(callStack.size() > 0) {
			const executable = callStack.pop();
			if(executable) {
				await executable.checkWaitMillis();

				if(!!executable.executeOnMillis) {

					if(executable.executeOnMillis <= new Date().getTime()) {
						await this.processExecutable(executable, callStack);
					} else {
						callStack.delayScheduledSection(executable);
					}
				} else {
					await this.processExecutable(executable, callStack);
				}
			}
			if (callStack.doProcessMore()) {
				this.processCallStack(callStack);
			}
		}
	}

	private async processExecutable(executable: Executable, callStack: CallStack) {
		let newExecutables = (await executable.action()).map(e => executable.parentAwait ? e.withParentAwait(executable.parentAwait) : e);

		if(newExecutables.length > 0) {
			if(executable.async) {
				if (executable.awaiting.length > 0) {
					const waitFor = new Executable(async () => executable.awaiting.map(e => executable.parentAwait ? e.withParentAwait(executable.parentAwait) : e), true, false, [], executable.parentAwait, null);
					newExecutables = newExecutables.map(e => e.withParentAwait(waitFor))
					callStack.pushfront(...newExecutables);
					if(executable.parentAwait) {
						callStack.pushinfrontof(executable.parentAwait, waitFor);
					} else {
						callStack.pushback(waitFor);
					}
				} else {
					callStack.pushfront(...newExecutables);
				}
			} else {
				callStack.pushfront(...newExecutables);
			}
		}
	}

	private async doRenderStep() {
		this.renderCallStack.prepareStep();

    	const renderInstructionSet = this.instructionSets[
    		this.renderInstructionSet
		] as InstructionSet;

		this.renderCallStack.pushfront(...(await renderInstructionSet.getExecutables()));
		this.renderCallStack.pushback(new Executable(async () => {
			this.instructionEmitter.next({command: 'renderDone'});
			return [];
		}, false, false, [], null, null));
		this.processCallStack(this.renderCallStack);

    }

}
