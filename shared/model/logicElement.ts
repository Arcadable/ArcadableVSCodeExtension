import { Arcadable } from './arcadable';
import { Subject } from 'rxjs';

export class LogicElement {

    constructor(
        public ID: number,
        public name: string,
        public game: Arcadable
    ) {
 
    }

    getName() {
        if (this.name !== undefined && this.name.length !== 0) {
            return this.name;
        } else {
            return this.ID;
        }
    }

}
