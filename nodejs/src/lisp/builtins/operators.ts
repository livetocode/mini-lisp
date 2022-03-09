import { LispParametersException, LispRuntimeException } from "../exceptions";
import { BooleanAtom, BuiltinFunction, Expr, ExprType, Nil, NumberAtom } from "../types";

// https://www.tutorialspoint.com/lisp/lisp_operators.htm

function castToNumber(expr: Expr) : number {
    if (expr instanceof NumberAtom) {
        return expr.getNumber();
    }
    throw new LispRuntimeException(`${expr.toString()} is not a number`);
}

export const plus = new BuiltinFunction(
    {
        name: '+',
        evalArgs: true,
        args: [],
        returnType: new ExprType('number'),
    },
    (ctx) => {
        if (ctx.args.length < 2) {
            throw new LispParametersException(`Too few arguments (${ctx.args.length}) instead of at least 2) given to : +`);
        }
        const values = ctx.args.map(arg => castToNumber(arg));
        const result = values.reduce((a, v) => a + v, 0);
        return NumberAtom.fromNumber(result);
    },
);

export const minus = new BuiltinFunction(
    {
        name: '-',
        evalArgs: true,
        args: [],
        returnType: new ExprType('number'),
    },
    (ctx) => {
        if (ctx.args.length < 2) {
            throw new LispParametersException(`Too few arguments (${ctx.args.length}) instead of at least 2) given to : -`);
        }
        const values = ctx.args.map(arg => castToNumber(arg));
        const result = values.slice(1).reduce((a, v) => a - v, values[0]);
        return NumberAtom.fromNumber(result);
    },
);

export const multiply = new BuiltinFunction(
    {
        name: '*',
        evalArgs: true,
        args: [],
        returnType: new ExprType('number'),
    },
    (ctx) => {
        if (ctx.args.length < 2) {
            throw new LispParametersException(`Too few arguments (${ctx.args.length}) instead of at least 2) given to : *`);
        }
        const values = ctx.args.map(arg => castToNumber(arg));
        const result = values.reduce((a, v) => a * v, 1);
        return NumberAtom.fromNumber(result);
    },
);

export const divide = new BuiltinFunction(
    {
        name: '/',
        evalArgs: true,
        args: [],
        returnType: new ExprType('number'),
    },
    (ctx) => {
        if (ctx.args.length < 2) {
            throw new LispParametersException(`Too few arguments (${ctx.args.length}) instead of at least 2) given to : /`);
        }
        const values = ctx.args.map(arg => castToNumber(arg));
        const result = values.slice(1).reduce((a, v) => a / v, values[0]);
        return NumberAtom.fromNumber(result);
    },
);

function makeBooleanOperator(name: string, aliases: string[], predicate: (a: Expr, b: Expr) => boolean) {
    return new BuiltinFunction(
        {
            name,
            aliases,
            evalArgs: true,
            args: [
                { name: 'a', type: new ExprType('any') },
                { name: 'b', type: new ExprType('any') },
            ],
            returnType: new ExprType('boolean'),
        },
        (ctx) => {
            if (ctx.args.length < 2) {
                throw new LispParametersException(`expected at least 2 arguments`);
            }
            for (let i = 1; i < ctx.args.length; i++) {
                if (!predicate(ctx.args[i-1], ctx.args[i])) {
                    return new BooleanAtom(false);
                }
            }
            return new BooleanAtom(true);
        },
    );
}

export const equal = makeBooleanOperator('=', ['equal'], (a, b) => a.equals(b));

export const different = makeBooleanOperator('/=', [], (a, b) => !a.equals(b));

export const greater = makeBooleanOperator('>', ['greaterp'], (a, b) => a.compareTo(b) > 0);

export const greaterOrEqual = makeBooleanOperator('>=', [], (a, b) => a.compareTo(b) >= 0);

export const less = makeBooleanOperator('<', ['lessp'], (a, b) => a.compareTo(b) < 0);

export const lessOrEqual = makeBooleanOperator('<=', [], (a, b) => a.compareTo(b) <= 0);

export const and = new BuiltinFunction(
    {
        name: 'and',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {        
        const result = ctx.args.every(arg => arg.isTrue());
        return result ? ctx.args[ctx.args.length - 1] : Nil.instance;
    },
);

export const or = new BuiltinFunction(
    {
        name: 'or',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {        
        const result = ctx.args.find(arg => arg.isTrue());
        return result ? result : Nil.instance;
    },
);

export const not = new BuiltinFunction(
    {
        name: 'not',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length !== 1) {
            throw new LispParametersException('Expected a single argument');
        }
        const result = ctx.args[0].isTrue();
        return new BooleanAtom(!result);
    },
);
