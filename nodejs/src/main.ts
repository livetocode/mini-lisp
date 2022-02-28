import { exit } from 'process';
import {createInterface} from 'readline';
import { LispEngine } from "./lisp/engine";
import { LispUnterminatedExpressionException } from './lisp/exceptions';

const version = require('../package.json').version;

console.log(`Welcome to Mini-Lisp v${version}.`);
console.log('Type ".help" for more information.');

const DefaultPrompt = '> ';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: DefaultPrompt,
});

const engine = new LispEngine();
let lines: string[] = [];

rl.prompt();

rl.on('line', (line) => {
  switch (line) {
    case '.help':
      showHelp();
      break;
    case '.exit':
      exit(0);
    default:
        lines.push(line);
        try {
            const text = lines.join('\n');
            if (text.trim()) {
              const result = engine.run(text);
              console.log(result.toString());
            }
            rl.setPrompt(DefaultPrompt);
            lines = [];
        } catch(err: any) {
            if (err instanceof LispUnterminatedExpressionException) {
                rl.setPrompt('... ');
            } else {
                rl.setPrompt(DefaultPrompt);
                console.error(err);
                lines = [];
            }
        }
        break;
  }
  rl.prompt();
}).on('close', () => {
  console.log('.exit');
  process.exit(0);
});

function showHelp() {
  console.log('.exit     Exit the REPL');
  console.log('.help     Print this help message'); 
}
