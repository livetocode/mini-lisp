import { exit } from 'process';
import { createInterface } from 'readline';
import { LispEngine } from "./lisp/engine";
import { LispUnterminatedExpressionException } from './lisp/exceptions';

const version = require('../package.json').version;

function evalExpr(text: string) {
  const engine = new LispEngine();
  try {
    const expr = engine.run(text);
    console.log(expr.toString());
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

function REPL() {
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
                  console.error(err.message);
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
}

function showHelp() {
  console.log('.exit     Exit the REPL');
  console.log('.break    Sometimes you get stuck, this gets you out');
  console.log('.help     Print this help message'); 
}

function showUsage() {
  console.log(`usage: mini-lisp [-c] [command]`);
  console.log('Examples:');
  console.log('  mini-lisp               will start the LISP interpreter in REPL mode');
  console.log("  mini-lisp -c '(+ 2 2)'  will evaluate the expression '2+2' and return 4");
}

if (process.argv.length === 2) {
  REPL();
} else if (process.argv.length === 4 && process.argv[2] === '-c') {
  evalExpr(process.argv[3]);
} else {
  showUsage();
}