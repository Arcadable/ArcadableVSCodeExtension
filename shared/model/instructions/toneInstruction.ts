import { SpeakerOutputValue } from './../values/speakerOutputValue';
import { Executable } from './../callStack';
import { Arcadable } from '../arcadable';
import { NumberValueType, NumberValueTypePointer } from '../values/_numberValueType';
import { Instruction, InstructionType } from './instruction';

export class ToneInstruction extends Instruction {

    constructor(
        ID: number,
        public speakerOutputValue: NumberValueTypePointer<SpeakerOutputValue>,
        public volumeValue: NumberValueTypePointer<NumberValueType>,
        public frequencyValue: NumberValueTypePointer<NumberValueType>,
        public durationValue: NumberValueTypePointer<NumberValueType>,
        name: string,
        game: Arcadable,
		public await: boolean,
    ) {
        super(ID, InstructionType.Tone, name, game, await);
    }


    async getExecutables(async: boolean): Promise<Executable[]> {
        return [new Executable(async () => {
            let volume = await this.volumeValue.getValue();
            let frequency = await this.frequencyValue.getValue();
            const duration = await this.durationValue.getValue();
            
            if(volume > 1) {
                volume = 1;
            } else if( volume < 0) {
                volume = 0;
            }
            if( frequency < 1) {
                frequency = 1;
            }
            this.game.instructionEmitter.next({
                command: 'tone',
                volume,
                frequency,
                duration,
                speaker: this.speakerOutputValue.getObject().index
            });
            return [];
        }, async, false, [], null, null)];
    }

}
