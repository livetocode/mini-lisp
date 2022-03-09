import { BuiltinFunction, ExprType, Nil } from "../types";

export const quote = new BuiltinFunction(
    {
        name: 'quote',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        return ctx.args[0] ?? Nil.instance;
    },
);

export const _eval = new BuiltinFunction(
    {
        name: 'eval',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        return ctx.eval(ctx.args[0] ?? Nil.instance);
    },
);

export const progn = new BuiltinFunction(
    {
        name: 'progn',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        return ctx.args[ctx.args.length - 1] ?? Nil.instance;
    },
);