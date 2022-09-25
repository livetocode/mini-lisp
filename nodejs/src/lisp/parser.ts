import { CursorPosition, LispException, LispSyntaxException, LispUnterminatedExpressionException } from "./exceptions";
import { Token, tokenize } from "./tokenizer";
import { BooleanAtom, Cons, Expr, FloatAtom, GetFuncQuotedExpr, IntegerAtom, Nil, QuotedExpr, StringAtom, SymbolAtom } from "./types";

export interface ParsedExpr {
    expr: Expr;
    pos: CursorPosition;
}

function isSymbol(expr: Expr, symbol: string) {
    if (expr instanceof SymbolAtom) {
        return expr.getValue() === symbol;
    }
    return false;
}

function listToCons(expr: Expr[], pos: CursorPosition): Cons | Nil {
    // special case of an assoc:
    // (1 . 2)
    // (1 2 . 3)
    if (expr.length >= 2) {
        const a = expr[expr.length - 3];
        const dot = expr[expr.length - 2];
        const b = expr[expr.length - 1];
        if (dot && b && isSymbol(dot, '.')) {
            if (a) {
                const listItems = expr.slice(0, -2);
                const result = Cons.fromArray(listItems, b);
                return result;    
            }
            throw new LispSyntaxException(pos, 'left expression required for an assoc');
        }
    }  
    return Cons.fromArray(expr);
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
    const tokenizer = tokenize(text, filename);
    while (true) {
        const result = parseSingleExpr(tokenizer);
        if (result) {
            yield result;
        } else {
            break;
        }
    }
}

function getNextToken(tokenizer: Generator<Token, Token, Token>): Token | null  {
    while (true) {
        const nextResult = tokenizer.next();
        if (nextResult.done) {
            return null;   
        }
        const token = nextResult.value;
        if (token.type === 'comment') {
            // ignore comments
        } else {
            return token;
        }
    }
}

function parseToken(token: Token, tokenizer: Generator<Token, Token, Token>): ParsedExpr {
    switch(token.type) {
        case 'symbol':
            if (token.value === 'nil') {
                return { expr: Nil.instance, pos: token.to };
            }
            if (token.value === 't') {
                return { expr: BooleanAtom.True, pos: token.to };
            }
            return { expr: new SymbolAtom(token.value), pos: token.to };
        case 'integer':
            return { expr: new IntegerAtom(parseInt(token.value, 10)), pos: token.to };
        case 'float':
            return { expr: new FloatAtom(parseFloat(token.value)), pos: token.to };
        case 'string':
            return { expr: new StringAtom(token.value), pos: token.to };
        case 'lpar':
            const nestedExpr = parseMultipleExpr(tokenizer, 'rpar');
            if (nestedExpr) {
                return { expr: nestedExpr, pos: token.from };
            } else {
                throw new LispUnterminatedExpressionException(token.from, 'Unbalanced list expression');
            }
        case 'rpar':
            throw new LispSyntaxException(token.to, 'Found closing parenthesis without matching opening parenthesis');
        case 'quote':
            const quotedExpr = parseSingleExpr(tokenizer);
            if (quotedExpr) {
                return { expr: QuotedExpr.fromExpr(quotedExpr.expr), pos: token.to };
            } else {
                throw new LispUnterminatedExpressionException(token.to, 'Missing expression after a quote');
            }
        case 'getfunc':
            const referencedFunc = parseSingleExpr(tokenizer);
            if (referencedFunc) {
                return { expr: GetFuncQuotedExpr.fromExpr(referencedFunc.expr), pos: token.to };
            } else {
                throw new LispUnterminatedExpressionException(token.to, 'Missing expression after a getfunc');
            }
        default:
            throw new LispException(`Unexpected token ${token.type} with value ${token.value}`);
    }
}

function parseSingleExpr(tokenizer: Generator<Token, Token, Token>): ParsedExpr | null  {
    const token = getNextToken(tokenizer);
    if (token === null) {
        return null;
    }
    return parseToken(token, tokenizer);
}

function parseMultipleExpr(tokenizer: Generator<Token, Token, Token>, closingToken: string): Expr | null {
    const result: Expr[] = [];
    while(true) {
        const token = getNextToken(tokenizer);
        if (token === null) {
            return null;
        } else if (token.type === closingToken) {
            return listToCons(result, token.to);
        } else {
            result.push(parseToken(token, tokenizer).expr);
        }
    }
}

