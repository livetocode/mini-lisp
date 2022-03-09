import { LispParametersException, LispRuntimeException } from "../exceptions";
import { Expr, FunctionArgDefinition, Cons, ExprType, BuiltinFunction, UserFunction, LambdaFunction, TextAtom } from "../types";

// https://www.tutorialspoint.com/lisp/lisp_functions.htm

function castToString(expr: Expr) : string {
    if (expr instanceof TextAtom) {
        return expr.getText();
    }
    throw new LispRuntimeException(`${expr.toString()} is not a string`);
}

function parseArgDeclaration(args: Expr) : FunctionArgDefinition[] {
    if (args.isNil()) {
        return [];
    }
    if (args instanceof Cons) {
        const names = args.toArray().map(x => castToString(x));
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
        if (ctx.args.length < 2) {
            throw new LispParametersException(`Too few arguments to defun`)
        }
        const name = castToString(ctx.args[0]);
        const args = parseArgDeclaration(ctx.args[1]);
        const body = ctx.args.slice(2);
        const f = new UserFunction({name, evalArgs: true, args}, body);
        ctx.globals.set(f.meta.name, f, false);
        return f;
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
        if (ctx.args.length < 2) {
            throw new LispParametersException(`Too few arguments to lambda`)
        }
        const args = parseArgDeclaration(ctx.args[0]);
        const body = ctx.args.slice(1);
        const f = new LambdaFunction({evalArgs: true, args}, body);
        return f;
    },
);