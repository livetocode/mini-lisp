import { BooleanAtom, BuiltinFunction, Expr, ExprType, Nil, NumberAtom } from "../types";
import { toNumber, validateArgsLength } from "./utils";

// https://www.tutorialspoint.com/lisp/lisp_operators.htm

export const plus = new BuiltinFunction(
    {
        name: '+',
        evalArgs: true,
        args: [],
        returnType: new ExprType('number'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 2 });
        const values = ctx.args.map(arg => toNumber(arg));
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
        validateArgsLength(ctx, { min: 2 });
        const values = ctx.args.map(arg => toNumber(arg));
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
        validateArgsLength(ctx, { min: 2 });
        const values = ctx.args.map(arg => toNumber(arg));
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
        validateArgsLength(ctx, { min: 2 });
        const values = ctx.args.map(arg => toNumber(arg));
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
            validateArgsLength(ctx, { min: 2 });
            for (let i = 1; i < ctx.args.length; i++) {
                if (!predicate(ctx.args[i-1], ctx.args[i])) {
                    return BooleanAtom.False;
                }
            }
            return BooleanAtom.True;
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
        validateArgsLength(ctx, { min: 1, max: 1 });
        const result = ctx.args[0].isTrue();
        return new BooleanAtom(!result);
    },
);
