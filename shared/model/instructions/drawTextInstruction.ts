import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { TextValue } from '../values/textValue';
import { Instruction, InstructionType } from './instruction';
import { ValueArrayValueTypePointer } from '../values/valueArrayValueType';
import { ValuePointer, Value } from '../values/value';
import { Executable } from '../callStack';

export class DrawTextInstruction extends Instruction {

    constructor(
        ID: number,
        public colorValue: NumberValueTypePointer<NumberValueType>,
        public scaleValue: NumberValueTypePointer<NumberValueType>,
        public textValue: ValueArrayValueTypePointer<TextValue<NumberValueType>>,
        public xValue: NumberValueTypePointer<NumberValueType>,
        public yValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.DrawText, name, game, await);
    }


    async getExecutables(async: boolean): Promise<Executable[]> {

        return [new Executable(async () => {
            let [
                pixelTextX,
                pixelTextY,
                scale,
                textColor,
                text,
            ] = await Promise.all([
                this.xValue.getValue(),
                this.yValue.getValue(),
                this.scaleValue.getValue(),
                this.colorValue.getValue(),
                this.textValue.getValue()
            ]);
            const textvalue = await (text as ValuePointer<NumberValueType>[]).reduce(async (acc, curr) => {
                return (await acc) + String.fromCharCode(await curr.getValue());
            }, new Promise<string>(res => res('')));
            this.game.instructionEmitter.next({
                command: 'drawText',
                pixelTextX,
                pixelTextY,
                scale,
                textColor,
                textvalue,
            });
            return [];
        }, async, false, [], null, null)];
    }

}
