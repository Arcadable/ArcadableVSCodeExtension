import { NumberValueType, NumberValueTypePointer } from './NumberValueType';
import { ValueType } from './value';
import { Arcadable } from '../arcadable';

export enum EvaluationOperator {add, sub, mul, subdiv, mod, b_and, b_or, b_xor, lsh, rsh, pow, eq , ne, gt, lt, ge, le }
export const evaluationOperatorTypes = Object.keys(EvaluationOperator)
.filter(key => isNaN(Number(EvaluationOperator[key as any]))).map((value) => {
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
        return { viewValue: '', value: 0};
    }
});

export class EvaluationValue extends NumberValueType {

    private _LEFT!: NumberValueTypePointer<NumberValueType>;
    set left(value: NumberValueTypePointer<NumberValueType>) {
        this._LEFT = value;
        this.called = true;
    }
    get left(): NumberValueTypePointer<NumberValueType> {
        return this._LEFT;
    }

    private _RIGHT!: NumberValueTypePointer<NumberValueType>;
    set right(value: NumberValueTypePointer<NumberValueType>) {
        this._RIGHT = value;
        this.called = true;
    }
    get right(): NumberValueTypePointer<NumberValueType> {
        return this._RIGHT;
    }

    private _EVALUATION_OPERATOR!: EvaluationOperator;
    set evaluationOperator(value: EvaluationOperator) {
        this._EVALUATION_OPERATOR = value;
        this.called = true;
    }
    get evaluationOperator(): EvaluationOperator {
        return this._EVALUATION_OPERATOR;
    }

    private _STATIC = true;
    set isStatic(value: boolean) {
        this._STATIC = value;
        this.called = true;
    }
    get isStatic(): boolean {
        return this._STATIC;
    }
    _STATIC_RESULT: number | undefined;

    constructor(
      ID: number,
      left: NumberValueTypePointer<NumberValueType>,
      right: NumberValueTypePointer<NumberValueType>,
      evaluationOperator: EvaluationOperator,
      isStatic: boolean,
      name: string,
      game: Arcadable
    ) {
        super(ID, ValueType.evaluation, name, game);
        this.left = left;
        this.right = right;
        this.evaluationOperator = evaluationOperator;
        this.isStatic = isStatic;
    }

    get(executionOrder: number[]): number {
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
                result =  left - right;
                break;
            case EvaluationOperator.mul:
                result =  left * right;
                break;
            case EvaluationOperator.subdiv:
                result =  left / right;
                break;
            case EvaluationOperator.mod:
                result =  Math.floor(left) % Math.floor(right);
                break;
            case EvaluationOperator.b_and:
                result =  Math.floor(left) & Math.floor(right);
                break;
            case EvaluationOperator.b_or:
                result =  Math.floor(left) | Math.floor(right);
                break;
            case EvaluationOperator.b_xor:
                result =  Math.floor(left) ^ Math.floor(right);
                break;
            case EvaluationOperator.lsh:
                result =  Math.floor(left) << Math.floor(right);
                break;
            case EvaluationOperator.rsh:
                result =  Math.floor(left) >> Math.floor(right);
                break;
            case EvaluationOperator.pow:
                result =  Math.pow(left, right);
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
                result =  -1;
                break;
        }
        console.log('a ' + this.evaluationOperator);
        console.log('b ' + result);
        console.log('c ' + left);
        console.log('d ' + right);

        if (this.isStatic) {
            this._STATIC_RESULT = result;
        }
        return result;
    }

    set(newValue: number, executionOrder: number[]) {
        this.called = true;
        this.executionOrder = executionOrder;

        if (this.breakSet) {
            this.game.breakEncountered.next();
        }
    }

    isTruthy(executionOrder: number[]) {
        return this.get(executionOrder) !== 0;
    }

    stringify() {
      return JSON.stringify({
          ID: this.ID,
          name: this.name,
          type: this.type,
          evaluationOperator: this.evaluationOperator,
          left: this.left,
          right: this.right,
          isStatic: this.isStatic
      });
  }
}
