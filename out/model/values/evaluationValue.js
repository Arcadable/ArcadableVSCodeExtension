"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NumberValueType_1 = require("./NumberValueType");
var EvaluationOperator;
(function (EvaluationOperator) {
    EvaluationOperator[EvaluationOperator["add"] = 0] = "add";
    EvaluationOperator[EvaluationOperator["sub"] = 1] = "sub";
    EvaluationOperator[EvaluationOperator["mul"] = 2] = "mul";
    EvaluationOperator[EvaluationOperator["subdiv"] = 3] = "subdiv";
    EvaluationOperator[EvaluationOperator["mod"] = 4] = "mod";
    EvaluationOperator[EvaluationOperator["b_and"] = 5] = "b_and";
    EvaluationOperator[EvaluationOperator["b_or"] = 6] = "b_or";
    EvaluationOperator[EvaluationOperator["b_xor"] = 7] = "b_xor";
    EvaluationOperator[EvaluationOperator["lsh"] = 8] = "lsh";
    EvaluationOperator[EvaluationOperator["rsh"] = 9] = "rsh";
    EvaluationOperator[EvaluationOperator["pow"] = 10] = "pow";
    EvaluationOperator[EvaluationOperator["eq"] = 11] = "eq";
    EvaluationOperator[EvaluationOperator["ne"] = 12] = "ne";
    EvaluationOperator[EvaluationOperator["gt"] = 13] = "gt";
    EvaluationOperator[EvaluationOperator["lt"] = 14] = "lt";
    EvaluationOperator[EvaluationOperator["ge"] = 15] = "ge";
    EvaluationOperator[EvaluationOperator["le"] = 16] = "le";
})(EvaluationOperator = exports.EvaluationOperator || (exports.EvaluationOperator = {}));
exports.evaluationOperatorTypes = Object.keys(EvaluationOperator)
    .filter(key => isNaN(Number(EvaluationOperator[key]))).map((value) => {
    switch (Number(value)) {
        case EvaluationOperator.add:
            return { viewValue: '+', value: Number(value) };
        case EvaluationOperator.sub:
            return { viewValue: '-', value: Number(value) };
        case EvaluationOperator.mul:
            return { viewValue: '*', value: Number(value) };
        case EvaluationOperator.subdiv:
            return { viewValue: '/', value: Number(value) };
        case EvaluationOperator.mod:
            return { viewValue: '%', value: Number(value) };
        case EvaluationOperator.b_and:
            return { viewValue: '&', value: Number(value) };
        case EvaluationOperator.b_or:
            return { viewValue: '|', value: Number(value) };
        case EvaluationOperator.b_xor:
            return { viewValue: '^', value: Number(value) };
        case EvaluationOperator.lsh:
            return { viewValue: '<<', value: Number(value) };
        case EvaluationOperator.rsh:
            return { viewValue: '>>', value: Number(value) };
        case EvaluationOperator.pow:
            return { viewValue: 'pow', value: Number(value) };
        case EvaluationOperator.eq:
            return { viewValue: '==', value: Number(value) };
        case EvaluationOperator.ne:
            return { viewValue: '!=', value: Number(value) };
        case EvaluationOperator.gt:
            return { viewValue: '>', value: Number(value) };
        case EvaluationOperator.lt:
            return { viewValue: '<', value: Number(value) };
        case EvaluationOperator.ge:
            return { viewValue: '>=', value: Number(value) };
        case EvaluationOperator.le:
            return { viewValue: '<=', value: Number(value) };
        default:
            return { viewValue: '', value: 0 };
    }
});
class EvaluationValue extends NumberValueType_1.NumberValueType {
    constructor(ID, type, page, left, right, evaluationOperator, isStatic, name, game) {
        super(ID, type, page, name, game);
        this._STATIC = true;
        this.left = left;
        this.right = right;
        this.evaluationOperator = evaluationOperator;
        this.isStatic = isStatic;
    }
    set left(value) {
        this._LEFT = value;
        this.called = true;
    }
    get left() {
        return this._LEFT;
    }
    set right(value) {
        this._RIGHT = value;
        this.called = true;
    }
    get right() {
        return this._RIGHT;
    }
    set evaluationOperator(value) {
        this._EVALUATION_OPERATOR = value;
        this.called = true;
    }
    get evaluationOperator() {
        return this._EVALUATION_OPERATOR;
    }
    set isStatic(value) {
        this._STATIC = value;
        this.called = true;
    }
    get isStatic() {
        return this._STATIC;
    }
    get(executionOrder) {
        this.called = true;
        this.executionOrder = executionOrder;
        if (this.isStatic && this._STATIC_RESULT !== undefined) {
            return this._STATIC_RESULT;
        }
        const left = this.left.getValue(executionOrder);
        const right = this.right.getValue(executionOrder);
        let result;
        switch (this.evaluationOperator) {
            case EvaluationOperator.add:
                result = left + right;
                break;
            case EvaluationOperator.sub:
                result = left - right;
                break;
            case EvaluationOperator.mul:
                result = left * right;
                break;
            case EvaluationOperator.subdiv:
                result = left / right;
                break;
            case EvaluationOperator.mod:
                result = Math.floor(left) % Math.floor(right);
                break;
            case EvaluationOperator.b_and:
                result = Math.floor(left) & Math.floor(right);
                break;
            case EvaluationOperator.b_or:
                result = Math.floor(left) | Math.floor(right);
                break;
            case EvaluationOperator.b_xor:
                result = Math.floor(left) ^ Math.floor(right);
                break;
            case EvaluationOperator.lsh:
                result = Math.floor(left) << Math.floor(right);
                break;
            case EvaluationOperator.rsh:
                result = Math.floor(left) >> Math.floor(right);
                break;
            case EvaluationOperator.pow:
                result = Math.pow(left, right);
                break;
            case EvaluationOperator.eq:
                result = (left === right) ? 1 : 0;
                break;
            case EvaluationOperator.ne:
                result = (left !== right) ? 1 : 0;
                break;
            case EvaluationOperator.gt:
                result = (left > right) ? 1 : 0;
                break;
            case EvaluationOperator.lt:
                result = (left < right) ? 1 : 0;
                break;
            case EvaluationOperator.ge:
                result = (left >= right) ? 1 : 0;
                break;
            case EvaluationOperator.le:
                result = (left <= right) ? 1 : 0;
                break;
            default:
                result = -1;
                break;
        }
        if (this.isStatic) {
            this._STATIC_RESULT = result;
        }
        return result;
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
            evaluationOperator: this.evaluationOperator,
            left: this.left,
            right: this.right,
            isStatic: this.isStatic
        });
    }
}
exports.EvaluationValue = EvaluationValue;
//# sourceMappingURL=evaluationValue.js.map