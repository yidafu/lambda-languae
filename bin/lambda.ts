import fs from 'fs';
import path from 'path';
import { Environment } from '../src/Environment';
import { InputStream } from "../src/InputStream";
import { Interpreter } from '../src/Interpreter';
import { Parser } from "../src/Parser";
import { TokenStream } from "../src/TokenStream";

const  args = process.argv.slice(2);
const codepPath = args[0];

const sourceCode = fs.readFileSync(path.resolve(process.cwd(), codepPath)).toString();

const ast = new Parser(new TokenStream(new InputStream(sourceCode))).parse_toplevel();

const globalEnv = new Environment();

globalEnv.def('print',(str: string) => process.stdout.write(str.toString()));
globalEnv.def('println', console.log);

new Interpreter().evaluate(ast, globalEnv);
