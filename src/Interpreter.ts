import { Environment } from "./Environment";
import { IAstNode, ILambdaNode } from "./Parser";
import { TOperator } from "./TokenStream";

class Interpreter {
  evaluate(expression: IAstNode, environment: Environment): any {
    switch (expression.type) {
      case 'string':
      case 'number':
      case 'boolean':
          return expression.value;
      case 'variable':
        return environment.get(expression.value)
      case 'assign': {
        if (expression.left.type !== 'variable') {
          throw new Error('Cannot assign to ' + expression.left.type);
        }
        environment.set(expression.left.value, this.evaluate(expression.right, environment));
        break;
      }
      case 'binary': {
        return this.apply_operator(expression.operator, this.evaluate(expression.left, environment), this.evaluate(expression.right, environment))
      }
      case 'lambda': {
        return this.make_lambda(expression, environment);
      }
      case 'if': {

        const cond = this.evaluate(expression.condition, environment);
        if (cond === true) {
          return this.evaluate(expression.then, environment);
        } else if (expression.else) {
          return this.evaluate(expression.else, environment);
        }
        return false;
      }
      case 'program': {
        let val = false;
        expression.program.forEach((expr) => (val = this.evaluate(expr, environment)));
        return val;
      }
      case 'call': {
        const func = this.evaluate(expression.func, environment);
        return func.apply(null, expression.args.map(arg => this.evaluate(arg, environment)));
      }
      default:
        throw new Error('Unknown AstNode type: ' + JSON.stringify(expression));
    }
  }

  make_lambda(expression: ILambdaNode, environment: Environment) {
    const self = this;
    return function lambda(...args: any[]) {
      const names = expression.vars;
      const scope = environment.extend();
      for (let idx = 0; idx < names.length; idx++) {
        scope.def(names[idx], args[idx] ?? false);
      }
      return self.evaluate(expression.body, scope);
    }
  }

  apply_operator(operator: TOperator, leftVal: any, rightVal: any) {
    function checkNumber(num: any) {
      if (typeof num != 'number') {
        throw new Error('Expected number bug got ' + num);
      }
      return num
    }
    switch (operator) {
      case '+': return checkNumber(leftVal) + checkNumber(rightVal);
      case '-': return checkNumber(leftVal) - checkNumber(rightVal);
      case '*': return checkNumber(leftVal) * checkNumber(rightVal);
      case '/': return checkNumber(leftVal) / checkNumber(rightVal);
      case '%': return checkNumber(leftVal) % checkNumber(rightVal);
      case '&&': return leftVal && rightVal;
      case '||': return leftVal || rightVal;
      case '<': return checkNumber(leftVal) < checkNumber(rightVal);
      case '>': return checkNumber(leftVal) > checkNumber(rightVal);
      case '>=': return checkNumber(leftVal) >= checkNumber(rightVal);
      case '<=': return checkNumber(leftVal) <= checkNumber(rightVal);
      case '==': return leftVal == rightVal;
      case '!=': return leftVal != rightVal;
    }
  }
}

export { Interpreter };