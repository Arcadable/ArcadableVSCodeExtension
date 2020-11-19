import { NumberValueType } from './_numberValueType';
import { ValueType } from './value';
import { Arcadable } from '../arcadable';

export class DigitalInputValue extends NumberValueType {


    constructor(
        ID: number,
        public index: number,
        name: string,
        game: Arcadable
      ) {
          super(ID, ValueType.digitalInputPointer, name, game);
      }

    async get(): Promise<0|1> {
        return this.game.systemConfig.digitalInputValues[this.index];
    }

    async set(newValue: number) {

    }

    async isTruthy() {
        return await this.get() !== 0;
    }


}
