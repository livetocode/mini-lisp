/* Hierarchy:
LispException
  |__ LispSyntaxException
  |     |__ LispUnterminatedExpressionException
  |__ LispRuntimeException
        |__ LispStackOverflowException
        |__ LispSymbolNotFoundException
*/


export class LispException extends Error {

}

export class LispRuntimeException extends LispException {

}

export class LispStackOverflowException extends LispRuntimeException {

}

export class LispSymbolNotFoundException extends LispRuntimeException {

}

export class LispSyntaxException extends LispException {

}

export class LispUnterminatedExpressionException extends LispSyntaxException {

}