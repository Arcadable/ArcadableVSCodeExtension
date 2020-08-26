import { RunConditionInstruction } from './instructions/runConditionInstruction';
import { MutateValueInstruction } from './instructions/mutateValueInstruction';
import { FillTriangleInstruction } from './instructions/fillTriangleInstruction';
import { DrawTriangleInstruction } from './instructions/drawTriangleInstruction';
import { DrawTextInstruction } from './instructions/drawTextInstruction';
import { FillRectInstruction } from './instructions/fillRectInstruction';
import { DrawRectInstruction } from './instructions/drawRectInstruction';
import { DrawPixelInstruction } from './instructions/drawPixelInstruction';
import { DrawLineInstruction } from './instructions/drawLineInstruction';
import { FillCircleInstruction } from './instructions/fillCircleInstruction';
import { DrawCircleInstruction } from './instructions/drawCircleInstruction';
import { Subject, timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { Instruction, InstructionType } from './instructions/instruction';
import { InstructionSet } from './instructions/instructionSet';
import { SystemConfig } from './systemConfig';
import { EvaluationValue } from './values/evaluationValue';
import { Value, ValueType } from './values/value';
import { AnalogInputValue } from './values/analogInputValue';
import { DigitalInputValue } from './values/digitalInputValue';
import { ListDeclaration } from './values/listDeclaration';
import { ListValue } from './values/listValue';
import { NumberValue } from './values/_numberValue';
import { PixelValue } from './values/pixelValue';
import { SystemConfigValue } from './values/systemConfigValue';
import { TextValue } from './values/textValue';
import { SetRotationInstruction } from './instructions/setRotationInstruction';
import { RunSetInstruction } from './instructions/runSetInstruction';
import { ValueArrayValueType } from './values/valueArrayValueType';
import { NumberValueType } from './values/_numberValueType';
import { DebugLogInstruction } from './instructions/debugLogInstruction';

const fp = require('ieee-float');


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

    makeLength(value: string, length: number, signed?: boolean) {
    	let returnValue = value;
    	let negative = false;
    	if (signed && returnValue.charAt(0) === '-') {
    		negative = true;
    		returnValue = returnValue.substr(1);
    	}
    	if (returnValue.length < length) {
    		for (let i = 0; i < length - value.length; i++) {
    			returnValue = '0' + returnValue;
    		}
    	} else if (returnValue.length > length) {
    		returnValue = returnValue.substring(returnValue.length - length);
    	}
    	if (signed) {
    		returnValue = negative ? '1' + returnValue : returnValue;
    	}
    	return returnValue;
    }

    export(): Uint8Array {
    	let binaryString = '';

    	let tempBinaryString = '';
    	Object.keys(this.values).forEach(k => {
    		tempBinaryString += this.makeLength(this.values[Number(k)].ID.toString(2), 16);
    		tempBinaryString += this.makeLength(this.values[Number(k)].type.toString(2), 8);

    		switch (this.values[Number(k)].type) {
    			case ValueType.analogInputPointer: {
    				tempBinaryString += this.makeLength((this.values[Number(k)] as AnalogInputValue).index.toString(2), 8);
    				break;
    			}
    			case ValueType.digitalInputPointer: {
    				tempBinaryString += this.makeLength((this.values[Number(k)] as DigitalInputValue).index.toString(2), 8);
    				break;
    			}
    			case ValueType.evaluation: {
    				tempBinaryString += this.makeLength((this.values[Number(k)] as EvaluationValue).evaluationOperator.toString(2), 7);
    				tempBinaryString += (this.values[Number(k)] as EvaluationValue).isStatic ? '1' : '0';
    				tempBinaryString += this.makeLength((this.values[Number(k)] as EvaluationValue).left.ID.toString(2), 16);
    				tempBinaryString += this.makeLength((this.values[Number(k)] as EvaluationValue).right.ID.toString(2), 16);
    				break;
    			}
    			case ValueType.listDeclaration: {
    				tempBinaryString += this.makeLength((this.values[Number(k)] as ListDeclaration<Value>).size.toString(2), 16);
    				(this.values[Number(k)] as ListDeclaration<Value>).values.forEach(v => {
    					tempBinaryString += this.makeLength(v.ID.toString(2), 16);
    				});
    				break;
				}
				case ValueType.listValue: {
					tempBinaryString += this.makeLength((this.values[Number(k)] as ListValue<ValueArrayValueType, number | number[]>).listValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.values[Number(k)] as ListValue<ValueArrayValueType, number | number[]>).listIndex.ID.toString(2), 16);
    				break;
    			}
    			case ValueType.number: {
    				tempBinaryString += this.makeLength((this.values[Number(k)] as NumberValue).size.toString(2), 8);
    				const output: number[] = [];
					fp.writeFloatBE(output, (this.values[Number(k)] as NumberValue).value);
    				output.forEach(v => {
						tempBinaryString += this.makeLength(v.toString(2), 8);
    				});
    				break;
    			}
    			case ValueType.pixelIndex: {
    				tempBinaryString += this.makeLength((this.values[Number(k)] as PixelValue).XCalc.ID.toString(2), 16);
    				tempBinaryString += this.makeLength((this.values[Number(k)] as PixelValue).YCalc.ID.toString(2), 16);
    				break;
    			}
    			case ValueType.systemPointer: {
    				tempBinaryString += this.makeLength((this.values[Number(k)] as SystemConfigValue).configType.toString(2), 8);
    				break;
    			}
    			case ValueType.text: {
    				tempBinaryString += this.makeLength((this.values[Number(k)] as TextValue<NumberValueType>).size.toString(2), 8);
					(this.values[Number(k)]as TextValue<NumberValueType>).values.forEach(v => {
    					tempBinaryString += this.makeLength(v.ID.toString(2), 16);
    				});
    				break;
    			}
    		}
    	});
    	binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
    	binaryString += tempBinaryString;
    	tempBinaryString = '';
    	Object.keys(this.instructions).forEach(k => {
			tempBinaryString += this.makeLength(this.instructions[Number(k)].ID.toString(2), 16);
			tempBinaryString += this.makeLength(this.instructions[Number(k)].instructionType.toString(2), 8);

			switch (this.instructions[Number(k)].instructionType) {
				case InstructionType.Clear: {
					break;
				}
				case InstructionType.DrawCircle: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawCircleInstruction).colorValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawCircleInstruction).radiusValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawCircleInstruction).xValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawCircleInstruction).yValue.ID.toString(2), 16);
					break;
				}
				case InstructionType.FillCircle: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillCircleInstruction).colorValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillCircleInstruction).radiusValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillCircleInstruction).xValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillCircleInstruction).yValue.ID.toString(2), 16);
					break;
				}
				case InstructionType.DrawLine: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawLineInstruction).colorValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawLineInstruction).x1Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawLineInstruction).y1Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawLineInstruction).x2Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawLineInstruction).y2Value.ID.toString(2), 16);
					break;
				}
				case InstructionType.DrawPixel: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawPixelInstruction).colorValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawPixelInstruction).xValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawPixelInstruction).yValue.ID.toString(2), 16);
					break;
				}
				case InstructionType.DrawRect: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawRectInstruction).colorValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawRectInstruction).x1Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawRectInstruction).y1Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawRectInstruction).x2Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawRectInstruction).y2Value.ID.toString(2), 16);
					break;
				}
				case InstructionType.FillRect: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillRectInstruction).colorValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillRectInstruction).x1Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillRectInstruction).y1Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillRectInstruction).x2Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillRectInstruction).y2Value.ID.toString(2), 16);
					break;
				}
				case InstructionType.DrawText: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTextInstruction).colorValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTextInstruction).xValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTextInstruction).yValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTextInstruction).scaleValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTextInstruction).textValue.ID.toString(2), 16);
					break;
				}
				case InstructionType.DrawTriangle: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).colorValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).x1Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).y1Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).x2Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).y2Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).x3Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DrawTriangleInstruction).y3Value.ID.toString(2), 16);
					break;
				}
				case InstructionType.FillTriangle: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).colorValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).x1Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).y1Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).x2Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).y2Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).x3Value.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as FillTriangleInstruction).y3Value.ID.toString(2), 16);
					break;
				}
				case InstructionType.MutateValue: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as MutateValueInstruction).leftValue.ID.toString(2), 16);
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as MutateValueInstruction).rightValue.ID.toString(2), 16);
					break;
				}
				case InstructionType.RunCondition: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as RunConditionInstruction).evaluationValue.ID.toString(2), 16);
					if((this.instructions[Number(k)] as RunConditionInstruction).failSet) {
						tempBinaryString += this.makeLength((this.instructions[Number(k)] as RunConditionInstruction).failSet.ID.toString(2), 16);
					} else {
						tempBinaryString += '1111111111111111';
					}
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as RunConditionInstruction).successSet.ID.toString(2), 16);
					break;
				}
				case InstructionType.SetRotation: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as SetRotationInstruction).rotationValue.ID.toString(2), 16);
					break;
				}
				case InstructionType.RunSet: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as RunSetInstruction).set.ID.toString(2), 16);
					break;
				}
				case InstructionType.DebugLog: {
					tempBinaryString += this.makeLength((this.instructions[Number(k)] as DebugLogInstruction).logValue.ID.toString(2), 16);
					break;
				}
			}
    	});
    	binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
    	binaryString += tempBinaryString;
    	tempBinaryString = '';
    	const mainSet = this.instructionSets[this.mainInstructionSet];
    	tempBinaryString += this.makeLength(mainSet.ID.toString(2), 16);
    	tempBinaryString += this.makeLength(mainSet.size.toString(2), 16);
    	mainSet.instructions.forEach(i => {
    		tempBinaryString += this.makeLength(i.ID.toString(2), 16);
		});

		const renderSet = this.instructionSets[this.renderInstructionSet];
    	tempBinaryString += this.makeLength(renderSet.ID.toString(2), 16);
		tempBinaryString += this.makeLength(renderSet.size.toString(2), 16);

    	renderSet.instructions.forEach(i => {
    		tempBinaryString += this.makeLength(i.ID.toString(2), 16);
		});
    	Object.keys(this.instructionSets).filter(k => +k !== this.mainInstructionSet && +k !== this.renderInstructionSet).forEach(k => {
    		tempBinaryString += this.makeLength(this.instructionSets[Number(k)].ID.toString(2), 16);
    		tempBinaryString += this.makeLength(this.instructionSets[Number(k)].size.toString(2), 16);
    		this.instructionSets[Number(k)].instructions.forEach(i => {
    			tempBinaryString += this.makeLength(i.ID.toString(2), 16);
    		});
		});

    	binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
    	binaryString += tempBinaryString;
		const numbers = [];
    	let index = 0;
    	while (binaryString.length > 0) {
    		numbers[index] = parseInt(binaryString.substring(0, 8), 2);
    		binaryString = binaryString.substring(8);
    		index++;
    	}
		const bytes = Uint8Array.from(numbers);

    	return bytes;
    }
}
