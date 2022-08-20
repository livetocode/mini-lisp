import { BuiltinFunction, ExprType, Nil } from "../types";
import { validateArgsLength } from "./utils";

// https://www.tutorialspoint.com/lisp/lisp_decisions.htm

export const _if = new BuiltinFunction(
    {
        name: 'if',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 2 });
        const cond = ctx.eval(ctx.args[0]);
        const expr = (cond.isTrue() ? ctx.args[1] : ctx.args[2]) ?? Nil.instance;
        return ctx.eval(expr);
    },
);