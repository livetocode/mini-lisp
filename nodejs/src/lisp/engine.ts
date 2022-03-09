import { readFileSync } from 'fs';
import { evaluator } from './evaluator';
import { parse, parseAll, ParsedExpr } from './parser';
import { BuiltinFunction, Expr, LispVariable, LispVariables, Nil } from './types';
import * as builtins from './builtins';

let _builtins: LispVariable[] = [];
export function getBuiltins() {
    if (_builtins.length === 0) {
        for (const [name, value] of Object.entries(builtins)) {
            if (value instanceof BuiltinFunction) {
                _builtins.push(new LispVariable(value.meta.name, value, true));
                for (const alias of value.meta.aliases ?? []) {
                    _builtins.push(new LispVariable(alias, value, true));
                }
            } else if (value instanceof Expr) {
                _builtins.push(new LispVariable(name, value, true));
            }
        }
    }
    return _builtins;
}

export class LispEngine {
    public readonly globals = new LispVariables(getBuiltins());

    load(filename: string, verbose?: boolean): Expr {
        const script = readFileSync(filename, {encoding: 'utf8'});
        return this.runAll(script, filename, verbose);
    }

    run(script: string, filename?: string, verbose?: boolean): Expr {
        const expr = this.parse(script, filename);
        return this.eval(expr);
    }

    runAll(script: string, filename?: string, verbose?: boolean): Expr {
        let lastExpr: Expr | undefined;
        for (const {expr} of this.parseAll(script, filename)) {
            lastExpr = this.eval(expr);
            if (verbose) {
                console.log(expr.toString());
                console.log('   --> ', lastExpr.toString());
            }
        }
        return lastExpr ?? Nil.instance;
    }

    parse(script: string, filename?: string): Expr {
        return parse(script, filename);
    }

    *parseAll(script: string, filename?: string): Generator<ParsedExpr> {
        for (const item of parseAll(script, filename)) {
            yield item;
        }
    }

    eval(expr: Expr): Expr {
        return evaluator({
            expr,
            globals: this.globals,
            locals: this.globals,
        });
    }
}
