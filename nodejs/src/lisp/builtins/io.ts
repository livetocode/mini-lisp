import { readFileSync } from 'fs';
import { parseAll } from '../parser';
import { BuiltinFunction, Expr, ExprType, Nil } from "../types";
import { castArgAsString, validateArgsLength } from './utils';

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
        validateArgsLength(ctx, { min: 1, max: 1 });
        const filename = castArgAsString(ctx, 0);
        const script = readFileSync(filename.getText(), {encoding: 'utf8'});
        let lastExpr: Expr | undefined;
        for (const item of parseAll(script, filename.getText())) {
            lastExpr = ctx.eval(item.expr);
        }
        return lastExpr ?? Nil.instance;
    },
);
