import { readFileSync } from 'fs';
import { parse, parseAll, ParsedExpr } from './parser';
import { Expr, Nil } from './types';

export class LispContext {
    eval(expr: Expr): Expr {
        return expr;
    }
}

export class LispEngine {
    public readonly context = new LispContext();

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
                console.log(expr.toString(), '--> ', lastExpr.toString());
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
        return this.context.eval(expr);
    }
}
