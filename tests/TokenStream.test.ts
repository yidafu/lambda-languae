import { InputStream } from "../src/InputStream";
import { TokenStream } from "../src/TokenStream";

describe('TokenStream', () => {
  test('only comments', () => {
    const source_code =  `# this is a comment
    # anthor comment
    `;

    const tokenStream = new TokenStream(new InputStream(source_code));
    const token = tokenStream.next();
    expect(tokenStream.eof()).toBeTruthy();
    expect(token).toBeNull();
  });

  test('print function call', () => {
    const source_code = `print("hello word")`;
    const tokenStream = new TokenStream(new InputStream(source_code));
    const token1 = tokenStream.next();
    expect(token1).toEqual({ type: 'identifier', value: 'print' });

    const token2 = tokenStream.next();
    expect(token2).toEqual({ type: 'punctuation', value: '(' });

    const token3 = tokenStream.next();
    expect(token3).toEqual({ type: 'string', value: 'hello word' });


    const token4 = tokenStream.next();
    expect(token4).toEqual({ type: 'punctuation', value: ')' });
  });
});