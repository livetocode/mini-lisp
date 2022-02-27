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
            throw new Error(`Unexpected token ${token.type} with value ${token.value}`);
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
            throw new Error('Expected to have a single expression');
        } else if (this.expressions.length === 1) {
            const val = this.expressions[0];
            if (val.type === 'expr') {
                return val.value;
            }
            throw new Error(`Expected single expression but had ${val.type}: ${val.value}`);
        }
        return Nil.instance;
    }

    toListExpr() {
        // special case of an assoc:
        // (1 . 2)
        // (1 2 . 3)
        if (this.expressions.length >= 3 && 
            this.expressions[this.expressions.length - 1].type === 'expr' &&
            this.getSymb(this.expressions.length-2) === 'assoc' &&
            this.expressions[this.expressions.length - 3].type === 'expr') {
            const last = this.getExpr(this.expressions.length - 1);
            if (last) {
                const listItems = this.expressions.slice(0, -2).filter((x => x.type === 'expr')).map(x => x.value as Expr);
                const result = Cons.fromArray(listItems, last);
                return result;
            } else {
                throw new Error('Expected to have 2 expressions for an assoc');
            }
        }
        const expressions = this.expressions.filter(x => x.type === 'expr').map(x => x.value as Expr);
        return Cons.fromArray(expressions);
    }    
    
    getCurrentSymbol() : 'quote' | 'assoc' | undefined {
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
                    throw new Error('Found closing pasrenthesis without matching opening parenthesis');
                }
            } else if (token.value === '.') {
                if (frame.isEmpty()) {
                    throw new Error('Expr required before a dot');
                }
                frame.addSymbol('assoc');
            } else if (token.value === "'") {
                frame.addSymbol('quote');
            } else {
                throw new Error(`Unexpected symbol ${token.type}: ${token.value}`);
            }
        } else {
            if (!frame.isEmpty() && stack.length === 0) {
                throw new Error('You did not open a parenthesis');
            }
            const expr = parseToken(token);
            frame.addExpr(expr);
        }
    }
    return frame.toSingleExpr();
}

