import { parse } from './parser';
import type { Expr } from './types';

export class LispContext {

}

export class LispEngine {
    public readonly context = new LispContext();

    run(script: string): Expr {
        const expr = this.parse(script);
        return this.eval(this.context, expr);
    }

    parse(script: string): Expr {
        return parse(script);
    }

    eval(_ctx: LispContext, expr: Expr): Expr {
        return expr;
    }
}
