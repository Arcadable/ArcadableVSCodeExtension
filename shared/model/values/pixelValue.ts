import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from './_numberValueType';
import { ValueType } from './value';

export class PixelValue extends NumberValueType {

    constructor(
        ID: number,
        public XCalc: NumberValueTypePointer<NumberValueType>,
        public YCalc: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable
    ) {
        super(ID, ValueType.pixelIndex, name, game);
    }


    async get(): Promise<number> {
        const x = await this.XCalc.getValue();
        const y = await this.YCalc.getValue();

        const color = await new Promise<number>((res, rej) => {
            this.game.instructionEmitter.next({
                command: 'getPixel',
                x,
                y,
                callback: (color: number) => {
                    res(color);
                }
            })
        });
        return color;
    }

    async set(newValue: number) {
        const x = await this.XCalc.getValue();
        const y = await this.YCalc.getValue();
        this.game.instructionEmitter.next({
            command: 'drawPixel',
            x,
            y,
            pixelColor: newValue,
        });
    }
    async isTruthy() {
        return (await this.get()) !== 0;
    }


}
