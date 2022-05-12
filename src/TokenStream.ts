import { InputStream } from "./InputStream";


interface IStringToken {
  type: 'string',
  value: string;
}

interface INumberToken {
  type: 'number',
  value: number,
}

interface IVariableToken {
  type: 'variable',
  value: string;
}

type TKeyword = 'if' | 'then' | 'else' | 'lambda' | 'λ' | 'true' | 'false';

interface IKeywordToken {
  type: 'keyword',
  value: TKeyword
}

type TPunctuation = ',' | ';' | '(' | ')' | '{' | '}' | '[' | ']';

interface IPunctuationToken {
  type: 'punctuation',
  value: TPunctuation,
}

export type TOperator = '+' | '-' | '*' | '/' | '%' | '=' | '&&' | '||' | '<' | '>' | '>=' | '<=' | '==' | '!=' | '!';
interface IOperatorToken  {
  type: 'operator',
  value: TOperator
}

type IToken = IStringToken | INumberToken | IVariableToken | IKeywordToken | IPunctuationToken | IOperatorToken | null;



function is_whitespace(char: string) {
  return [' ', '\n', '\t'].includes(char);
}

function is_keyword(identifier: string) {
  return ['if', 'then', 'else', 'lambda', 'λ', 'true', 'false'].includes(identifier);
}


function is_digit(char: string) {
  // assic '0' => 48  '9' => 57
  return char.charCodeAt(0) >= 48 && char.charCodeAt(0) <= 57;
}

function is_punc(char: string) {
  return [',', ';', '(', ')', '{', '}', '[', ']'].includes(char);
}

function is_op_char(char: string) {
  return '+-*/%=&|<>!'.includes(char);
}

function is_identifier(char: string) {
  return is_identifier_start(char) || '?!-<>=123456789'.includes(char)
}

function is_identifier_start(char: string) {
  return /[a-zA-Zλ_]/.test(char);
}


class TokenStream {
  private input: InputStream;

  private current: IToken = null;

  constructor(inputStream: InputStream) {
    this.input = inputStream;
  }
  
  read_next(): IToken {
    this.read_while(is_whitespace);
    if (this.input.eof()) return null;
    const char = this.input.peek();
    if (char === '#') {
      this.skip_comment();
      return this.read_next();
    }
    if (char === '"') return this.read_string();

    if (is_digit(char)) return this.read_number();

    if (is_identifier_start(char)) return this.read_ident();

    if (is_punc(char)) return {
      type: 'punctuation',
      value: this.input.next() as TPunctuation,
    }

    if (is_op_char(char)) return {
      type: 'operator',
      value: this.read_while(is_op_char) as TOperator,
    }

    this.input.croak(`Can't handle charactor: ${char}`);
  }

  skip_comment() {
    this.read_while((char) => char !== '\n');
    this.input.next();
  }

  read_while(predicate: (char: string) => boolean) {
    let str = '';
    while(!this.input.eof() && predicate(this.input.peek())) {
      str += this.input.next();
    }
    return str;
  }

  read_string(): IStringToken {
    return { type: 'string', value: this.read_escaped('"') }
  }

  read_number(): INumberToken {
    let has_dot = false;
    const number = this.read_while((char) => {
      if (char === '.') {
        if (has_dot) {
          return false;
        }
        has_dot = true;
        return true;
      }
      return is_digit(char);
    });

    return { type: 'number', value: parseFloat(number) };
  }

  read_ident(): IVariableToken | IKeywordToken {
    const identifier = this.read_while(is_identifier);
    if (is_keyword(identifier)) {
      return {
        type: 'keyword',
        value: identifier as TKeyword, 
      }
    }
    return {
      type: 'variable',
      value: identifier, 
    };
  }

  read_escaped(end: string) {
    let escaped = false;
    let str = '';
    this.input.next();
    while(!this.input.eof()) {
      const char = this.input.next();
      if (escaped) {
        str += char;
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === end) {
        break;
      } else {
        str += char;
      }
    }
    return str;
  }

  peek() {
    return this.current ?? (this.current = this.read_next())
  }

  next(): IToken {
    let token = this.current;
    this.current = null;
    return token ?? this.read_next();
  }

  croak(msg: string): never {
    this.input.croak(msg);
  }

  eof() {
    return this.peek() === null;
  }

  [Symbol.iterator]() {
    const self = this;
    return {
      next() {
        const done = self.eof();
        const nextValue = self.next();
        return { value: nextValue, done }
      }
    }
  }
}


export { TokenStream };