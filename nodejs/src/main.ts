import { exit } from 'process';
import { writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { LispEngine } from "./lisp/engine";
import { LispSyntaxException, LispUnterminatedExpressionException } from './lisp/exceptions';
import { Expr } from './lisp/types';

interface HistoryItem { 
  timestamp: Date;
  command: string;
}

const version = require('../package.json').version;
const verboseLoad = true;

function printResult(expr: Expr) {
  console.log(expr.toString());
}

function evalExpr(text: string) {
  const engine = new LispEngine();
  try {
    const expr = engine.run(text);
    printResult(expr);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

function evalModule(filename: string) {
  const engine = new LispEngine();
  try {
    const expr = engine.load(filename);
    printResult(expr);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

function load(engine: LispEngine, history: HistoryItem[], args: string[]) {
  if (args.length !== 1) {
    console.error('You must provide a filename when loading');
  } else {
    const filename = args[0];
    try {
      const result = engine.load(filename, verboseLoad);
      if (!verboseLoad) {
        printResult(result);
      }
      history.push({timestamp: new Date(), command: `(import ${JSON.stringify(filename)})`});
    } catch (err: any) {
      if (err instanceof LispSyntaxException) {
        console.error(err.message);
      } else {
        console.error(`Could not load from ${filename}: ${err.message}`);
      }
    }
  }
}

function save(history: HistoryItem[], args: string[], ) {
  if (args.length !== 1) {
    console.error('You must provide a filename when saving');
  } else {
    const filename = args[0];
    try {
      const text = history.map(x => x.command).join('\n\n');
      writeFileSync(filename, text);
    } catch (err: any) {
      console.error(`Could not save to ${filename}: ${err.message}`);
    }
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
  let history: HistoryItem[] = [];

  rl.prompt();

  rl.on('line', (line) => {
    const [command, ...args] = line.split(' ');
    switch (command) {
      case '.help':
        showHelp();
        break;
      case '.exit':
        exit(0);
      case '.break':
        lines = [];
        rl.setPrompt(DefaultPrompt);
        break;
      case '.history':
        for (const item of history) {
          console.log(item.timestamp.toLocaleString(), ':', item.command);
        }
        break;
      case '.load':
        load(engine, history, args);
        break;
      case '.save':
        save(history, args);
        break;
      default:
          lines.push(line);
          try {
              const text = lines.join('\n');
              if (text.trim()) {
                const result = engine.run(text);
                printResult(result);
                history.push({ timestamp: new Date(), command: text});
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
  console.log('.history  Display history of previous commands');
  console.log('.load     Load Lisp from a file into the REPL session')
  console.log('.save     Save all evaluated commands in this REPL session to a file');
  console.log('.help     Print this help message'); 
}

function showUsage() {
  console.log(`usage: mini-lisp [options] [ script.lisp ] [arguments]`);
  console.log('Examples:');
  console.log('  mini-lisp               will start the LISP interpreter in REPL mode');
  console.log("  mini-lisp -c '(+ 2 2)'  will evaluate the expression '2+2' and return 4");
  console.log('  mini-lisp module.lisp   will import module.lisp and return the last evaluated expression');
}

if (process.argv.length === 2) {
  REPL();
} else if (process.argv.length === 3) {
  evalModule(process.argv[2]);
} else if (process.argv.length === 4 && process.argv[2] === '-c') {
  evalExpr(process.argv[3]);
} else {
  showUsage();
}