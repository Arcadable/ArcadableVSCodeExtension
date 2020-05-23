import { Arcadable } from './arcadable';
import { Subject } from 'rxjs';

export class LogicElement {
    game: Arcadable;
    called: boolean = false;
    executionOrder: number[] = [];
    breakSet: boolean = false;

    private _ID!: number;
    set ID(value: number) {
        this._ID = value;
        this.called = true;
    }
    get ID(): number {
        return this._ID;
    }

    private _NAME!: string;
    set name(value: string) {
        this._NAME = value;
        this.called = true;
    }
    get name(): string {
        return this._NAME;
    }


    constructor(
        ID: number,
        name: string,
        game: Arcadable
    ) {
        this.ID = ID;
        this.name = name;
        this.game = game;
    }

    getName() {
        if (this.name !== undefined && this.name.length !== 0) {
            return this.name;
        } else {
            return this.ID;
        }
    }

}
