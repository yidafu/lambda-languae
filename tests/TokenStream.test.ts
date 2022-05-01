import { InputStream } from "../src/InputStream";
import { TokenStream } from "../src/TokenStream";

function createTokenStream(source_code: string) {
  return new TokenStream(new InputStream(source_code));
}

function getAllTokens(tokenStream: TokenStream) {
  return [...tokenStream];
}
describe('TokenStream', () => {
  test('only comments', () => {
    const source_code =  `# this is a comment
    # anthor comment
    `;

    const tokenStream = createTokenStream(source_code);
    const [token] = getAllTokens(tokenStream)
    expect(tokenStream.eof()).toBeTruthy();
    expect(token).toBeUndefined();
  });

  test('print function call', () => {
    const source_code = `print("hello word")`;
    const tokenStream = createTokenStream(source_code);
    const tokens = getAllTokens(tokenStream);
    console.log(tokens)
    expect(tokens[0]).toEqual({ type: 'identifier', value: 'print' });
    expect(tokens[1]).toEqual({ type: 'punctuation', value: '(' });
    expect(tokens[2]).toEqual({ type: 'string', value: 'hello word' });
    expect(tokens[3]).toEqual({ type: 'punctuation', value: ')' });
  });

  test('num = 3 + 12', () => {
    const source_code = `num = 3.3 + 12`;
    const tokens = getAllTokens(createTokenStream(source_code));

    expect(tokens[0]).toEqual({ type: 'identifier', value: 'num' });
    expect(tokens[1]).toEqual({ type: 'operator', value: '=' });
    expect(tokens[2]).toEqual({ type: 'number', value: 3.3 });
    expect(tokens[3]).toEqual({ type: 'operator', value: '+' });
    expect(tokens[4]).toEqual({ type: 'number', value: 12 });
  });

  test('lambda function define', () => {
    const source_code = `isEven = lambda (n) if n % 2 == 0 then true else false;`;
    const tokens = getAllTokens(createTokenStream(source_code));
    expect(tokens[0]).toEqual({ type: 'identifier', value: 'isEven' });
    expect(tokens[1]).toEqual({ type: 'operator', value: '=' });
    expect(tokens[2]).toEqual({ type: 'keyword', value: 'lambda' });
    expect(tokens[3]).toEqual({ type: 'punctuation', value: '(' });
    expect(tokens[4]).toEqual({ type: 'identifier', value: 'n' });
    expect(tokens[5]).toEqual({ type: 'punctuation', value: ')' });
    expect(tokens[6]).toEqual({ type: 'keyword', value: 'if' });
    expect(tokens[10]).toEqual({ type: 'operator', value: '==' });
    expect(tokens[12]).toEqual({ type: 'keyword', value: 'then' });
    expect(tokens[15]).toEqual({ type: 'keyword', value: 'false' });
    expect(tokens[16]).toEqual({ type: 'punctuation', value: ';' });
  })
});