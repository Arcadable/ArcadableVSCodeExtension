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
    SetRotation
}
export const instructionTypes = Object.keys(InstructionType)
.filter(key => isNaN(Number(InstructionType[key as any]))).map((value) => {
    switch (Number(value)) {
        case InstructionType.MutateValue:
            return { viewValue: 'Mutate value', value: Number(value) };
        case InstructionType.RunCondition:
            return { viewValue: 'Run condition', value: Number(value) };
        case InstructionType.DrawPixel:
            return { viewValue: 'Draw pixel', value: Number(value) };
        case InstructionType.DrawLine:
            return { viewValue: 'Draw line', value: Number(value) };
        case InstructionType.DrawRect:
            return { viewValue: 'Draw rect', value: Number(value) };
        case InstructionType.FillRect:
            return { viewValue: 'Fill rect', value: Number(value) };
        case InstructionType.DrawCircle:
            return { viewValue: 'Draw circle', value: Number(value) };
        case InstructionType.FillCircle:
            return { viewValue: 'Fill circle', value: Number(value) };
        case InstructionType.DrawTriangle:
            return { viewValue: 'Draw triangle', value: Number(value) };
        case InstructionType.FillTriangle:
            return { viewValue: 'Fill triangle', value: Number(value) };
        case InstructionType.DrawText:
            return { viewValue: 'Draw text', value: Number(value) };
        case InstructionType.Clear:
            return { viewValue: 'Clear', value: Number(value) };
        case InstructionType.SetRotation:
            return { viewValue: 'Set rotation', value: Number(value) };
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
