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
import { ImageValue } from './values/imageValue';
import { DataValue } from './values/dataValue';
import { SetRotationInstruction } from './instructions/setRotationInstruction';
import { RunSetInstruction } from './instructions/runSetInstruction';
import { ValueArrayValueType } from './values/valueArrayValueType';
import { NumberValueType } from './values/_numberValueType';
import { DebugLogInstruction } from './instructions/debugLogInstruction';
import { DrawImageInstruction } from './instructions/drawImageInstruction';

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
		
		let tempBinaryString = Object.keys(this.values).filter(k => this.values[Number(k)].type === ValueType.analogInputPointer).reduce((acc, curr) =>
			acc +
			this.makeLength(this.values[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as AnalogInputValue).index.toString(2), 8)
			,
			this.makeLength(ValueType.analogInputPointer.toString(2), 8)
		);
    	if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
    		binaryString += tempBinaryString;
		}
		
		tempBinaryString = Object.keys(this.values).filter(k => this.values[Number(k)].type === ValueType.digitalInputPointer).reduce((acc, curr) =>
			acc +
			this.makeLength(this.values[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as DigitalInputValue).index.toString(2), 8)
			,
			this.makeLength(ValueType.digitalInputPointer.toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}
		
		tempBinaryString = Object.keys(this.values).filter(k => this.values[Number(k)].type === ValueType.evaluation).reduce((acc, curr) =>
			acc +
			this.makeLength(this.values[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as EvaluationValue).evaluationOperator.toString(2), 7) +
			((this.values[Number(curr)] as EvaluationValue).isStatic ? '1' : '0') +
			this.makeLength((this.values[Number(curr)] as EvaluationValue).left.ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as EvaluationValue).right.ID.toString(2), 16)
			,
			this.makeLength(ValueType.evaluation.toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}
		
		tempBinaryString = Object.keys(this.values).filter(k => this.values[Number(k)].type === ValueType.listDeclaration).reduce((acc, curr) =>
			acc +
			this.makeLength(this.values[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as ListDeclaration<Value>).size.toString(2), 16) +
			(this.values[Number(curr)] as ListDeclaration<Value>).values.reduce((a, c) => a + this.makeLength(c.ID.toString(2), 16), '')
			,
			this.makeLength(ValueType.listDeclaration.toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}
		
		tempBinaryString = Object.keys(this.values).filter(k => this.values[Number(k)].type === ValueType.listValue).reduce((acc, curr) =>
			acc +
			this.makeLength(this.values[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as ListValue<ValueArrayValueType, number | number[]>).listValue.ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as ListValue<ValueArrayValueType, number | number[]>).listIndex.ID.toString(2), 16)
			,
			this.makeLength(ValueType.listValue.toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}
		
		tempBinaryString = Object.keys(this.values).filter(k => this.values[Number(k)].type === ValueType.number).reduce((acc, curr) => {
				const output: number[] = [];
				fp.writeFloatBE(output, (this.values[Number(curr)] as NumberValue).value);
				return acc +
					this.makeLength(this.values[Number(curr)].ID.toString(2), 16) +
					output.reduce((a, c) => a + this.makeLength(c.toString(2), 8), '');
			},
			this.makeLength(ValueType.number.toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}
		
		tempBinaryString = Object.keys(this.values).filter(k => this.values[Number(k)].type === ValueType.pixelIndex).reduce((acc, curr) =>
			acc +
			this.makeLength(this.values[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as PixelValue).XCalc.ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as PixelValue).YCalc.ID.toString(2), 16)
			,
			this.makeLength(ValueType.pixelIndex.toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.values).filter(k => this.values[Number(k)].type === ValueType.image).reduce((acc, curr) =>
			acc +
			this.makeLength(this.values[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as ImageValue).data.ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as ImageValue).width.ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as ImageValue).height.ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as ImageValue).keyColor.ID.toString(2), 16)
			,
			this.makeLength(ValueType.image.toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}
	
		tempBinaryString = Object.keys(this.values).filter(k => this.values[Number(k)].type === ValueType.data).reduce((acc, curr) =>
			acc +
			this.makeLength(this.values[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as DataValue).size.toString(2), 16) +
			((this.values[Number(curr)]as DataValue).data as number[]).reduce((a, c) => a + this.makeLength(c.toString(2), 8), '')
			,
			this.makeLength(ValueType.data.toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}
	
		tempBinaryString = Object.keys(this.values).filter(k => this.values[Number(k)].type === ValueType.systemPointer).reduce((acc, curr) =>
			acc +
			this.makeLength(this.values[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as SystemConfigValue).configType.toString(2), 8)
			,
			this.makeLength(ValueType.systemPointer.toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}
		
		tempBinaryString = Object.keys(this.values).filter(k => this.values[Number(k)].type === ValueType.text).reduce((acc, curr) =>
			acc +
			this.makeLength(this.values[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.values[Number(curr)] as TextValue<NumberValueType>).size.toString(2), 8) +
			(this.values[Number(curr)]as TextValue<NumberValueType>).values.reduce((a, c) => a + this.makeLength(c.ID.toString(2), 16), '')
			,
			this.makeLength(ValueType.text.toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.Clear).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16)
			,
			this.makeLength((InstructionType.Clear + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.DrawCircle).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawCircleInstruction).colorValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawCircleInstruction).radiusValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawCircleInstruction).xValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawCircleInstruction).yValue.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.DrawCircle + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.FillCircle).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillCircleInstruction).colorValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillCircleInstruction).radiusValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillCircleInstruction).xValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillCircleInstruction).yValue.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.FillCircle + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.DrawLine).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawLineInstruction).colorValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawLineInstruction).x1Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawLineInstruction).y1Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawLineInstruction).x2Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawLineInstruction).y2Value.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.DrawLine + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.DrawPixel).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawPixelInstruction).colorValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawPixelInstruction).xValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawPixelInstruction).yValue.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.DrawPixel + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.DrawRect).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawRectInstruction).colorValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawRectInstruction).x1Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawRectInstruction).y1Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawRectInstruction).x2Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawRectInstruction).y2Value.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.DrawRect + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.FillRect).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillRectInstruction).colorValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillRectInstruction).x1Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillRectInstruction).y1Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillRectInstruction).x2Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillRectInstruction).y2Value.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.FillRect + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.DrawText).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTextInstruction).colorValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTextInstruction).xValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTextInstruction).yValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTextInstruction).scaleValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTextInstruction).textValue.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.DrawText + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.DrawTriangle).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTriangleInstruction).colorValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTriangleInstruction).x1Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTriangleInstruction).y1Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTriangleInstruction).x2Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTriangleInstruction).y2Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTriangleInstruction).x3Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawTriangleInstruction).y3Value.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.DrawTriangle + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.FillTriangle).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillTriangleInstruction).colorValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillTriangleInstruction).x1Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillTriangleInstruction).y1Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillTriangleInstruction).x2Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillTriangleInstruction).y2Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillTriangleInstruction).x3Value.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as FillTriangleInstruction).y3Value.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.FillTriangle + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.DrawImage).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawImageInstruction).xValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawImageInstruction).yValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DrawImageInstruction).imageValue.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.DrawImage + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.MutateValue).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as MutateValueInstruction).leftValue.ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as MutateValueInstruction).rightValue.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.MutateValue + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.RunCondition).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as RunConditionInstruction).evaluationValue.ID.toString(2), 16) +
			((this.instructions[Number(curr)] as RunConditionInstruction).failSet ? this.makeLength((this.instructions[Number(curr)] as RunConditionInstruction).failSet.ID.toString(2), 16) : '1111111111111111') +
			this.makeLength((this.instructions[Number(curr)] as RunConditionInstruction).successSet.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.RunCondition + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.SetRotation).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as SetRotationInstruction).rotationValue.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.SetRotation + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.RunSet).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as RunSetInstruction).set.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.RunSet + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

		tempBinaryString = Object.keys(this.instructions).filter(k => this.instructions[Number(k)].instructionType === InstructionType.DebugLog).reduce((acc, curr) =>
			acc +
			this.makeLength(this.instructions[Number(curr)].ID.toString(2), 16) +
			this.makeLength((this.instructions[Number(curr)] as DebugLogInstruction).logValue.ID.toString(2), 16)
			,
			this.makeLength((InstructionType.DebugLog + 128).toString(2), 8)
		);
		if(tempBinaryString.length > 8) {
			binaryString += this.makeLength((tempBinaryString.length / 8).toString(2), 16);
			binaryString += tempBinaryString;
		}

    	const mainSet = this.instructionSets[this.mainInstructionSet];
		const renderSet = this.instructionSets[this.renderInstructionSet];
		tempBinaryString = this.makeLength((InstructionType.InstructionSet + 128).toString(2), 8) +
			this.makeLength(mainSet.ID.toString(2), 16) +
			this.makeLength(mainSet.size.toString(2), 16) +
			mainSet.instructions.reduce((a, c) => a + this.makeLength(c.ID.toString(2), 16), '') +
			this.makeLength(renderSet.ID.toString(2), 16) +
			this.makeLength(renderSet.size.toString(2), 16) +
			renderSet.instructions.reduce((a, c) => a + this.makeLength(c.ID.toString(2), 16), '') +
			Object.keys(this.instructionSets).filter(k => +k !== this.mainInstructionSet && +k !== this.renderInstructionSet).reduce((acc, curr) =>
				acc +
				this.makeLength(this.instructionSets[Number(curr)].ID.toString(2), 16) +
				this.makeLength(this.instructionSets[Number(curr)].size.toString(2), 16) +
				this.instructionSets[Number(curr)].instructions.reduce((a, c) => a + this.makeLength(c.ID.toString(2), 16), '')
				,
				''
			);
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
