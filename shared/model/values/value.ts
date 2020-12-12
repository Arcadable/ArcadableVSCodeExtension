import { Arcadable } from '../arcadable';
import { LogicElement } from '../logicElement';

export enum ValueType {
    number,
    pixelIndex,
    digitalInputPointer,
    analogInputPointer,
    systemPointer,
	listDeclaration,
	listValue,
    text,
	evaluation,
	image,
	data
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
		case ValueType.listValue:
			return { viewValue: 'List value pointer', codeValue: 'ListValue', value: Number(value) };
		case ValueType.listDeclaration:
			return { viewValue: 'List declaration', codeValue: 'List<>', value: Number(value) };
		case ValueType.text:
			return { viewValue: 'Text', codeValue: 'String', value: Number(value) };
		case ValueType.evaluation:
			return { viewValue: 'Evaluation', codeValue: 'Eval', value: Number(value) };
		case ValueType.image:
			return { viewValue: 'Image', codeValue: 'Image', value: Number(value) };
		case ValueType.data:
			return { viewValue: 'Data', codeValue: 'Data', value: Number(value) };
		default:
			return { viewValue: '', value: 0};
	}
});

export abstract class Value extends LogicElement {

    constructor(
    	ID: number,
    	public type: ValueType,
    	name: string,
    	game: Arcadable
    ) {
    	super(ID, name, game);
    }

    abstract get(): Promise<any>;
    abstract set(newValue: any): Promise<void>;
    abstract isTruthy(): Promise<boolean>;

}

export abstract class ValuePointer<T extends Value> {
    ID: number;
    game: Arcadable;
    constructor(ID: number, game: Arcadable) {
    	this.ID = ID;
    	this.game = game;
    }
    abstract getObject(): T;
    abstract getValue(): Promise<any>;
}
