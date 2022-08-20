import { LispParametersException, LispRuntimeException } from "../exceptions";
import { BuiltinFunction, ExprType, SymbolAtom, Nil, Expr, LispVariable } from "../types";
import { castArgAsCons, castArgAsSymbol, toSymbol, validateArgsLength } from "./utils";

// https://www.tutorialspoint.com/lisp/lisp_variables.htm

export const set = new BuiltinFunction(
    {
        name: 'set',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 2, max: 2 });
        const name = castArgAsSymbol(ctx, 0);
        const expr = ctx.args[1];
        ctx.evaluator.vars.set(name.getValue(), false, expr);
        return expr;
    },
);

export const setq = new BuiltinFunction(
    {
        name: 'setq',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 2, isEven: true });
        let lastExpr: Expr = Nil.instance;
        for (let i = 0; i < ctx.args.length; i += 2) {
            const name = castArgAsSymbol(ctx, i);
            const expr = ctx.args[i + 1];
            const value = ctx.eval(expr);
            ctx.evaluator.vars.set(name.getValue(), false, value);
            lastExpr = value;
        }
        return lastExpr;
    },
);

export const defvar = new BuiltinFunction(
    {
        name: 'defvar',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 1, max: 2 });
        const name = castArgAsSymbol(ctx, 0);
        if (ctx.args.length > 1) {
            const expr = ctx.args[1];
            const value = ctx.eval(expr);
            const v = ctx.evaluator.vars.set(name.getValue(), false);
            if (v.getValue() === undefined) {
                v.setValue(value);
            }    
        }
        return name;
    },
);

export const defparameter = new BuiltinFunction(
    {
        name: 'defparameter',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 1, max: 2 });
        const name = castArgAsSymbol(ctx, 0);
        if (ctx.args.length > 1) {
            const expr = ctx.args[1];
            const value = ctx.eval(expr);
            ctx.evaluator.vars.set(name.getValue(), false, value);
        }
        return name;
    },
);

export const symbol_value = new BuiltinFunction(
    {
        name: 'symbol-value',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 1, max: 1 });
        const name = toSymbol(ctx.args[0]);
        const val = ctx.evaluator.vars.find(name)?.getValue();
        if (!val) {
            throw new LispRuntimeException(`Variable ${name} has no value`);
        }
        return val;
    },
);

export const _let = new BuiltinFunction(
    {
        name: 'let',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 1 });
        const varList = castArgAsCons(ctx, 0);
        const body = ctx.args.slice(1);
        const vars : LispVariable[] = [];
        for (const [k, v] of varList.asPairs()) {
            if (!(k instanceof SymbolAtom)) {
                throw new LispParametersException('Expected each variable declaration to start with a symbol for the name');
            }
            const name = k.getText();
            vars.push(new LispVariable(name, false, v));
        }
        const childContext = ctx.createChildContext(vars);
        const bodyVals = body.map(e => childContext.eval(e));
        return bodyVals[bodyVals.length - 1] ?? Nil.instance;
    },
);
