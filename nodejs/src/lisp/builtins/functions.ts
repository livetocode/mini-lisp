import { LispParametersException, LispRuntimeException } from "../exceptions";
import { Expr, FunctionArgDefinition, Cons, ExprType, BuiltinFunction, UserFunction, LambdaFunction, LambdaClosure } from "../types";
import { castArgAsSymbol, getFuncByNameOrObject, toSymbol, validateArgsLength } from "./utils";

// https://www.tutorialspoint.com/lisp/lisp_functions.htm

function parseArgDeclaration(args: Expr) : FunctionArgDefinition[] {
    if (args.isNil()) {
        return [];
    }
    if (args instanceof Cons) {
        const names = args.toArray().map(x => toSymbol(x));
        return names.map(x => ({ name: x, type: new ExprType('expr')}));
    }
    throw new LispParametersException('Expected args to be a cons');
}

export const defun = new BuiltinFunction(
    {
        name: 'defun',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 2 });
        const nameArg = castArgAsSymbol(ctx, 0);
        const name = nameArg.getText();
        const args = parseArgDeclaration(ctx.args[1]);
        const body = ctx.args.slice(2);
        const f = new UserFunction({name, evalArgs: true, args}, body);
        ctx.evaluator.vars.root.set(f.meta.name, false, undefined, f);
        return nameArg;
    },
);

export const lambda = new BuiltinFunction(
    {
        name: 'lambda',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 2 });
        const args = parseArgDeclaration(ctx.args[0]);
        const body = ctx.args.slice(1);
        const f = new LambdaFunction({evalArgs: true, args}, body);
        return f;
    },
);

export const _function = new BuiltinFunction(
    {
        name: 'function',
        evalArgs: false,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 1, max: 1 });
        let nameOrFunc = ctx.args[0];
        if (nameOrFunc.isCons()) {
            nameOrFunc = ctx.eval(nameOrFunc);
        }
        let func = getFuncByNameOrObject(nameOrFunc, ctx.evaluator.vars, 'function');
        if (func instanceof LambdaFunction) {
            func = new LambdaClosure(func, ctx.evaluator.vars);
        } 
        return func;
    },
);

export const symbol_function = new BuiltinFunction(
    {
        name: 'symbol-function',
        evalArgs: true,
        args: [],
        returnType: new ExprType('expr'),
    },
    (ctx) => {
        validateArgsLength(ctx, { min: 1, max: 1 });
        const name = castArgAsSymbol(ctx, 0).getText();
        const func = ctx.evaluator.vars.find(name)?.getFuncValue();
        if (!func) {
            throw new LispRuntimeException(`Undefined function ${name}`);
        }
        return func;
    },
);

// TODO: implement flet
// http://www.lispworks.com/documentation/lw70/CLHS/Body/s_flet_.htm