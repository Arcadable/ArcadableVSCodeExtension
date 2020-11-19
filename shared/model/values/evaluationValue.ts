import { NumberValueType, NumberValueTypePointer } from './_numberValueType';
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

    _STATIC_RESULT: number | undefined;

    constructor(
      ID: number,
      public left: NumberValueTypePointer<NumberValueType>,
      public right: NumberValueTypePointer<NumberValueType>,
      public evaluationOperator: EvaluationOperator,
      public isStatic: boolean,
      name: string,
      game: Arcadable
    ) {
        super(ID, ValueType.evaluation, name, game);
    }

    async get(): Promise<number> {
        if (this.isStatic && this._STATIC_RESULT !== undefined) {
            return this._STATIC_RESULT;
        }
        const left = await this.left.getValue();
        const right = await this.right.getValue();
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

        if (this.isStatic) {
            this._STATIC_RESULT = result;
        }
        return result;
    }

    async set(newValue: number) {
    }

    async isTruthy() {
        return await this.get() !== 0;
    }

}
