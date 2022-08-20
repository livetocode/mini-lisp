import { LispParametersException } from "../exceptions";
import { Cons, Expr, FunctionEvaluationContext, LispFunction, LispVariables, NumberAtom, StringAtom, SymbolAtom } from "../types";

export function toSymbol(expr: Expr): string {
    if (expr instanceof SymbolAtom) {
        return expr.getText();
    }
    throw new LispParametersException(`${expr.getType()} is not a symbol`);
}

export function toString(expr: Expr) : string {
    if (expr instanceof StringAtom) {
        return expr.getText();
    }
    throw new LispParametersException(`${expr.toString()} is not a string`);
}

export function toNumber(expr: Expr) : number {
    if (expr instanceof NumberAtom) {
        return expr.getNumber();
    }
    throw new LispParametersException(`${expr.toString()} is not a number`);
}

export function toBoolean(expr: Expr) : boolean {
    return expr.isTrue();
}

export function toList(expr: Expr) {
    if (expr.isNil()) {
        return [];
    }
    if (expr instanceof Cons) {
        return expr.toArray();
    }
    throw new LispParametersException(`Expected '${expr.toString()}' to be a list`);
}

export function getFuncByNameOrObject(expr: Expr, vars: LispVariables, builtinName: string): LispFunction {
    if (expr instanceof SymbolAtom) {
        const name = expr.getText();
        const f = vars.find(name)?.getFuncValue();
        if (f) {
            return f;
        }
        throw new LispParametersException(`Undefined function ${name}`);
    }
    if (expr instanceof LispFunction) {
        return expr;
    }
    throw new LispParametersException(`${builtinName} requires a symbol or function object as first parameter`);
}

export function getSingleArgAsList(ctx: FunctionEvaluationContext): Cons | null {
    validateArgsLength(ctx, { min: 1, max: 1});
    return castArgAsOptionalCons(ctx, 0);
}

export function validateArgsLength(ctx: FunctionEvaluationContext, options: { min?: number, max?: number, isEven?: boolean}): void {
    const args = ctx.args;
    const name = ctx.func.getName();
    if (options.min && options.max && options.min === options.max && args.length !== options.min) { 
        if (args.length < options.min) {
            throw new LispParametersException(`${name}: too few arguments provided! Expected ${options.min} but received ${args.length}.`);
        } else {
            throw new LispParametersException(`${name}: too many arguments provided! Expected ${options.max} but received ${args.length}.`);            
        }
    }
    if (options.min) {
        if (args.length < options.min) {
            throw new LispParametersException(`${name}: too few arguments provided! Expected at least ${options.min} but received ${args.length}.`);
        }
    }
    if (options.max) {
        if (args.length > options.max) {
            throw new LispParametersException(`${name}: too many arguments provided! Expected at most ${options.max} but received ${args.length}.`);
        }        
    }
    if (options.isEven !== undefined) {
        const isEven = args.length % 2 === 0;
        if (options.isEven !== isEven) {
            throw new LispParametersException('${name}: too few arguments provided! Expected an even number of arguments.');
        }
    }
}

export function castArgAsSymbol(ctx: FunctionEvaluationContext, position: number): SymbolAtom {
    const arg = ctx.args[position];
    if (arg instanceof SymbolAtom) {
        return arg;
    }
    throw new LispParametersException(`${ctx.func.getName()}: expected arg #${position} to be a symbol but received ${arg.getType()}`);
}

export function castArgAsString(ctx: FunctionEvaluationContext, position: number): StringAtom {
    const arg = ctx.args[position];
    if (arg instanceof StringAtom) {
        return arg;
    }
    throw new LispParametersException(`${ctx.func.getName()}: expected arg #${position} to be a string but received ${arg.getType()}`);
}

export function castArgAsCons(ctx: FunctionEvaluationContext, position: number): Cons {
    const arg = ctx.args[position];
    if (arg instanceof Cons) {
        return arg;
    }
    throw new LispParametersException(`${ctx.func.getName()}: expected arg #${position} to be a list but received ${arg.getType()}`);
}

export function castArgAsOptionalCons(ctx: FunctionEvaluationContext, position: number): Cons | null {
    const arg = ctx.args[position];
    if (arg.isNil()) {
        return null;
    }
    if (arg instanceof Cons) {
        return arg;
    }
    throw new LispParametersException(`${ctx.func.getName()}: expected arg #${position} to be a list but received ${arg.getType()}`);
}
