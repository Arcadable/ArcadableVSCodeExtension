import { Value, ValuePointer, ValueType } from './value';
import { Arcadable } from '../arcadable';
import { ValueArrayValueType } from './valueArrayValueType';
import { NumberValueType, NumberValueTypePointer } from './_numberValueType';
import { NumberArrayValueTypePointer } from './numberArrayValueType';
import { DataValue } from './dataValue';

export class ImageValue extends Value {


    constructor(
        ID: number,
        public data: NumberArrayValueTypePointer<DataValue>,
        public width: NumberValueTypePointer<NumberValueType>,
        public height: NumberValueTypePointer<NumberValueType>,
        public keyColor: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, ValueType.image, name, game);
    }



    async get(): Promise<{data: number[], width: number, height: number, keyColor: number}> {
        return {
            data: await this.data.getValue(),
            width: await this.width.getValue(),
            height: await this.height.getValue(),
            keyColor: await this.keyColor.getValue()
        };
    }

    async set(a: number[]) {
    }

    async isTruthy() {
        return true;
    }


}
