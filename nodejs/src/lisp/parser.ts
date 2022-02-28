import { LispException, LispSyntaxException, LispUnterminatedExpressionException } from "./exceptions";
import { Token, tokenize } from "./tokenizer";
import { Cons, Expr, Nil, NumberAtom, StringAtom, SymbolAtom } from "./types";


function parseToken(token: Token): Expr {
    switch(token.type) {
        case 'identifier':
            return new SymbolAtom(token.value.replaceAll('\\', ''));
        case 'number':
            return NumberAtom.parse(token.value);
        case 'string':
            return new StringAtom(token.value);
        default:
            throw new LispException(`Unexpected token ${token.type} with value ${token.value}`);
    }
}

type StackFrameExpr = {
    type: 'expr';
    value: Expr;
}

type StackFrameSymbol = {
    type: 'symbol';
    value: 'quote' | 'assoc';
}

type StackFrameValue = StackFrameExpr | StackFrameSymbol;

class StackFrame {
    private readonly expressions: Array<StackFrameValue> = [];

    isEmpty() { 
        return this.expressions.filter(x => x.type === 'expr').length === 0; 
    }

    addExpr(expr: Expr): void {  
        const currentSymb = this.getCurrentSymbol();      
        if (currentSymb === 'quote') {
            this.expressions.pop(); // remove quote
            const canInlineExpr = expr.isNil() || expr.isNumber() || expr.isBoolean() || expr.isString();
            this.expressions.push({
                type: 'expr', 
                value: canInlineExpr ? expr : Cons.fromArray([new SymbolAtom('quote'), expr]),
            });
        } else {
            this.expressions.push({
                type: 'expr', 
                value: expr,
            });
        }
    }

    addSymbol(symb: 'quote' | 'assoc') {
        this.expressions.push({
            type: 'symbol', 
            value: symb,
        });
    }

    toSingleExpr() {
        if (this.expressions.length  > 1) {
            throw new LispSyntaxException('Expected to have a single expression');
        } else if (this.expressions.length === 1) {
            const val = this.expressions[0];
            if (val.type === 'expr') {
                return val.value;
            }
            if (val.value === 'quote') {
                throw new LispUnterminatedExpressionException('Expected an expression after a quote');
            }
            throw new LispSyntaxException(`Expected single expression but had symbol ${val.type}: ${val.value}`);
        }
        return Nil.instance;
    }

    toListExpr() {
        // special case of an assoc:
        // (1 . 2)
        // (1 2 . 3)
        if (this.expressions.length >= 3) {
            const a = this.getExpr(this.expressions.length - 3);
            const symb = this.getSymb(this.expressions.length - 2);
            const b = this.getExpr(this.expressions.length - 1);
            if (a && (symb === 'assoc') && b) {
                const listItems = this.getExprSlice(0, -2);
                const result = Cons.fromArray(listItems, b);
                return result;
            }
        }  
        const expressions = this.getExprSlice();
        return Cons.fromArray(expressions);
    }    
    
    private getCurrentSymbol() : 'quote' | 'assoc' | undefined {
        return this.getSymb(this.expressions.length - 1);
    }

    private getExpr(index: number): Expr | undefined {
        const val = this.expressions[index];
        if (val && val.type === 'expr') {
            return val.value;
        }
        return undefined;
    }

    private getSymb(index: number): 'quote' | 'assoc' | undefined {
        const val = this.expressions[index];
        if (val && val.type === 'symbol') {
            return val.value;
        }
        return undefined;
    }

    private getExprSlice(from?: number, to?: number): Expr[] {
        const slice = this.expressions.slice(from, to);
        const result: Expr[] = [];
        for (const e of slice) {
            if (e.type === 'expr') {
                result.push(e.value);
            } else {
                throw new LispSyntaxException('Unexpected token');
            }
        }
        return result;
    }
}

export function parse(text: string) {
    const stack: StackFrame[] = []
    let frame = new StackFrame();
    for (const token of tokenize(text)) {
        if (token.type === 'symbol') {
            if (token.value === '(') {
                stack.push(frame);
                frame = new StackFrame();
            } else if (token.value === ')') {
                const list = frame.toListExpr();
                const previousFrame = stack.pop();
                if (previousFrame) {
                    frame = previousFrame;
                    frame.addExpr(list);
                } else {
                    throw new LispSyntaxException('Found closing pasrenthesis without matching opening parenthesis');
                }
            } else if (token.value === '.') {
                if (frame.isEmpty()) {
                    throw new LispSyntaxException('Expression required before a dot');
                }
                frame.addSymbol('assoc');
            } else if (token.value === "'") {
                frame.addSymbol('quote');
            } else {
                throw new Error(`Unexpected symbol ${token.type}: ${token.value}`);
            }
        } else {
            if (!frame.isEmpty() && stack.length === 0) {
                // TODO: replace with custom Error classes
                throw new LispSyntaxException('Expected a single expression');
            }
            const expr = parseToken(token);
            frame.addExpr(expr);
        }
    }
    if (stack.length > 0) {
        throw new LispUnterminatedExpressionException('Unbalanced list expression');
    }
    return frame.toSingleExpr();
}

