import { z } from "zod";
import { BuiltinFunction, ExprType, Cons, Nil, Expr } from "../types";
import { ZBuiltinFunction, zCons, zExpr, zList } from "../ztypes";
import { castArgAsOptionalCons, getSingleArgAsList, toList, validateArgsLength } from "./utils";

// https://www.tutorialspoint.com/lisp/lisp_lists.htm

export const _list = new BuiltinFunction(
    {
        name: '_list',
        evalArgs: true,
        args: [],
        returnType: new ExprType('cons'),
    },
    (ctx) => {
        return Cons.fromArray(ctx.args);
    },
);

export const __cons = new ZBuiltinFunction(
    {
        name: '_cons',
        evalArgs: true,
        args: z.tuple([zExpr, zExpr]),
        returnType: zCons,
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 2, max: 2});
        const [a, b] = ctx.args;
        return new Cons(a, b);
    },
);

export const _car = new ZBuiltinFunction(
    {
        name: '_car',
        aliases: ['first'],
        evalArgs: true,
        args: z.tuple([zList]),
        returnType: zExpr,
    },
    (ctx, [list]) => {
        return list.getCar() ?? Nil.instance;
    },
);

export const _cdr = new ZBuiltinFunction(
    {
        name: '_cdr',
        evalArgs: true,
        args: z.tuple([zList]),
        returnType: zExpr,
    },
    (ctx, [list]) => {
        return list.getCdr() ?? Nil.instance;
    },
);

export const _cadr = new BuiltinFunction(
    {
        name: '_cadr',
        aliases: ['second'],
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        const list = getSingleArgAsList(ctx);
        return list?.getCdr()?.getCar() ?? Nil.instance;
    },
);

export const _caddr = new BuiltinFunction(
    {
        name: '_caddr',
        aliases: ['third'],
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        const list = getSingleArgAsList(ctx);
        return list?.getCdr()?.getCdr()?.getCar() ?? Nil.instance;
    },
);

export const _cadddr = new BuiltinFunction(
    {
        name: '_cadddr',
        aliases: ['fourth'],
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        const list = getSingleArgAsList(ctx);
        return list?.getCdr()?.getCdr()?.getCdr()?.getCar() ?? Nil.instance;
    },
);

export const _last = new BuiltinFunction(
    {
        name: '_last',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        const list = getSingleArgAsList(ctx);
        let current: Expr | null = list;
        while (current && current.getCdr()?.isCons()) {
            current = current.getCdr();
        }
        return current ?? Nil.instance;
    },
);

const zorg = z.tuple([zExpr, zCons]).rest(zExpr);
type tzorg = z.infer<typeof zorg>;
export function foo(...args: tzorg) {
    const [a, b, ...c] = args;
    return [a, b, c];
}

export const _append = new ZBuiltinFunction(
    {
        name: '_append',
        evalArgs: true,
        // args: z.tuple([zExpr]).rest(zExpr),
        // args: z.array(zExpr),
        args: z.tuple([zExpr, zExpr]),
        returnType: zExpr,
    },
    (ctx, args) => {
        const items = args.flatMap(toList);
        return Cons.fromArray(items);
    },
);

export const _reverse = new BuiltinFunction(
    {
        name: '_reverse',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        const args = ctx.args.flatMap(toList).reverse();
        return Cons.fromArray(args);
    },
);

export const _member = new BuiltinFunction(
    {
        name: '_member',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 2, max: 2});
        const a = ctx.args[0];
        let current: Expr | null = castArgAsOptionalCons(ctx, 1);
        while (current) {
            if (current.getCar()?.equals(a)) {
                return current;
            }
            current = current.getCdr();
        }
        return Nil.instance;
    },
);

export const _sort = new BuiltinFunction(
    {
        name: '_sort',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        const list = getSingleArgAsList(ctx);
        if (list === null) {
            return Nil.instance;
        }
        // TODO: add support for a custom comparer as second argument
        const comparer = (a: Expr, b: Expr) => a.compareTo(b);
        return Cons.fromArray(list.toArray().sort(comparer));        
    },
);
