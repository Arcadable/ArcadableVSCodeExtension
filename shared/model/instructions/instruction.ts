import { Arcadable } from '../arcadable';
import { LogicElement } from '../logicElement';

export enum InstructionType {
    MutateValue,
    RunCondition,
    DrawPixel,
    DrawLine,
    DrawRect,
    FillRect,
    DrawCircle,
    FillCircle,
    DrawTriangle,
    FillTriangle,
    DrawText,
    Clear,
    SetRotation,
    RunSet,
}
export const instructionTypes = Object.keys(InstructionType)
	.filter(key => isNaN(Number(InstructionType[key as any]))).map((value) => {
		switch (Number(value)) {
			case InstructionType.MutateValue:
				return { viewValue: 'Mutate value', codeValue: null, value: Number(value) };
			case InstructionType.RunCondition:
				return { viewValue: 'Run condition', codeValue: `if () {

}`, value: Number(value) };
			case InstructionType.DrawPixel:
				return { viewValue: 'Draw pixel', codeValue: null, value: Number(value) };
			case InstructionType.DrawLine:
				return { viewValue: 'Draw line', codeValue: 'draw.drawLine(color, x1, y1, x2, y2);', value: Number(value) };
			case InstructionType.DrawRect:
				return { viewValue: 'Draw rect', codeValue: 'draw.drawRect(color, tlX, tlY, brX, brY);', value: Number(value) };
			case InstructionType.FillRect:
				return { viewValue: 'Fill rect', codeValue: 'draw.fillRect(color, tlX, tlY, brX, brY);', value: Number(value) };
			case InstructionType.DrawCircle:
				return { viewValue: 'Draw circle', codeValue: 'draw.drawCircle(color, radius, x, y);', value: Number(value) };
			case InstructionType.FillCircle:
				return { viewValue: 'Fill circle', codeValue: 'draw.fillCircle(color, radius, x, y);', value: Number(value) };
			case InstructionType.DrawTriangle:
				return { viewValue: 'Draw triangle', codeValue: 'draw.drawTriangle(color, x1, y1, x2, y2, x3, y3);', value: Number(value) };
			case InstructionType.FillTriangle:
				return { viewValue: 'Fill triangle', codeValue: 'draw.fillTriangle(color, x1, y1, x2, y2, x3, y3);', value: Number(value) };
			case InstructionType.DrawText:
				return { viewValue: 'Draw text', codeValue: null, value: Number(value) };
			case InstructionType.Clear:
				return { viewValue: 'Clear', codeValue: 'draw.clear;', value: Number(value) };
			case InstructionType.SetRotation:
				return { viewValue: 'Set rotation', codeValue: 'draw.setRotation(rotation);', value: Number(value) };
			case InstructionType.RunSet:
				return { viewValue: 'Run instructionset', codeValue: 'execute();', value: Number(value) };
			default:
				return { viewValue: '', value: 0};
		}
	});
export abstract class Instruction extends LogicElement {

    private _INSTRUCTION_TYPE: InstructionType = 0;
    set instructionType(value: InstructionType) {
    	this._INSTRUCTION_TYPE = value;
    	this.called = true;
    }
    get instructionType(): InstructionType {
    	return this._INSTRUCTION_TYPE;
    }

    constructor(
    	ID: number,
    	instructionType: InstructionType,
    	page: number,
    	name: string,
    	game: Arcadable
    ) {
    	super(ID, page, name, game);
    	this.instructionType = instructionType;
    }

    abstract execute(executionOrder: number[]): ((executionOrder: number[]) => any)[];

    stringify() {
    	return JSON.stringify({
    		ID: this.ID,
    		name: this.name,
    		instructionType: this.instructionType,
    		page: this.page,
    	});
    }
}
export class InstructionPointer {
    ID: number;
    game: Arcadable;
    constructor(ID: number, game: Arcadable) {
    	this.ID = ID;
    	this.game = game;
    }
    execute(executionOrder: number[]) {
    	return this.game.instructions[this.ID].execute(executionOrder);
    }
}
