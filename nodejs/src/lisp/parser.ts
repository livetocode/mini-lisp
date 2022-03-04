import { CursorPosition, LispException, LispSyntaxException, LispUnterminatedExpressionException } from "./exceptions";
import { Token, tokenize } from "./tokenizer";
import { Cons, Expr, FloatAtom, IntegerAtom, Nil, QuotedExpr, StringAtom, SymbolAtom } from "./types";

export interface ParsedExpr {
    expr: Expr;
    pos: CursorPosition;
}

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

    addExpr(expr: Expr, pos: CursorPosition): void {  
        if (this.type === 'root' && !this.isEmpty()) {
            throw new LispSyntaxException(pos, 'Expected to have a single expression');
        }
        if (this.type === 'quote' && !this.isEmpty()) {
            throw new LispSyntaxException(pos, 'Expected to have a single quoted expression');
        }
        this.expressions.push(expr);
    }

    toSingleExpr(pos: CursorPosition) {
        if (this.expressions.length  > 1) {
            throw new LispSyntaxException(pos, 'Expected to have a single expression');
        } else if (this.expressions.length === 1) {
            return this.expressions[0];
        } else if (this.type === 'quote') {
            throw new LispUnterminatedExpressionException(pos, 'Missing expression after a quote');
        }
        return Nil.instance;
    }

    toListExpr(pos: CursorPosition) {
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
                throw new LispSyntaxException(pos, 'left expression required for an assoc');
            }
        }  
        return Cons.fromArray(this.expressions);
    }    
}

function propagateQuotedExpression(frame: StackFrame, stack: StackFrame[], pos: CursorPosition) {
    while (frame.type === 'quote') {
        const expr = QuotedExpr.fromExpr(frame.toSingleExpr(pos));

        const previousFrame = stack.pop();
        if (previousFrame) {
            frame = previousFrame;
            frame.addExpr(expr, pos);
        } else {
            throw new LispSyntaxException(pos, 'Expected a stacked frame');
        }
    }
    return frame;
}

export function parse(text: string, filename?: string): Expr {
    const results: Expr[] = [];
    for (const {expr, pos} of parseAll(text, filename)) {
        if (results.length > 0) {
            throw new LispSyntaxException(pos, 'Expected to have a single expression');
        }
        results.push(expr);
    }
    if (results.length === 0) {
        return Nil.instance;
    }
    return results[0];
}

export function* parseAll(text: string, filename?: string): Generator<ParsedExpr>  {
    const stack: StackFrame[] = []
    let frame = new StackFrame('root');
    let lastPos: CursorPosition = { index: 0, line: 1, col: 1, filename};
    for (const token of tokenize(text, filename)) {
        lastPos = token.to;
        if (token.type === 'comment') {
            // ignore comments
        } else if (token.type === 'lpar') {
            stack.push(frame);
            frame = new StackFrame('list');
        } else if (token.type === 'rpar') {
            const list = frame.toListExpr(lastPos);
            const previousFrame = stack.pop();
            if (previousFrame) {
                frame = previousFrame;
                frame.addExpr(list, lastPos);
                frame = propagateQuotedExpression(frame, stack, lastPos);
            } else {
                throw new LispSyntaxException(token.to, 'Found closing parenthesis without matching opening parenthesis');
            }
        } else if (token.type === 'quote') {
            stack.push(frame);
            frame = new StackFrame('quote');
        } else {
            const expr = parseToken(token);
            frame.addExpr(expr, lastPos);
            frame = propagateQuotedExpression(frame, stack, lastPos);
        }
        if (frame.type === 'root' && !frame.isEmpty()) {
            const expr = frame.toSingleExpr(lastPos);
            yield { expr, pos: lastPos };
            frame = new StackFrame('root');
        }
    }
    if (frame.type === 'quote') {
        throw new LispUnterminatedExpressionException(lastPos, 'Missing expression after a quote');
    }
    if (stack.length > 0) {
        throw new LispUnterminatedExpressionException(lastPos, 'Unbalanced list expression');
    }
    // return frame.toSingleExpr(lastPos);
}

