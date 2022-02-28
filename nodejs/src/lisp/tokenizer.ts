import { LispSyntaxException, LispUnterminatedExpressionException } from "./exceptions";

export type SymbolToken = {
    type: 'symbol';
    value: string;
    from: CursorPosition;
    to: CursorPosition;
}

export type NumberToken = {
    type: 'number';
    value: string;
    from: CursorPosition;
    to: CursorPosition;
}

export type StringToken = {
    type: 'string';
    value: string;
    from: CursorPosition;
    to: CursorPosition;
}

export type IdentifierToken = {
    type: 'identifier';
    value: string;
    from: CursorPosition;
    to: CursorPosition;
}

export type Token = SymbolToken | NumberToken | StringToken | IdentifierToken;

function isCRLF(char: string) {
    return char === '\n' || char === '\r'
}

function isWhiteSpace(char: string) {
    return isCRLF(char) || char === ' ' || char === '\t';
}

export interface CursorPosition {
    index: number;
    line: number;
    col: number;
}

export class Cursor {
    private index: number = -1;
    private line: number = 1;
    private col: number = 0;
    private _previousPos?: CursorPosition;

    constructor(public readonly text: string) {
        this.next();
    }

    currentChar() {
        return this.text[this.index];
    }

    currentPos(): CursorPosition {
        return { 
            index: this.index,
            line: this.line,
            col: this.col,
        }
    }

    previousPos(): CursorPosition {
        if (this._previousPos) {
            return this._previousPos;
        }
        return { 
            index: 0,
            line: 1,
            col: 1,
        }
    }

    next() {
        this._previousPos = this.currentPos();
        this.index++;
        let c = this.currentChar();
        if (isCRLF(c)) {
            this.line++;
            this.col = 0;
            if (c === '\r' && this.peekNext() === '\n') {
                this.index++;
                c = this.currentChar();
            }
        } else {
            this.col++;
        }
        return c;
    }

    peekNext() {
        if (!this.isEndOfText()) {
            return this.text[this.index + 1];
        }
        return undefined;
    }
    
    isEndOfText() {
        return this.index >= this.text.length;
    }

    isEndOfLine() {
        return this.isEndOfText() || isCRLF(this.currentChar());
    }

    skipWhiteSpace() {
        const from = this.currentPos();
        while (!this.isEndOfText() && isWhiteSpace(this.currentChar())) {
            this.next();
        }
        return {
            from,
            to: this.currentPos(),
        };    
    }

    skipToEndOfLine() {
        const from = this.currentPos();
        while (!this.isEndOfLine()) {
            this.next();
        }
        return {
            from,
            to: this.currentPos(),
        };    
    }
}

function extractString(cursor: Cursor) {
    const from = cursor.currentPos();
    if (cursor.currentChar() === '"') {
        cursor.next();
    } else {
        throw new LispSyntaxException('Expected string to start with a double quote');
    }
    let str = '';
    while (!cursor.isEndOfText()) {
        const c = cursor.currentChar();
        if (c === '"') {
            const to = cursor.currentPos();
            cursor.next();
            return {
                from,
                to,
                str,
            };        
        } else if (isCRLF(c)) {
            throw new LispSyntaxException('Unterminated string');
        } else if (c === '\\') {
            const escapedChar = cursor.next();
            if (escapedChar === undefined || cursor.isEndOfLine()) {
                throw new LispSyntaxException('Expected character after escape char');
            }            
            switch(escapedChar) {
            case '\\':
                str += '\\'
                break;
            case '"':
                str += '"'
                break;
            case 'n':
                str += '\n'
                break;            
            case 't':
                str += '\t'
                break;
            default:
                throw new LispSyntaxException(`Unexpected escaped char: ${escapedChar}`)
            }
        } else {
            str += c;
        }
        cursor.next();
    }
    throw new LispUnterminatedExpressionException('Unterminated string');
}

function extractQuotedIdentifier(cursor: Cursor) {
    const from = cursor.currentPos();
    if (cursor.currentChar() === '|') {
        cursor.next();
    } else {
        throw new LispSyntaxException('Expected text to start with a pipe char');
    }
    let str = '';
    while (!cursor.isEndOfText()) {
        const c = cursor.currentChar();
        if (c === '|') {
            const to = cursor.currentPos();
            cursor.next();
            return {
                from,
                to,
                str,
            };        
        } else if (isCRLF(c)) {
            throw new LispSyntaxException('Unterminated identifier');
        } else if (c === '\\') {
            str += c;
            const escapedChar = cursor.next();
            if (escapedChar === undefined || cursor.isEndOfLine()) {
                throw new LispSyntaxException('Expected character after escape char');
            }            
            str += escapedChar;
        } else {
            str += c;
        }
        cursor.next();
    }
    throw new LispUnterminatedExpressionException('Unterminated identifier');
}

// http://www.lispworks.com/documentation/HyperSpec/Body/02_cd.htm

function extractAtom(cursor: Cursor) {
    const from = cursor.currentPos();
    let str = '';
    while (true) {
        const c = cursor.currentChar();
        if (cursor.isEndOfText() || ['(', ')', '"', "'", ' ', '\n', '\t', '\r'].includes(c)) {
            if (str.length === 0) {
                throw new LispUnterminatedExpressionException('Unterminated expression');
            }
            const to = cursor.previousPos();
            return {
                from,
                to,
                str,
            };
        } else if (c === '\\') { 
            str += c;
            const escapedChar = cursor.next();
            if (escapedChar === undefined || cursor.isEndOfLine()) {
                throw new LispSyntaxException('Expected character after escape char');
            }            
            // inject escaped char
            str += escapedChar;
            cursor.next();
        } else if (c === '|') {
            const res = extractQuotedIdentifier(cursor);
            str += res.str;
        } else {
            str += c;
            cursor.next();
        }
    }
}

function isNumber(text: string) {
    const re = /^[+-]?\d+([.]\d*)?$/gm;
    return re.test(text)
}

export function* tokenize(text: string) : Generator<Token> {
    const cursor = new Cursor(text);
    while (!cursor.isEndOfText()) {
        cursor.skipWhiteSpace();
        const c = cursor.currentChar();
        if (c === undefined) {
            break;
        } else if (c === ';') {
            // skip comments
            cursor.skipToEndOfLine();
        } else if (['(', ')', '.', "'"].includes(c)) {
            const from = cursor.currentPos();
            cursor.next();
            yield { type: 'symbol', value: c, from, to: from }
        } else if (c === '"') {
            const { str, from, to } = extractString(cursor);
            yield { type: 'string', value: str, from, to }
        } else {
            const { str, from, to } = extractAtom(cursor);
            if (isNumber(str)) {
                yield { type: 'number', value: str, from, to }
            } else {
                yield { type: 'identifier', value: str, from, to }
            }
        }        
    }
}
