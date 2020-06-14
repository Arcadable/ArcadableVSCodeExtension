import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from './_numberValueType';
import { Value, ValueType } from './value';
import { ValueArrayValueTypePointer, ValueArrayValueType } from './valueArrayValueType';

export class ListValue<T1 extends ValueArrayValueType, T2 = number | number[]> extends Value {


    constructor(
        ID: number,
        public listValue: ValueArrayValueTypePointer<T1>,
        public listIndex: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, ValueType.listValue, name, game);
    }

    async get(): Promise<T2> {
        const index = await this.listIndex.getValue();
        if (index >= 0 && index < this.listValue.getObject().size)  {
            const v = (await this.listValue.getValue())[index];
            return await v.getValue();
        } else {
            this.game.stop({message: 'Index out of bounds! (index = ' + index + ', size = ' + this.listValue.getObject().size + ')', values: [this.listIndex.ID, this.listValue.ID], instructions: []});
            return null as unknown as T2;
        }
    }

    async set(newValue: T2) {
        const index = await this.listIndex.getValue();
        if (index >= 0 && index < this.listValue.getObject().size)  {
            const v = (await this.listValue.getValue())[index];
            return await v.getObject().set(newValue);
        } else {
            this.game.stop({message: 'Index out of bounds!', values: [this.listIndex.ID, this.listValue.ID], instructions: []});
            return;
        }
    }
    async isTruthy() {
        const index = await this.listIndex.getValue();
        const v = (await this.listValue.getValue())[index];
        return await v.getObject().isTruthy();
    }

    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            listValue: this.listValue,
            listIndex: this.listIndex,
        });
    }
}
