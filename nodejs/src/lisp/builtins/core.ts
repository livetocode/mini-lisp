import { BuiltinFunction, Cons, ExprType, FloatAtom, FunctionEvaluationContext, Nil, SymbolAtom } from "../types";
import { castArgAsOptionalCons, getFuncByNameOrObject, validateArgsLength } from "./utils";

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
        validateArgsLength(ctx, { min: 2, max: 2 });
        const funcOrName = ctx.args[0];
        const func = getFuncByNameOrObject(funcOrName, ctx.evaluator.vars.root, 'apply');
        const args = castArgAsOptionalCons(ctx, 1);
        return func.eval(new FunctionEvaluationContext({
            call: ctx.call,
            func,
            args: args?.toArray() ?? [],
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
        validateArgsLength(ctx, { min: 1 });
        const [funcOrName, ...args] = ctx.args;
        const func = getFuncByNameOrObject(funcOrName, ctx.evaluator.vars.root, 'funcall');
        return func.eval(new FunctionEvaluationContext({
            call: ctx.call,
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
        validateArgsLength(ctx, { min: 1, max: 1 });
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
        validateArgsLength(ctx, { min: 1, max: 1 });
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
        validateArgsLength(ctx, { min: 1, max: 1 });
        return ctx.evaluator.stats.withVerbsosity(() => ctx.eval(ctx.args[0]));
    },
);

export const elapsedTime = new BuiltinFunction(
    {
        name: 'elapsed-time',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 1, max: 1 });
        const hrstart = process.hrtime.bigint();
        const result = ctx.eval(ctx.args[0]);
        const hrend = process.hrtime.bigint();
        const elapsedTimeInNanos = hrend - hrstart;
        const elapsedInMS = Number(elapsedTimeInNanos / BigInt(1000000));
        return Cons.fromArray([result, new FloatAtom(elapsedInMS)]);
    },
);

