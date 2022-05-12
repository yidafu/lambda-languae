import { TokenStream, TOperator } from "./TokenStream";

const FALSE_AST_TOKEN: IBooleanNode = { type: 'boolean', value: false };

const PRECEDENCE = new Map<string, number>([
  ['=', 1],
  ['||', 2],
  ['&&', 3],
  ['<', 7], ['>', 7], ['<=', 7], ['>=', 7], ['==', 7], ['!=', 7],
  ['+', 10], ['-', 10],
  ['*', 20], ['/', 20], ['%', 20],
])

export interface ILambdaNode {
  type: 'lambda',
  vars: string[],
  body: IAstNode;
}

interface IBooleanNode {
  type: 'boolean';
  value: boolean;
}

interface IProgramNode {
  type: 'program',
  program: IAstNode[],
}

interface IIfNode {
  type: 'if',
  condition: IAstNode,
  then: IAstNode,
  else?: IAstNode,
}

interface IAssignNode {
  type: 'assign',
  operator: TOperator;
  left: IAstNode,
  right: IAstNode,
}

interface IBinaryNode {
  type: 'binary',
  operator: TOperator,
  left: IAstNode,
  right: IAstNode,
}

interface INumberNode {
  type: 'number',
  value: number;
}

interface IFunctionCallNode {
  type: 'call',
  args: IAstNode[]
  func: IAstNode;
}

interface IStringNode {
  type: 'string',
  value: string;
}

interface IVariableNode {
  type: 'variable',
  value: string;
}

export type IAstNode = IIfNode | IProgramNode | ILambdaNode | IAssignNode | IBinaryNode | INumberNode | IStringNode | IFunctionCallNode | IBooleanNode | IVariableNode;

class Parser {
  private input: TokenStream;

  constructor(input: TokenStream) {
    this.input = input
  }

  parse_toplevel(): IProgramNode {
    const program = [];
    while (!this.input.eof()) {
      program.push(this.parse_expression());

      if (!this.input.eof()) {
        this.skip_punctuation(';')
      }
    }

    return { type: 'program', program };
  }

  parse_lambda(): ILambdaNode {
    return {
      type: 'lambda',
      vars: this.delimited<string>('(', ')', ',', this.parse_varname.bind(this)),
      body: this.parse_expression(),
    };
  }

  parse_varname(): string {
    const token = this.input.next();
    if (token?.type !== 'variable') {
      this.input.croak('Expecting variable name')
    }
    return token.value;
  }

  parse_if(): IIfNode {
    this.skip_keyword('if');
    const condition = this.parse_expression();
    if (!this.is_punctuation('{'))  {
      this.skip_keyword('then')
    }
    const thenExpression = this.parse_expression();

    const retValue: IIfNode = { type: 'if', condition, then: thenExpression };
    if (this.is_keyword('else')) {
      this.input.next();
      retValue.else = this.parse_expression();
    }

    return retValue;
  }

  parse_atom(): IAstNode {
    return this.maybe_call(() => {
      if (this.is_punctuation('(')) {
        this.input.next();
        const exp = this.parse_expression();
        this.skip_punctuation(')');

        return exp;
      }

      if (this.is_punctuation('{')) {
        return this.parse_program();
      }
      if (this.is_keyword('if')) {
        return this.parse_if();
      }
      if (this.is_keyword('ture') || this.is_keyword('false')) {
        return this.parse_boolean();
      }
      if (this.is_keyword('lambda') || this.is_keyword('λ')) {
        this.input.next();
        return this.parse_lambda();
      }

      const token = this.input.next();
      if (token?.type && ['variable', 'number', 'string'].includes(token.type)) {
        return token as IAstNode;
      }

      this.unexpected()
    });
  }

  parse_boolean(): IBooleanNode {
    return {
      type: 'boolean',
      value: this.input.next()?.value === 'true',
    }
  }

  parse_program(): IAstNode {
    const program = this.delimited('{', '}', ';', this.parse_expression.bind(this));
    if (program.length === 0) return FALSE_AST_TOKEN;
    if (program.length === 1) return program[0];
    return { type: 'program', program }
  }

  parse_expression(): IAstNode {
    return this.maybe_call(() => {
      return this.maybe_binary(this.parse_atom(), 0)
    });
  }

  maybe_call(expr: () => IAstNode) {
    const exprRes = expr()
    if (this.is_punctuation('(')) {
      return this.parse_call(exprRes)
    } else {
      return exprRes;
    }
  }

  maybe_binary(left: IAstNode, precedunce: number): IAstNode {
    const token = this.is_operator() && this.input.peek();
    if (token) {
      const his_precedence = PRECEDENCE.get(token.value as string)
      if (his_precedence !== undefined && his_precedence > precedunce) {
        this.input.next();
        return this.maybe_binary({
          type: token.value === '=' ? 'assign' : 'binary',
          operator: token.value as TOperator,
          left,
          right: this.maybe_binary(this.parse_atom(), his_precedence)
        }, precedunce)
      }
    }
    return left;
  }

  parse_call(func: IAstNode): IFunctionCallNode {
    return {
      type: 'call',
      func,
      args: this.delimited('(', ')', ',', this.parse_expression.bind(this))
    }
  }

  delimited<T = IAstNode>(startSign: string, endSign: string, separator: string, parser: () => T): T[] {
    const args = [];
    let first = true;
    this.skip_punctuation(startSign)
    while(!this.input.eof()) {
      if (this.is_punctuation(endSign)) break;

      if (first) {
        first = false;
      } else {
        this.skip_punctuation(separator);
      }

      if (this.is_punctuation(endSign))  break;

      args.push(parser())
    }
    this.skip_punctuation(endSign);

    return args;
  }

  is_punctuation(char: string) {
    const token = this.input.peek();
    return token && token.type === 'punctuation' && (token.value === char)
  }

  is_keyword(keyword: string) {
    const token = this.input.peek();
    return token && token.type === 'keyword' && (token.value === keyword);
  }

  is_operator(operator?: string) {
    const token = this.input.peek();
    if (token && token.type === 'operator') {

      if (operator === undefined) {
        return true;
      } else if (operator && token.value !== operator) {
        return true;
      }
    }
    return false;
  }

  skip_punctuation(char: string) {
    if (this.is_punctuation(char)) {
      this.input.next();
    } else {
      this.input.croak('Expecting punctuation: "' + char + '"')
    }
  }

  skip_operator(char: string) {
    if (this.is_operator(char)) {
      this.input.next();
    } else {
      this.input.croak('Expecting operator: "' + char + '"')
    }
  }

  skip_keyword(char: string) {
    if (this.is_keyword(char)) {
      this.input.next();
    } else {
      this.input.croak('Expecting keyword: "' + char + '"')
    }
  }


  unexpected(): never {
    this.input.croak('Unexpected token: ' + JSON.stringify(this.input.peek()))
  }
}

export { Parser }