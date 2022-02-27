export type SymbolToken = {
    type: 'symbol';
    value: string;
}

export type NumberToken = {
    type: 'number';
    value: string;
}

export type StringToken = {
    type: 'string';
    value: string;
}

export type IdentifierToken = {
    type: 'identifier';
    value: string;
}

export type Token = SymbolToken | NumberToken | StringToken | IdentifierToken;

function skipWhiteSpace(text: string, from: number) {
    let i = from;
    while (i < text.length && [' ', '\t', '\r', '\n'].includes(text[i])) {
        i++;
    }
    return i;
}

function extractString(text: string, from: number) {
    let i = from;
    if (text[i] === '"') {
        i++;
    }    
    let str = '';
    while (i < text.length && text[i] != '"') {
        const c = text[i];
        if (c === '\\') {
            i++;
            if (i >= text.length) {
                throw new Error('Expected character after escape char');
            }
            switch(text[i]) {
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
                throw new Error(`Unexpected escaped char: ${text[i+1]}`)
            }
            i++;
        } else {
            str += c;
            i++;    
        }
    }
    if (i >= text.length) {
        throw new Error('Expected double quote at the end of the string');
    }
    i++;
    return {
        fromIndex: from,
        toIndex: i,
        str,
    };
}

function extractQuotedIdentifier(text: string, from: number) {
    let i = from;
    if (text[i] === '|') {
        i++;
    }    
    let str = '';
    while (i < text.length && text[i] != '|') {
        let c = text[i];
        if (c === '\\') {
            str += c;
            i++;
            if (i >= text.length) {
                throw new Error('Expected character after escape char');
            }
            c = text[i];
            str += c;
            i++;
        } else {
            str += c;
            i++;    
        }
    }
    if (i >= text.length) {
        throw new Error('Expected pipe at the end of the identifier');
    }
    i++;
    return {
        fromIndex: from,
        toIndex: i,
        str,
    };
}

// http://www.lispworks.com/documentation/HyperSpec/Body/02_cd.htm

function extractAtom(text: string, from: number) {
    let i = from;
    let str = '';
    while (i < text.length) {
        let c = text[i];
        if (c === '\\') { 
            str += c;
            i++;
            // inject escaped char
            if (i < text.length) {
                c = text[i];
                str += c;
                i++;
            }
            continue;
        } else if (c === '|') {
            const res = extractQuotedIdentifier(text, i);
            i = res.toIndex;
            str += res.str;
            continue;
        }

        if (['(', ')', '"', "'", ' ', '\n', '\t', '\r'].includes(c)) {
            break;
        }
        str += c;
        i++;
    }
    return {
        fromIndex: from,
        toIndex: i,
        str,
    };
}

function skipToEndOfLine(text: string, from: number) {
    let i = from;
    while (i < text.length && text[i] !== '\n') {
        i++;
    }
    return i;
}

function isNumber(text: string) {
    const re = /^[+-]?\d+([.]\d*)?$/gm;
    return re.test(text)
}

export function* tokenize(text: string) : Generator<Token> {
    let fromIndex = 0;
    while (fromIndex < text.length) {
        fromIndex = skipWhiteSpace(text, fromIndex);
        if (fromIndex < text.length) {
            const c = text[fromIndex];
            if (c === ';') {
                // skip comments
                fromIndex = skipToEndOfLine(text, fromIndex+1);
            } else if (['(', ')', '.', "'"].includes(c)) {
                yield { type: 'symbol', value: c }
                fromIndex++;
            } else if (c === '"') {
                const { toIndex, str } = extractString(text, fromIndex);
                yield { type: 'string', value: str }
                fromIndex = toIndex;
            } else {
                const { toIndex, str } = extractAtom(text, fromIndex);
                if (isNumber(str)) {
                    yield { type: 'number', value: str }

                } else {
                    yield { type: 'identifier', value: str }
                }
                fromIndex = toIndex;
            }
        }
    }
}
