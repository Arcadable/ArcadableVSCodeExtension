import { Arcadable } from '../arcadable';
import { LogicElement } from '../logicElement';

export enum ValueType {
    number,
    pixelIndex,
    digitalInputPointer,
    analogInputPointer,
    systemPointer,
    list,
    text,
    evaluation,
}
export const valueTypes = Object.keys(ValueType).filter(key => isNaN(Number(ValueType[key as any]))).map((value) => {
	switch (Number(value)) {
		case ValueType.number:
			return { viewValue: 'Number', codeValue: 'Number', value: Number(value) };
		case ValueType.pixelIndex:
			return { viewValue: 'Pixel', codeValue: 'Pixel', value: Number(value) };
		case ValueType.digitalInputPointer:
			return { viewValue: 'Digital input pointer', codeValue: 'Digital', value: Number(value) };
		case ValueType.analogInputPointer:
			return { viewValue: 'Analog input pointer', codeValue: 'Analog', value: Number(value) };
		case ValueType.systemPointer:
			return { viewValue: 'System value pointer', codeValue: 'Config', value: Number(value) };
		case ValueType.list:
			return { viewValue: 'List value pointer', codeValue: 'List<>', value: Number(value) };
		case ValueType.text:
			return { viewValue: 'Text', codeValue: 'String', value: Number(value) };
		case ValueType.evaluation:
			return { viewValue: 'Evaluation', codeValue: 'Eval', value: Number(value) };
		default:
			return { viewValue: '', value: 0};
	}
});

export abstract class Value extends LogicElement {

    private _TYPE!: ValueType;
    set type(value: ValueType) {
    	this._TYPE = value;
    	this.called = true;
    }
    get type(): ValueType {
    	return this._TYPE;
    }

    constructor(
    	ID: number,
    	type: ValueType,
    	name: string,
    	game: Arcadable
    ) {
    	super(ID, name, game);
    	this.type = type;
    }

    abstract get(executionOrder: number[]): any;
    abstract set(newValue: any, executionOrder: number[]): void;
    abstract isTruthy(executionOrder: number[]): boolean;

    stringify() {
    	return JSON.stringify({
    		ID: this.ID,
    		name: this.name,
    		type: this.type,
    	});
    }
}

export abstract class ValuePointer<T extends Value> {
    ID: number;
    game: Arcadable;
    constructor(ID: number, game: Arcadable) {
    	this.ID = ID;
    	this.game = game;
    }
    abstract getObject(executionOrder: number[]): T;
    abstract getValue(executionOrder: number[]): any;
}
