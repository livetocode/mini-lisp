import { LispRuntimeException, LispSymbolNotFoundException } from "./exceptions";
import { Cons, Expr, FunctionEvaluationContext, FunctionExpr, IEvaluationStats, ILispEvaluator, IntegerAtom, LambdaFunction, LispVariable, LispVariables, SymbolAtom } from "./types";


export class EvaluationStats implements IEvaluationStats {
    depth: number = 0;
    verboseCounter: number = 0;
    evalCount: number = 0;
    evalSymbolCount: number = 0;
    evalFunctionCallCount: number = 0;
    evalNonEvaluableExprCount: number = 0;

    clone() {
        const result = new EvaluationStats();
        result.depth = this.depth;
        result.verboseCounter = this.verboseCounter;
        result.evalCount = this.evalCount;
        result.evalSymbolCount = this.evalSymbolCount;
        result.evalFunctionCallCount = this.evalFunctionCallCount;
        result.evalNonEvaluableExprCount = this.evalNonEvaluableExprCount;
        return result;
    }

    diff(other: EvaluationStats): EvaluationStats {
        const result = new EvaluationStats();
        result.depth = this.depth;
        result.verboseCounter = this.verboseCounter;
        result.evalCount = this.evalCount - other.evalCount;
        result.evalSymbolCount = this.evalSymbolCount - other.evalSymbolCount;
        result.evalFunctionCallCount = this.evalFunctionCallCount - other.evalFunctionCallCount;
        result.evalNonEvaluableExprCount = this.evalNonEvaluableExprCount - other.evalNonEvaluableExprCount;
        return result;
    }

    toList(): Expr {
        return Cons.fromArray([
            new Cons(new SymbolAtom('evalCount'), new IntegerAtom(this.evalCount)),
            new Cons(new SymbolAtom('evalSymbolCount'), new IntegerAtom(this.evalSymbolCount)),
            new Cons(new SymbolAtom('evalFunctionCallCount'), new IntegerAtom(this.evalFunctionCallCount)),
            new Cons(new SymbolAtom('evalNonEvaluableExprCount'), new IntegerAtom(this.evalNonEvaluableExprCount)),
        ]);      
    }

    withVerbsosity<T>(callback: () => T): T {
        this.verboseCounter += 1;
        try {
            return callback();
        } finally {
            this.verboseCounter -= 1;
        }
    }
}

export class LispEvaluator implements ILispEvaluator {
    public readonly stats: EvaluationStats;

    constructor(public readonly vars: LispVariables, stats?: EvaluationStats) {
        this.stats = stats ?? new EvaluationStats();
    }

    create(vars: LispVariables): ILispEvaluator {
        return new LispEvaluator(vars, this.stats);
    }

    createChildScope(vars: LispVariable[]) {
        return new LispEvaluator(this.vars.createChildScope(vars), this.stats);
    }
    
    createNewScope(vars: LispVariable[]) {
        return new LispEvaluator(this.vars.root.createChildScope(vars), this.stats);
    }

    eval(expr: Expr): Expr {
        this.stats.evalCount += 1;
        if (expr instanceof SymbolAtom) {
            return this.evalSymbol(expr);
        }
        if (expr instanceof Cons) {
            return this.evalFunctionCall(expr);
        }
        return this.evalNonEvaluableExpr(expr);
    }

    protected evalNonEvaluableExpr(expr: Expr) {
        this.stats.evalNonEvaluableExprCount += 1;
        return expr;
    }

    protected evalSymbol(symbol: SymbolAtom) {
        this.stats.evalSymbolCount += 1;
        const name = symbol.getText();
        const result = this.vars.find(name)?.getValue();
        if (!result) {
            throw new LispSymbolNotFoundException(name, `Variable '${name}' has no value`);
        }
        return result;    
    }

    protected evalFunctionCall(call: Cons) {
        this.stats.evalFunctionCallCount += 1;
        if (call.isNil()) {
            throw new LispRuntimeException('Cannot invoke empty list');
        }
        let nameOrLambda = call.car;
        if (!nameOrLambda || nameOrLambda.isNil()) {
            throw new LispRuntimeException('function call should have a name or lambda');
        }
        if (nameOrLambda.isCons()) {
            nameOrLambda = this.eval(nameOrLambda);
        }
        let func: FunctionExpr | undefined;
        if (nameOrLambda instanceof LambdaFunction) {
            func = nameOrLambda;
        } else if (nameOrLambda instanceof SymbolAtom) {
            const funcVar = this.vars.get(nameOrLambda.getText());
            func = funcVar.getFuncValue();
        }
        if (!func) {
            throw new LispRuntimeException(`${nameOrLambda.toString()} is not a function name; try using a symbol instead`);
        }
        this.stats.depth += 1;
        try {
            const args = call.cdr;
            let argsArray: Expr[] = [];
            if (!args?.isNil()) {
                if (args instanceof Cons) {
                    argsArray = args.toArray();    
                } else {
                    throw new LispRuntimeException('function call args should be a cons');
                }
            }
            if (func.meta.evalArgs) {
                argsArray = argsArray.map(arg => this.eval(arg));
            }
        
            const ctx = new FunctionEvaluationContext({
                func,
                args: argsArray,
                evaluator: this,
            });
            const shouldLog = this.stats.verboseCounter > 0;
            if (shouldLog) {
                const indent = '  '.repeat(Math.min(20, this.stats.depth-1));
                console.log(indent, '<<<', nameOrLambda.toString(), ':', Cons.fromArray(argsArray).toString());
            }
            const result = func.eval(ctx);        
            if (shouldLog) {
                const indent = '  '.repeat(Math.min(20, this.stats.depth-1));
                console.log(indent, '>>>', nameOrLambda.toString(), ':', Cons.fromArray(argsArray).toString(), ' --> ', result.toString());
            }
            return result;    
        } finally {
            this.stats.depth -= 1;
        }
    }
}
