import { BuiltinFunction, Cons, Nil, Expr, tCons, tExpr, tList } from "../types";
import { castArgAsOptionalCons, getSingleArgAsList, toList, validateArgsLength } from "./utils";

// https://www.tutorialspoint.com/lisp/lisp_lists.htm

export const list = new BuiltinFunction(
    {
        name: 'list',
        evalArgs: true,
        args: [{ name: 'items', type: tExpr, isVariadic: true }],
        returnType: tCons,
    },
    (ctx) => {
        return Cons.fromArray(ctx.args);
    },
);

export const _cons = new BuiltinFunction(
    {
        name: 'cons',
        evalArgs: true,
        args: [
            { name: 'a', type: tExpr },
            { name: 'b', type: tExpr },
        ],
        returnType: tCons,
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 2, max: 2});
        const [a, b] = ctx.args;
        return new Cons(a, b);
    },
);

export const car = new BuiltinFunction(
    {
        name: 'car',
        aliases: ['first'],
        evalArgs: true,
        args: [{ name: 'list', type: tList }],
        returnType: tExpr,
    },
    (ctx) => {
        return ctx.args[0]?.getCar() ?? Nil.instance;
    },
);

export const cdr = new BuiltinFunction(
    {
        name: 'cdr',
        evalArgs: true,
        args: [{ name: 'list', type: tList }],
        returnType: tExpr,
    },
    (ctx) => {
        return ctx.args[0]?.getCdr() ?? Nil.instance;
    },
);

export const cadr = new BuiltinFunction(
    {
        name: 'cadr',
        aliases: ['second'],
        evalArgs: true,
        args: [{ name: 'list', type: tList }],
        returnType: tExpr,
    },
    (ctx) => {
        const list = getSingleArgAsList(ctx);
        return list?.getCdr()?.getCar() ?? Nil.instance;
    },
);

export const caddr = new BuiltinFunction(
    {
        name: 'caddr',
        aliases: ['third'],
        evalArgs: true,
        args: [{ name: 'list', type: tList }],
        returnType: tExpr,
    },
    (ctx) => {
        const list = getSingleArgAsList(ctx);
        return list?.getCdr()?.getCdr()?.getCar() ?? Nil.instance;
    },
);

export const cadddr = new BuiltinFunction(
    {
        name: 'cadddr',
        aliases: ['fourth'],
        evalArgs: true,
        args: [{ name: 'list', type: tList }],
        returnType: tExpr,
    },
    (ctx) => {
        const list = getSingleArgAsList(ctx);
        return list?.getCdr()?.getCdr()?.getCdr()?.getCar() ?? Nil.instance;
    },
);

export const last = new BuiltinFunction(
    {
        name: 'last',
        evalArgs: true,
        args: [{ name: 'list', type: tList }],
        returnType: tExpr,
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

export const append = new BuiltinFunction(
    {
        name: 'append',
        evalArgs: true,
        args: [{ name: 'items', type: tExpr, isVariadic: true }],
        returnType: tList,
    },
    (ctx) => {
        const args = ctx.args.flatMap(toList);
        return Cons.fromArray(args);
    },
);

export const reverse = new BuiltinFunction(
    {
        name: 'reverse',
        evalArgs: true,
        args: [{ name: 'list', type: tList }],
        returnType: tList,
    },
    (ctx) => {
        const list = getSingleArgAsList(ctx);
        if (list === null) {
            return Nil.instance;
        }
        return Cons.fromArray(list.toArray().reverse());
    },
);

export const member = new BuiltinFunction(
    {
        name: 'member',
        evalArgs: true,
        args: [
            { name: 'item', type: tExpr },
            { name: 'list', type: tList },
        ],
        returnType: tList,
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

export const sort = new BuiltinFunction(
    {
        name: 'sort',
        evalArgs: true,
        args: [{ name: 'list', type: tList }],
        returnType: tList,
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
