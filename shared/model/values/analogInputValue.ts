import { NumberValueType } from './_numberValueType';
import { ValueType } from './value';
import { Arcadable } from '../arcadable';

export class AnalogInputValue extends NumberValueType {

    constructor(
        ID: number,
        public index: number,
        name: string,
        game: Arcadable
      ) {
          super(ID, ValueType.analogInputPointer, name, game);
      }

    async get(): Promise<number> {
        return this.game.systemConfig.analogInputValues[this.index];
    }

    async set(newValue: number) {
    }
    async isTruthy() {
        return await this.get() !== 0;
    }

}
