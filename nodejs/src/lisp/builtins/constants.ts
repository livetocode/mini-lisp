import { LispParametersException } from "../exceptions";
import { BooleanAtom, BuiltinFunction, ExprType, Nil, SymbolAtom } from "../types";

// https://www.tutorialspoint.com/lisp/lisp_constants.htm

export const nil = Nil.instance;

export const t = BooleanAtom.True;

export const defconstant = new BuiltinFunction(
    {
        name: 'defconstant',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length !== 2) {
            throw new LispParametersException(`expected 2 arguments but received ${ctx.args.toString()}`);
        }
        const name = ctx.args[0];
        if (!(name instanceof SymbolAtom)) {
            throw new LispParametersException(`Expected arg #0 to be a symbol but received ${name.getType()}`);
        }
        const expr = ctx.args[1];
        const value = ctx.eval(expr);
        ctx.evaluator.vars.set(name.getValue(), true, value);
        return name;
    },
);
