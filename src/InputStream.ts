class InputStream {
  private pos = 0;
  private line = 1;
  private col = 0;
  private source: string;

  constructor(input: string) {
    this.source = input;
  }

  next() {
    const char = this.source.charAt(this.pos++);
    if (char === '\n') {
      this.line ++;
      this.col = 0;
    } else {
      this.col ++;
    }
    return char;
  }

  peek() {
    return this.source.charAt(this.pos);
  }

  eof() {
    return this.peek() === '';
  }

  croak(msg: string): never {
    throw new Error(`${msg} (${this.line}:${this.col})`)
  }
}

function createInputStream(input: string) {
  return new InputStream(input);
}

export {
  InputStream,
  createInputStream,
}