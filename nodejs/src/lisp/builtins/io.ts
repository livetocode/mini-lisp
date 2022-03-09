import { BuiltinFunction, ExprType, Nil } from "../types";

export const print = new BuiltinFunction(
    {
        name: 'print',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        console.log(...ctx.args.map(x => x.toString()));
        return Nil.instance;
    },
);