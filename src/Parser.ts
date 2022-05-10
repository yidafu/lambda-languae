import { TokenStream } from "./TokenStream";

const FALSE_AST_TOKEN = { type: 'boolean', value: false };

const PRECEDENCE = new Map<string, number>([
  ['=', 1],
  ['||', 2],
  ['&&', 3],
  ['<', 7], ['>', 7], ['<=', 7], ['>=', 7], ['==', 7], ['!=', 7],
  ['+', 10], ['-', 10],
  ['*', 20], ['/', 20], ['%', 20],
])

class Parser {
  private input: TokenStream;

  constructor(input: TokenStream) {
    this.input = input
  }

  parse_toplevel() {
    const program = [];
    while (!this.input.eof()) {
      program.push(this.parse_expression());

      if (!this.input.eof()) {
        this.skip_punctuation(';')
      }
    }

    return { type: 'program', program };
  }

  parse_lambda() {
    return {
      type: 'lambda',
      vars: this.delimited('(', ')', ',', parse_vername),
      body: this.parse_expression(),
    };
  }

  parse_if() {
    this.skip_keyword('if');
    const condition = this.parse_expression();
    if (!this.is_punctuation('{'))  {
      this.skip_keyword('then')
    }
    const thenExpression = this.parse_expression();

    const retValue = { type: 'if', condition, then: thenExpression };
    if (this.is_keyword('else')) {
      this.input.next();
      retValue.else = this.parse_expression();
    }

    return retValue;
  }

  parse_atom() {
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
        return this.parse_bool();
      }
      if (this.is_keyword('lambda') || this.is_keyword('λ')) {
        this.input.next();
        return this.parse_lambda();
      }

      const token = this.input.next();
      if (['var', 'number', 'string'].includes(token?.type)) {
        return token;
      }

      throw new Error('')
    })
  }

  parse_progrma() {
    const program = this.delimited('{', '}', ';', this.parse_expression);
    if (program.length === 0) return FALSE_AST_TOKEN;
    if (program.length === 1) return program[0];
    return { type: 'program', program }
  }

  parse_expression() {
    return this.maybe_call(() => {
      return this.maybe_binary(this.parse_atom(), 0)
    })
  }

  maybe_call(expr: () => unknown) {
    const exprRes = expr()
    if (this.is_punctuation('(')) {
      return this.parse_call(exprRes)
    } else {
      return exprRes;
    }
  }

  maybe_binary(left: any, precedunce: number) {
    const token = this.is_operator();
    if (token) {
      const his_precedence = PRECEDENCE.get(token.value)
      if (his_precedence !== undefined && his_precedence > precedunce) {
        this.input.next();
        return this.maybe_binary({
          type: token.value === '=' ? 'assing' : 'binary',
          operator: token.value,
          left,
          right: this.maybe_binary(this.parse_atom(), his_precedence)
        }, precedunce)
      }
    }
    return left;
  }

  parse_call(func: unknown) {
    return {
      type: 'call',
      func,
      args: this.delimited('(', ')', ',', this.parse_expression)
    }
  }

  delimited(starSign: string, endSign: string, separator: string, parser) {
    const args = [];
    let first = true;
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
      if (operator && token.value !== operator) {
        return null;
      }
      return token;
    }
    return null;
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


  unexpected() {
    this.input.croak('Unexpected token: ' + JSON.stringify(this.input.peek()))
  }
}