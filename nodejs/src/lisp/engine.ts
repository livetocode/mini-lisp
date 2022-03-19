import { readFileSync } from 'fs';
import { LispEvaluator } from './evaluator';
import { parse, parseAll, ParsedExpr } from './parser';
import { BuiltinFunction, Expr, ILispEvaluator, LispVariable, LispVariables, Nil } from './types';
import * as builtins from './builtins';

let _builtins: LispVariable[] = [];
export function getBuiltins() {
    if (_builtins.length === 0) {
        for (const [name, value] of Object.entries(builtins)) {
            if (value instanceof BuiltinFunction) {
                _builtins.push(new LispVariable(value.meta.name, true, undefined, value));
                for (const alias of value.meta.aliases ?? []) {
                    const aliasedFunc = new BuiltinFunction({...value.meta, name: alias, aliases: [] }, value.callback);
                    _builtins.push(new LispVariable(alias, true, undefined, aliasedFunc));
                }
            } else if (value instanceof Expr) {
                _builtins.push(new LispVariable(name, true, value));
            }
        }
    }
    return _builtins;
}

export class LispEngine {
    private readonly evaluator: ILispEvaluator;

    constructor() {
        const vars = new LispVariables(getBuiltins());
        this.evaluator = new LispEvaluator(vars);
    }

    get vars() {
        return this.evaluator.vars;
    }   

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
        return this.evaluator.eval(expr);
    }
}
