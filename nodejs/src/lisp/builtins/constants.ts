import { BooleanAtom, BuiltinFunction, ExprType, Nil } from "../types";
import { castArgAsSymbol, validateArgsLength } from "./utils";

// https://www.tutorialspoint.com/lisp/lisp_constants.htm

export const nil = Nil.instance;

export const t = BooleanAtom.True;

export const defconstant = new BuiltinFunction(
    {
        name: 'defconstant',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 2, max: 2 });
        const name = castArgAsSymbol(ctx, 0);
        const expr = ctx.args[1];
        const value = ctx.eval(expr);
        ctx.evaluator.vars.set(name.getValue(), true, value);
        return name;
    },
);
