import { LispParametersException, LispRuntimeException } from "../exceptions";
import { BuiltinFunction, ExprType, SymbolAtom, Nil, Expr, Cons, LispVariable } from "../types";
import { toSymbol } from "./utils";

// https://www.tutorialspoint.com/lisp/lisp_variables.htm

export const set = new BuiltinFunction(
    {
        name: 'set',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length !== 2) {
            throw new LispParametersException(`expected 2 arguments but received ${ctx.args.length}`);
        }
        const name = ctx.args[0];
        if (!(name instanceof SymbolAtom)) {
            throw new LispParametersException(`Expected arg #0 to be a symbol but received ${name.getType()}`);
        }
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
        if (ctx.args.length % 2 !== 0) {
            throw new LispParametersException(`odd number of arguments: ${ctx.args.toString()}`)
        }
        let lastExpr: Expr = Nil.instance;
        for (let i = 0; i < ctx.args.length; i += 2) {
            const name = ctx.args[i];
            if (!(name instanceof SymbolAtom)) {
                throw new LispParametersException(`Expected arg #${i} to be a symbol but received ${name.getType()}`);
            }
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
        if (ctx.args.length === 0) {
            throw new LispParametersException(`expected at least one argument`);
        }
        const name = ctx.args[0];
        if (!(name instanceof SymbolAtom)) {
            throw new LispParametersException(`Expected arg #0 to be a symbol but received ${name.getType()}`);
        }
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
        if (ctx.args.length === 0) {
            throw new LispParametersException(`expected at least one argument`);
        }
        const name = ctx.args[0];
        if (!(name instanceof SymbolAtom)) {
            throw new LispParametersException(`Expected arg #0 to be a symbol but received ${name.getType()}`);
        }
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
        if (ctx.args.length < 1) {
            throw new LispParametersException(`Too few arguments to symbol-value`)
        }
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
        if (ctx.args.length < 1) {
            throw new LispParametersException(`Too few arguments to let`)
        }
        const [varList, ...body] = ctx.args;
        if (!(varList instanceof Cons)) {
            throw new LispParametersException('Expected first argument to be a list');
        }
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
