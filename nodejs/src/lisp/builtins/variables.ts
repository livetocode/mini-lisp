import { LispParametersException } from "../exceptions";
import { BuiltinFunction, ExprType, SymbolAtom, Nil, Expr } from "../types";

// https://www.tutorialspoint.com/lisp/lisp_variables.htm

export const set = new BuiltinFunction(
    {
        name: 'set',
        evalArgs: true,
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
            ctx.locals.set(name.getValue(), expr, false);
            lastExpr = expr;
        }
        return lastExpr;
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
            ctx.locals.set(name.getValue(), value, false);
            lastExpr = expr;
        }
        return lastExpr;
    },
);