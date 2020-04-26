"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LogicElement {
    constructor(ID, page, name, game) {
        this.called = false;
        this.executionOrder = [];
        this.breakSet = false;
        this.ID = ID;
        this.name = name;
        this.page = page;
        this.game = game;
    }
    set ID(value) {
        this._ID = value;
        this.called = true;
    }
    get ID() {
        return this._ID;
    }
    set name(value) {
        this._NAME = value;
        this.called = true;
    }
    get name() {
        return this._NAME;
    }
    getName() {
        if (this.name !== undefined && this.name.length !== 0) {
            return this.name;
        }
        else {
            return this.ID;
        }
    }
}
exports.LogicElement = LogicElement;
//# sourceMappingURL=logicElement.js.map