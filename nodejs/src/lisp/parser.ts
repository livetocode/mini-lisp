import { LispException, LispSyntaxException, LispUnterminatedExpressionException } from "./exceptions";
import { Token, tokenize } from "./tokenizer";
import { Cons, Expr, FloatAtom, IntegerAtom, Nil, QuotedExpr, StringAtom, SymbolAtom } from "./types";


function parseToken(token: Token): Expr {
    switch(token.type) {
        case 'symbol':
            return new SymbolAtom(token.value);
        case 'integer':
            return new IntegerAtom(parseInt(token.value, 10));
        case 'float':
            return new FloatAtom(parseFloat(token.value));
        case 'string':
            return new StringAtom(token.value);
        default:
            throw new LispException(`Unexpected token ${token.type} with value ${token.value}`);
    }
}

function isSymbol(expr: Expr, symbol: string) {
    if (expr instanceof SymbolAtom) {
        return expr.getValue() === symbol;
    }
    return false;
}

type StackFrameType = 'root' | 'list' | 'quote';

class StackFrame {
    private readonly expressions: Array<Expr> = [];
    
    constructor(public readonly type: StackFrameType) {}

    isEmpty() { 
        return this.expressions.length === 0; 
    }

    addExpr(expr: Expr): void {  
        if (this.type === 'root' && !this.isEmpty()) {
            throw new LispSyntaxException('Expected to have a single expression');
        }
        if (this.type === 'quote' && !this.isEmpty()) {
            throw new LispSyntaxException('Expected to have a single quoted expression');
        }
        this.expressions.push(expr);
    }

    toSingleExpr() {
        if (this.expressions.length  > 1) {
            throw new LispSyntaxException('Expected to have a single expression');
        } else if (this.expressions.length === 1) {
            return this.expressions[0];
        }
        return Nil.instance;
    }

    toListExpr() {
        // special case of an assoc:
        // (1 . 2)
        // (1 2 . 3)
        if (this.expressions.length >= 2) {
            const a = this.expressions[this.expressions.length - 3];
            const dot = this.expressions[this.expressions.length - 2];
            const b = this.expressions[this.expressions.length - 1];
            if (dot && b && isSymbol(dot, '.')) {
                if (a) {
                    const listItems = this.expressions.slice(0, -2);
                    const result = Cons.fromArray(listItems, b);
                    return result;    
                }
                throw new LispSyntaxException('left expression required for an assoc');
            }
        }  
        return Cons.fromArray(this.expressions);
    }    
}

function propagateQuotedExpression(frame: StackFrame, stack: StackFrame[]) {
    while (frame.type === 'quote') {
        if (frame.isEmpty()) {
            throw new LispUnterminatedExpressionException('Expected expression after a quote');
        }
        const expr = QuotedExpr.fromExpr(frame.toSingleExpr());

        const previousFrame = stack.pop();
        if (previousFrame) {
            frame = previousFrame;
            frame.addExpr(expr);
        } else {
            throw new LispSyntaxException('Expected a stacked frame');
        }
    }
    return frame;
}

export function parse(text: string) {
    const stack: StackFrame[] = []
    let frame = new StackFrame('root');
    for (const token of tokenize(text)) {
        if (token.type === 'comment') {
            // ignore comments
        } else if (token.type === 'lpar') {
            stack.push(frame);
            frame = new StackFrame('list');
        } else if (token.type === 'rpar') {
            const list = frame.toListExpr();
            const previousFrame = stack.pop();
            if (previousFrame) {
                frame = previousFrame;
                frame.addExpr(list);
                frame = propagateQuotedExpression(frame, stack);
            } else {
                throw new LispSyntaxException('Found closing pasrenthesis without matching opening parenthesis');
            }
        } else if (token.type === 'quote') {
            stack.push(frame);
            frame = new StackFrame('quote');
        } else {
            if (frame.type === 'root' && !frame.isEmpty()) {
                throw new LispSyntaxException('Expected a single expression');
            }
            const expr = parseToken(token);
            frame.addExpr(expr);
            frame = propagateQuotedExpression(frame, stack);
        }
    }
    if (stack.length > 0) {
        throw new LispUnterminatedExpressionException('Unbalanced list expression');
    }
    return frame.toSingleExpr();
}

