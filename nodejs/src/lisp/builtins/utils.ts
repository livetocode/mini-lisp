import { LispParametersException } from "../exceptions";
import { Expr, LispFunction, LispVariables, NumberAtom, SymbolAtom } from "../types";

export function toSymbol(expr: Expr): string {
    if (expr instanceof SymbolAtom) {
        return expr.getText();
    }
    throw new LispParametersException(`${expr.getType()} is not a symbol`);
}

export function toNumber(expr: Expr) : number {
    if (expr instanceof NumberAtom) {
        return expr.getNumber();
    }
    throw new LispParametersException(`${expr.toString()} is not a number`);
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

