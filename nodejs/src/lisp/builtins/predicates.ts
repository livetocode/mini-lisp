import { LispParametersException } from "../exceptions";
import { BuiltinFunction, ExprType, BooleanAtom, Expr, FloatAtom, IntegerAtom, NumberAtom, FunctionEvaluationContext } from "../types";
import { toSymbol } from "./utils";

// https://www.tutorialspoint.com/lisp/lisp_predicates.htm

export const eq = new BuiltinFunction(
    {
        name: 'eq',
        evalArgs: true,
        args: [
            { name: 'a', type: new ExprType('any') },
            { name: 'b', type: new ExprType('any') },
        ],
        returnType: new ExprType('boolean'),
    },
    (ctx) => {
        if (ctx.args.length !== 2) {
            throw new LispParametersException(`expected 2 arguments`);
        }
        // pointer equals?
        const result = ctx.args[0] === ctx.args[1];
        return new BooleanAtom(result);
    },
);

export const eql = new BuiltinFunction(
    {
        name: 'eql',
        evalArgs: true,
        args: [
            { name: 'a', type: new ExprType('any') },
            { name: 'b', type: new ExprType('any') },
        ],
        returnType: new ExprType('boolean'),
    },
    (ctx) => {
        if (ctx.args.length !== 2) {
            throw new LispParametersException(`expected 2 arguments`);
        }
        const [a, b] = ctx.args;
        // compare only numbers and symbols, of the same type
        if (a.isNumber() && a.getType() === b.getType()) {
            return new BooleanAtom(a.equals(b));
        }
        if (a.isSymbol() && a.getType() === b.getType()) {
            return new BooleanAtom(a.equals(b));
        }
        return new BooleanAtom(false);
    },
);

function makePredicate(name: string, predicate: (expr: Expr, ctx: FunctionEvaluationContext) => boolean) {
    return new BuiltinFunction(
        {
            name,
            evalArgs: true,
            args: [
                { name: 'a', type: new ExprType('any') },
            ],
            returnType: new ExprType('boolean'),
        },
        (ctx) => {
            if (ctx.args.length !== 1) {
                throw new LispParametersException(`expected 1 argument`);
            }
            const result = predicate(ctx.args[0], ctx);
            return result ? BooleanAtom.True : BooleanAtom.False;
        },
    );
}

export const atom = makePredicate('atom', expr => expr.isAtom() || expr.isNil());

export const evenp = makePredicate('evenp', expr => expr instanceof NumberAtom && expr.getNumber() % 2 === 0);

export const oddp = makePredicate('oddp', expr => expr instanceof NumberAtom && expr.getNumber() % 2 === 1);

export const zerop = makePredicate('zerop', expr => expr instanceof NumberAtom && expr.getNumber() === 0);

export const _null = makePredicate('null', expr => expr.isNil());

export const listp = makePredicate('listp', expr => expr.isCons() || expr.isNil());

export const numberp = makePredicate('numberp', expr => expr.isNumber());

export const symbolp = makePredicate('symbolp', expr => expr.isSymbol());

export const integerp = makePredicate('integerp', expr => expr instanceof IntegerAtom);

export const floatp = makePredicate('floatp', expr => expr instanceof FloatAtom);

export const stringp = makePredicate('stringp', expr => expr.isString());

export const boundp = makePredicate('boundp', (expr, ctx) => !!ctx.evaluator.vars.find(toSymbol(expr))?.getValue());

export const fboundp = makePredicate('fboundp', (expr, ctx) => !!ctx.evaluator.vars.find(toSymbol(expr))?.getFuncValue());

export const constantp = makePredicate('constantp', (expr, ctx) => ctx.evaluator.vars.find(toSymbol(expr))?.isReadOnly ?? false);
