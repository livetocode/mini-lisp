import { LispParametersException } from "../exceptions";
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

function ensureNumbers(a: Expr, b: Expr) {
    if (!a.isNumber()) {
        throw new LispParametersException(`${a.toString()} is not a number`);
    }
    if (!b.isNumber()) {
        throw new LispParametersException(`${b.toString()} is not a number`);
    }
    return true;
}

function ensureStrings(a: Expr, b: Expr) {
    if (!a.isString()) {
        throw new LispParametersException(`${a.toString()} is not a string`);
    }
    if (!b.isString()) {
        throw new LispParametersException(`${b.toString()} is not a string`);
    }
    return true;
}

function sameNumbersOrSymbols(a: Expr, b: Expr) {
    if (a === b) {
        return true;
    }
    if (a.getType() === b.getType()) {
        if (a.isNumber() || a.isSymbol()) {
            return a.equals(b);
        }
    }
    return false;
}

export const eq = makeBooleanOperator('eq', [], (a, b) => a === b);

export const eql = makeBooleanOperator('eql', [], (a, b) => sameNumbersOrSymbols(a, b));

export const equal = makeBooleanOperator('equal', [], (a, b) => a.equals(b));

export const _equal = makeBooleanOperator('=', [], (a, b) => ensureNumbers(a, b) && a.equals(b));

export const _different = makeBooleanOperator('/=', [], (a, b) => ensureNumbers(a, b) && !a.equals(b));

export const _greater = makeBooleanOperator('>', [], (a, b) => ensureNumbers(a, b) && a.compareTo(b) > 0);

export const _greaterOrEqual = makeBooleanOperator('>=', [], (a, b) => ensureNumbers(a, b) && a.compareTo(b) >= 0);

export const _less = makeBooleanOperator('<', [], (a, b) => ensureNumbers(a, b) && a.compareTo(b) < 0);

export const _lessOrEqual = makeBooleanOperator('<=', [], (a, b) => ensureNumbers(a, b) && a.compareTo(b) <= 0);

export const _strEqual = makeBooleanOperator('string=', [], (a, b) => ensureStrings(a, b) && a.equals(b));

export const _strDifferent = makeBooleanOperator('string/=', [], (a, b) => ensureStrings(a, b) && !a.equals(b));

export const _strGreater = makeBooleanOperator('string>', [], (a, b) => ensureStrings(a, b) && a.compareTo(b) > 0);

export const _strGeaterOrEqual = makeBooleanOperator('string>=', [], (a, b) => ensureStrings(a, b) && a.compareTo(b) >= 0);

export const _strLess = makeBooleanOperator('string<', [], (a, b) => ensureStrings(a, b) && a.compareTo(b) < 0);

export const _strLessOrEqual = makeBooleanOperator('string<=', [], (a, b) => ensureStrings(a, b) && a.compareTo(b) <= 0);

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
