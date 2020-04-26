import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from '../values/NumberValueType';
import { Instruction, InstructionType } from './instruction';

export class SetRotationInstruction extends Instruction {

    private _ROTATION_VALUE!: NumberValueTypePointer<NumberValueType>;
    set rotationValue(value: NumberValueTypePointer<NumberValueType>) {
        this._ROTATION_VALUE = value;
        this.called = true;
    }
    get rotationValue(): NumberValueTypePointer<NumberValueType> {
        return this._ROTATION_VALUE;
    }

    constructor(
        ID: number,
        instructionType: InstructionType,
        page: number,
        rotationValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, instructionType, page, name, game);
        this.rotationValue = rotationValue;
    }


    execute(executionOrder: number[]): ((executionOrder: number[]) => any)[] {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        const rotation = this.rotationValue.getValue(executionOrder);

        return [ (e: number[]) => {
            this.game.drawInstruction.next({
                command: 'drawCircle',
                rotation,
            });
        }];
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            instructionType: this.instructionType,
            page: this.page,
            rotationValue: this.rotationValue,
        });
    }
}
