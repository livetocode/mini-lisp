import { LispParametersException } from "../exceptions";
import { BuiltinFunction, ExprType, Cons, Nil, Expr } from "../types";

// https://www.tutorialspoint.com/lisp/lisp_lists.htm

export const list = new BuiltinFunction(
    {
        name: 'list',
        evalArgs: true,
        args: [],
        returnType: new ExprType('cons'),
    },
    (ctx) => {
        return Cons.fromArray(ctx.args);
    },
);

export const _cons = new BuiltinFunction(
    {
        name: 'cons',
        evalArgs: true,
        args: [],
        returnType: new ExprType('cons'),
    },
    (ctx) => {
        if (ctx.args.length !== 2) {
            throw new LispParametersException(`expected 2 arguments`);
        }
        return new Cons(ctx.args[0] ?? Nil.instance, ctx.args[1] ?? Nil.instance);
    },
);

export const car = new BuiltinFunction(
    {
        name: 'car',
        aliases: ['first'],
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        return ctx.args[0]?.getCar() ?? Nil.instance;
    },
);

export const cdr = new BuiltinFunction(
    {
        name: 'cdr',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
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
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length !== 1) {
            throw new LispParametersException(`expected 1 argument`);
        }
        const [list] = ctx.args;
        if (list.isNil()) {
            return list;
        }
        if (!list.isCons()) {
            throw new LispParametersException(`expected a list as argument`);
        }
        return list.getCdr()?.getCar() ?? Nil.instance;
    },
);

export const caddr = new BuiltinFunction(
    {
        name: 'caddr',
        aliases: ['third'],
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length !== 1) {
            throw new LispParametersException(`expected 1 argument`);
        }
        const [list] = ctx.args;
        if (list.isNil()) {
            return list;
        }
        if (!list.isCons()) {
            throw new LispParametersException(`expected a list as argument`);
        }
        return list.getCdr()?.getCdr()?.getCar() ?? Nil.instance;
    },
);

export const cadddr = new BuiltinFunction(
    {
        name: 'cadddr',
        aliases: ['fourth'],
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length !== 1) {
            throw new LispParametersException(`expected 1 argument`);
        }
        const [list] = ctx.args;
        if (list.isNil()) {
            return list;
        }
        if (!list.isCons()) {
            throw new LispParametersException(`expected a list as argument`);
        }
        return list.getCdr()?.getCdr()?.getCdr()?.getCar() ?? Nil.instance;
    },
);

export const last = new BuiltinFunction(
    {
        name: 'last',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length !== 1) {
            throw new LispParametersException(`expected 1 argument`);
        }
        if (ctx.args[0].isNil()) {
            return ctx.args[0];
        }
        if (!ctx.args[0].isCons()) {
            throw new LispParametersException(`expected a list as argument`);
        }
        let current: Expr | null = ctx.args[0];
        while (current && current.getCdr()?.isCons()) {
            current = current.getCdr();
        }
        return current ?? Nil.instance;
    },
);

function castToList(expr: Expr) {
    if (expr.isNil()) {
        return [];
    }
    if (expr instanceof Cons) {
        return expr.toArray();
    }
    throw new LispParametersException(`Expected '${expr.toString()}' to be a list`);
}

export const append = new BuiltinFunction(
    {
        name: 'append',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        const args = ctx.args.flatMap(castToList);
        return Cons.fromArray(args);
    },
);

export const reverse = new BuiltinFunction(
    {
        name: 'reverse',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        const args = ctx.args.flatMap(castToList).reverse();
        return Cons.fromArray(args);
    },
);

export const member = new BuiltinFunction(
    {
        name: 'member',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length !== 2) {
            throw new LispParametersException(`expected 2 arguments`);
        }
        const [a, b] = ctx.args;
        if (b.isNil()) {
            return b;
        }
        if (!b.isCons()) {
            throw new LispParametersException(`expected a list as argument`);
        }
        let current: Expr | null = b;
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
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length < 1) {
            throw new LispParametersException(`too few arguments`);
        }
        const list = ctx.args[0];
        if (!(list instanceof Cons)) {
            throw new LispParametersException('Expected first argument to be a list');
        }
        // TODO: add support for a custom comparer as second argument
        const comparer = (a: Expr, b: Expr) => a.compareTo(b);
        return Cons.fromArray(list.toArray().sort(comparer));
    },
);
