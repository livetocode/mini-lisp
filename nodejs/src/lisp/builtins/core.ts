import { LispParametersException } from "../exceptions";
import { BuiltinFunction, Cons, ExprType, FunctionEvaluationContext, Nil, SymbolAtom } from "../types";
import { getFuncByNameOrObject } from "./utils";

export const quote = new BuiltinFunction(
    {
        name: 'quote',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        return ctx.args[0] ?? Nil.instance;
    },
);

export const _eval = new BuiltinFunction(
    {
        name: 'eval',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        return ctx.eval(ctx.args[0] ?? Nil.instance);
    },
);

export const apply = new BuiltinFunction(
    {
        name: 'apply',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length !== 2) {
            throw new LispParametersException(`apply requires 2 arguments`);
        }
        const [funcOrName, args] = ctx.args;
        const func = getFuncByNameOrObject(funcOrName, ctx.evaluator.vars.root, 'apply');
        if (!(args instanceof Cons)) {
            throw new LispParametersException(`apply requires a list as second parameter`);
        }
        return func.eval(new FunctionEvaluationContext({
            func,
            args: args.toArray(),
            evaluator: ctx.evaluator,
        }))
    },
);

export const funcall = new BuiltinFunction(
    {
        name: 'funcall',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length === 0) {
            throw new LispParametersException(`Too few arguments to funcall`);
        }
        const [funcOrName, ...args] = ctx.args;
        const func = getFuncByNameOrObject(funcOrName, ctx.evaluator.vars.root, 'funcall');
        return func.eval(new FunctionEvaluationContext({
            func,
            args,
            evaluator: ctx.evaluator,
        }))
    },
);

export const progn = new BuiltinFunction(
    {
        name: 'progn',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        return ctx.args[ctx.args.length - 1] ?? Nil.instance;
    },
);

export const typeOf = new BuiltinFunction(
    {
        name: 'type-of',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length === 0) {
            throw new LispParametersException(`Too few arguments to type-of`);
        }
        return new SymbolAtom(ctx.args[0].getType());
    },
);

export const debugStats = new BuiltinFunction(
    {
        name: 'debug-stats',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length === 0) {
            throw new LispParametersException(`Too few arguments to debug-stats`);
        }
        const oldStats = ctx.evaluator.stats.clone();
        const result = ctx.eval(ctx.args[0]);
        const callStats = ctx.evaluator.stats.diff(oldStats);
        return Cons.fromArray([result, callStats.toList()]);
    },
);

export const debugCalls = new BuiltinFunction(
    {
        name: 'debug-calls',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        if (ctx.args.length === 0) {
            throw new LispParametersException(`Too few arguments to debug-calls`);
        }
        return ctx.evaluator.stats.withVerbsosity(() => ctx.eval(ctx.args[0]));
    },
);