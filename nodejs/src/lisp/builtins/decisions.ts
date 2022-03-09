import { LispParametersException } from "../exceptions";
import { BuiltinFunction, ExprType, Nil } from "../types";

// https://www.tutorialspoint.com/lisp/lisp_decisions.htm

export const _if = new BuiltinFunction(
    {
        name: 'if',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length < 2) {
            throw new LispParametersException(`Too few arguments to if`)
        }
        const cond = ctx.eval(ctx.args[0] ?? Nil.instance);
        const expr = (cond.isTrue() ? ctx.args[1] : ctx.args[2]) ?? Nil.instance;
        return ctx.eval(expr);
    },
);