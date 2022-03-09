import { LispRuntimeException } from "./exceptions";
import { Cons, Expr, FunctionEvaluationContext, FunctionExpr, LispVariables, SymbolAtom } from "./types";

export function evalFunctionCall(options: {
    expr: Expr,
    globals: LispVariables,
    locals: LispVariables,
}): Expr {
    if (options.expr.isNil()) {
        throw new LispRuntimeException('Cannot invoke empty list');
    }
    const name = options.expr.getCar();
    if (!name || name.isNil()) {
        throw new LispRuntimeException('function call should have a name');
    }
    if (!(name instanceof SymbolAtom)) {
        throw new LispRuntimeException('function name should be a symbol');
    }
    const args = options.expr.getCdr();
    let argsArray: Expr[] = [];
    if (!args?.isNil()) {
        if (args instanceof Cons) {
            argsArray = args.toArray();    
        } else {
            throw new LispRuntimeException('function call args should be a cons');
        }
    }
    const func = options.locals.resolve(name.getValue());
    if (!(func instanceof FunctionExpr)) {
        throw new LispRuntimeException(`symbol '${name}' is not a function`);
    }
    if (func.meta.evalArgs) {
        argsArray = argsArray.map(arg => evaluator({ 
            expr: arg, 
            globals: options.globals, 
            locals: options.locals, 
        }));
    }

    const ctx = new FunctionEvaluationContext({
        func,
        args: argsArray,
        globals: options.globals,
        locals: options.locals,
        evaluator,
    });
    return func.eval(ctx);
}

export function evaluator(options: {
    expr: Expr,
    globals: LispVariables,
    locals: LispVariables,
}): Expr {
    if (options.expr instanceof SymbolAtom) {
        return options.locals.resolve(options.expr.getValue());
    }
    if (options.expr.isCons()) {
        return evalFunctionCall(options);
    }
    return options.expr;
}
