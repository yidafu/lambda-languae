import { InputStream } from "../src/InputStream"
import { Parser } from "../src/Parser"
import { TokenStream } from "../src/TokenStream"

function parseCode(source_code: string) {
  return new Parser(new TokenStream(new InputStream(source_code))).parse_toplevel();
}
describe("parser", () => {
  test('lambda', () => {
    const astNode = parseCode('lambda (x) 10');
    expect(astNode.program[0]).toEqual({ type: 'lambda', vars: ['x'], body: { type: 'number', value: 10 } })
  });

  test('function calls', () => {
    const astNode = parseCode('foo (name, 123)');
    expect(astNode.program[0]).toEqual({
      type: 'call',
      func: { type: 'variable', value: 'foo' },
      args: [
        { type: 'variable', value: 'name' },
        { type: 'number', value: 123 }
      ]
    });
  });

  test('if then else expression', () => {
    const astNode = parseCode('if foo then bar else baz');
    expect(astNode.program[0]).toEqual({
      type: 'if',
      condition: { type: 'variable', value: 'foo' },
      then: { type: 'variable', value: 'bar' },
      else: { type: 'variable', value: 'baz' }
    });
  });

  test('binary expression',() => {
    const astNode = parseCode('x + y * z');
    expect(astNode.program[0]).toEqual({
      type: 'binary',
      operator: '+',
      left: { type: 'variable', value: 'x' },
      right: {
        type: 'binary',
        operator: '*',
        left: { type: 'variable', value: 'y' },
        right: { type: 'variable', value: 'z' }
      }
    });
  });
})