"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NumberValueType_1 = require("./NumberValueType");
class SystemConfigValue extends NumberValueType_1.NumberValueType {
    constructor(ID, type, page, configType, name, game) {
        super(ID, type, page, name, game);
        this.configType = configType;
    }
    set configType(value) {
        this._CONFIG_TYPE = value;
        this.called = true;
    }
    get configType() {
        return this._CONFIG_TYPE;
    }
    get(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
        return this.game.systemConfig.get(this.configType);
    }
    set(newValue, executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
    }
    isTruthy(executionOrder) {
        return this.get(executionOrder) !== 0;
    }
    stringify() {
        return JSON.stringify({
            ID: this.ID,
            name: this.name,
            type: this.type,
            page: this.page,
            configType: this.configType
        });
    }
}
exports.SystemConfigValue = SystemConfigValue;
//# sourceMappingURL=systemConfigValue.js.map