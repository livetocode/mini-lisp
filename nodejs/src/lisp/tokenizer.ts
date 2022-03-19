import { CursorPosition, LispSyntaxException, LispUnterminatedExpressionException } from "./exceptions";

export type SymbolToken = {
    type: 'symbol';
    value: string;
    from: CursorPosition;
    to: CursorPosition;
}

export type LParToken = {
    type: 'lpar';
    value: string;
    from: CursorPosition;
    to: CursorPosition;
}

export type RParToken = {
    type: 'rpar';
    value: string;
    from: CursorPosition;
    to: CursorPosition;
}

export type QuoteToken = {
    type: 'quote';
    value: string;
    from: CursorPosition;
    to: CursorPosition;
}

export type GetFuncToken = {
    type: 'getfunc';
    value: string;
    from: CursorPosition;
    to: CursorPosition;
}

export type IntegerToken = {
    type: 'integer';
    value: string;
    from: CursorPosition;
    to: CursorPosition;
}

export type FloatToken = {
    type: 'float';
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

export type CommentToken = {
    type: 'comment';
    value: string;
    from: CursorPosition;
    to: CursorPosition;
}


export type Token = SymbolToken | IntegerToken | FloatToken | StringToken | CommentToken | LParToken | RParToken | QuoteToken | GetFuncToken;

function isCRLF(char: string) {
    return char === '\n' || char === '\r'
}

function isWhiteSpace(char: string) {
    return isCRLF(char) || char === ' ' || char === '\t' || char === '\f';
}

export class Cursor {
    private index: number = -1;
    private line: number = 1;
    private col: number = 0;

    constructor(public readonly text: string, public readonly filename?: string) {
        this.next();
    }

    currentChar() {
        return this.text[this.index];
    }

    currentPos(): CursorPosition {
        return { 
            filename: this.filename,
            index: this.index,
            line: this.line,
            col: this.col,
        }
    }

    next() {
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

    isWhiteSpace() {
        return !this.isEndOfText() && isWhiteSpace(this.currentChar());
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
            str: this.text.slice(from.index, this.index),
        };    
    }

    ensureCurrentChar(c: string) {
        if (this.currentChar() !== c) {
            throw new LispSyntaxException(this.currentPos(), `Expected current char to be '${c}'`);
        }        
    }
}

const allowedEscapedChars: any = {
    'b': '\b',
    'f': '\f',
    'r': '\r',
    'n': '\n',
    't': '\t',
    'v': '\v',
    '"': '"',
    '\\': '\\',
}

function extractEscapedChar(cursor: Cursor, mapChar: boolean) {
    cursor.ensureCurrentChar('\\');
    const escapedChar = cursor.next();
    if (escapedChar === undefined || cursor.isEndOfLine()) {
        throw new LispSyntaxException(cursor.currentPos(), 'Expected character after escape char');
    }
    if (mapChar) {
        const result = allowedEscapedChars[escapedChar];
        if (!result) {
            throw new LispSyntaxException(cursor.currentPos(), `Unrecognized escaped char '${escapedChar}' at position`);
        }
        return result;
    }
    return escapedChar;
}

function extractString(cursor: Cursor) {
    const from = cursor.currentPos();
    cursor.ensureCurrentChar('"');
    cursor.next();
    let str = '';
    while (!cursor.isEndOfText()) {
        const c = cursor.currentChar();
        if (c === '"') {
            const to = cursor.currentPos();
            cursor.next();
            return { from, to, str };   
        } else if (c === '\\') {
            str += extractEscapedChar(cursor, true);
        } else {
            str += c;
        }
        cursor.next();
    }
    throw new LispUnterminatedExpressionException(cursor.currentPos(), 'Unterminated string');
}

interface AtomParsingState { 
    type: 'integer' | 'float' | 'symbol';
    isSigned: boolean;
    hasExponent: boolean;
    hasSignedExponent: boolean;
}

function evalNextAtomState(c: string, str: string, state: AtomParsingState) {
    // sniff the type of the atom:
    // while it conforms to a number, detect wether it is an integer or a float.
    // Otherwise make it a symbol.

    if (state.type === 'symbol') {
        return;
    }
    if (c === '-' || c === '+') {
        if (state.hasExponent) {
            if (state.hasSignedExponent) {
                state.type = 'symbol';
            } else {
                state.hasSignedExponent = true;
            }
        } else {
            if (state.isSigned || str.length > 0) {
                state.type = 'symbol';
            } else {
                state.isSigned = true;
            }    
        }
    } else if (c === '.') {
        if (state.type === 'float') {
            state.type = 'symbol';
        } else {
            state.type = 'float';
        }
    } else if (c === 'e' || c === 'E') {
        if (state.hasExponent) {
            state.type = 'symbol';
        } else {
            state.type = 'float';
            state.hasExponent = true;
        }
    } else if (!'0123456789'.includes(c)) {
        state.type = 'symbol';
    }
}

// http://www.lispworks.com/documentation/HyperSpec/Body/02_cd.htm

function extractAtom(cursor: Cursor) {
    const from = cursor.currentPos();
    let to = from;
    let state: AtomParsingState = { type: 'integer', isSigned: false, hasExponent: false, hasSignedExponent: false};
    let str = '';
    while (true) {
        const c = cursor.currentChar();
        if (cursor.isEndOfText() || cursor.isWhiteSpace() || "()'\"".includes(c)) {
            if (str.length === 0) {
                throw new LispUnterminatedExpressionException(cursor.currentPos(), 'Missing expression');
            } else if (str === '.' || str === '-' || str === '+' || str === 'e' || str === 'E') {
                state.type = 'symbol';
            }
            return { from, to, str, type: state.type };
        } else if (c === '\\') { 
            state.type = 'symbol';
            str += extractEscapedChar(cursor, false);
            to = cursor.currentPos();
            cursor.next();
        } else {
            evalNextAtomState(c, str, state);
            str += c;
            to = cursor.currentPos();
            cursor.next();
        }
    }
}

export function* tokenize(text: string, filename?: string) : Generator<Token> {
    const cursor = new Cursor(text, filename);
    while (!cursor.isEndOfText()) {
        cursor.skipWhiteSpace();
        const c = cursor.currentChar();
        if (c === undefined) {
            break;
        } else if (c === ';') {
            const { str, from, to } = cursor.skipToEndOfLine();
            yield { type: 'comment', value: str, from, to }
        } else if (c === '(') {
            const from = cursor.currentPos();
            cursor.next();
            yield { type: 'lpar', value: c, from, to: from }
        } else if (c === ')') {
            const from = cursor.currentPos();
            cursor.next();
            yield { type: 'rpar', value: c, from, to: from }
        } else if (c === "'") {
            const from = cursor.currentPos();
            cursor.next();
            yield { type: 'quote', value: c, from, to: from }
        } else if (c === "#") {
            const from = cursor.currentPos();
            cursor.next();
            if (cursor.currentChar() !== "'") {
                throw new LispSyntaxException(from, 'Expected a quote after #');
            }
            cursor.next();
            yield { type: 'getfunc', value: c, from, to: cursor.currentPos() }
        } else if (c === '"') {
            const { str, from, to } = extractString(cursor);
            yield { type: 'string', value: str, from, to }
        } else {
            const { str, type, from, to } = extractAtom(cursor);
            yield { type, value: str, from, to }
        }        
    }
}
