import { exit } from 'process';
import {createInterface} from 'readline';
import { LispEngine } from "./lisp/engine";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'lisp> '
});

const engine = new LispEngine();

rl.prompt();

rl.on('line', (line) => {
  switch (line) {
    case 'bye':
      exit(0);
    default:
        const result = engine.run(line);
        console.log(result.toString());
        break;
  }
  rl.prompt();
}).on('close', () => {
  console.log('Bye!');
  process.exit(0);
});
