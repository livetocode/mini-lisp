/* Hierarchy:
LispException
  |__ LispSyntaxException
  |     |__ LispUnterminatedExpressionException
  |__ LispRuntimeException
        |__ LispStackOverflowException
        |__ LispSymbolNotFoundException
*/

export interface CursorPosition {
    filename?: string;
    index: number;
    line: number;
    col: number;
}

export class LispException extends Error {

}

export class LispRuntimeException extends LispException {

}

export class LispStackOverflowException extends LispRuntimeException {

}

export class LispSymbolNotFoundException extends LispRuntimeException {

}

export class LispSyntaxException extends LispException {
    constructor(public readonly pos: CursorPosition, message: string) {
        super(`${pos.filename ?? '<STDIN>'}:${pos.line}:${pos.col} - error: ${message}`);
    }    
}

export class LispUnterminatedExpressionException extends LispSyntaxException {

}