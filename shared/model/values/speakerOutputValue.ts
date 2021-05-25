import { NumberValueType } from './_numberValueType';
import { ValueType } from './value';
import { Arcadable } from '../arcadable';

export class SpeakerOutputValue extends NumberValueType {

    constructor(
        ID: number,
        public index: number,
        name: string,
        game: Arcadable
      ) {
          super(ID, ValueType.speakerOutputPointer, name, game);
      }

    async get(): Promise<number> {
        return this.index;
    }

    async set(newValue: number) {
        this.game.instructionEmitter.next({
            command: 'tone',
            volume: 1,
            frequency: newValue,
            duration: 1000
        });
    }
    async isTruthy() {
        return await this.get() !== 0;
    }

}
