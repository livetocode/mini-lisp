import { readFileSync } from 'fs';
import { LispParametersException } from "../exceptions";
import { parseAll } from '../parser';
import { BuiltinFunction, Expr, ExprType, Nil, StringAtom } from "../types";

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

export const _import = new BuiltinFunction(
    {
        name: 'import',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length !== 1) {
            throw new LispParametersException(`expected 1 argument`);
        }
        if (!(ctx.args[0] instanceof StringAtom)) {
            throw new LispParametersException(`expected first argument to be a string`);
        }
        const filename = ctx.args[0].getText();
        const script = readFileSync(filename, {encoding: 'utf8'});
        let lastExpr: Expr | undefined;
        for (const item of parseAll(script, filename)) {
            lastExpr = ctx.eval(item.expr);
        }
        return lastExpr ?? Nil.instance;
    },
);
