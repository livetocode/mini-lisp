/* 
Hierarchy:
Expr
  |_Cons
  |   |_QuotedExpr
  |_Atom
    |_Nil
    |_NumberAtom
    | |_IntegerAtom
    | |_FloatAtom
    |_BooleanAtom
    |-TextAtom
      |_StringAtom
      |_SymbolAtom
*/


// https://en.wikipedia.org/wiki/S-expression

export abstract class Expr {
    abstract toString(): string;

    abstract isCons(): boolean;

    abstract isAtom(): boolean;

    isSymbol(): boolean {
        return false;
    }

    isNumber(): boolean {
        return false;
    }

    isText(): boolean {
        return false;
    }

    isString(): boolean {
        return false;
    }

    isBoolean(): boolean {
        return false;
    }

    isNil(): boolean {
        return false;
    }

    isFalse(): boolean {
        return this.isNil();
    }

    isTrue(): boolean {
        return !this.isNil();
    }

    isQuote(): boolean {
        return false;
    }

    getCar(): Expr | null {
        return null;
    }

    getCdr(): Expr | null {
        return null;
    }
}

export abstract class Atom extends Expr {
    override isAtom(): boolean {
        return true;
    }

    override isCons(): boolean {
        return false;
    }

    abstract getValue(): any;
}

export class Nil extends Atom {
    override getValue(): any {
        return null;
    }

    override toString(): string {
        return 'nil';
    }

    override isNil(): boolean {
        return true;
    }

    static instance: Nil = new Nil()
}

export class BooleanAtom extends Atom {
    constructor(private readonly value: boolean) {
        super();
    }

    override getValue() {
        return this.value;
    }

    override toString(): string {
        if (this.value) {
            return 'T';
        }
        return 'nil';
    }

    override isNil(): boolean {
        return this.isFalse();
    }

    override isBoolean(): boolean {
        return true;
    }

    override isFalse(): boolean {
        return this.value === false;
    }

    override isTrue(): boolean {
        return this.value === true;
    }

    static False = new BooleanAtom(false);
    static True = new BooleanAtom(true);
}

export abstract class NumberAtom extends Atom {
    override isNumber(): boolean {
        return true;
    }
}

export class IntegerAtom extends NumberAtom {
    constructor(private readonly value: number) {
        super();
    }

    override getValue() {
        return this.value;
    }

    override toString(): string {
        return this.value.toString();
    }
}

export class FloatAtom extends NumberAtom {
    constructor(private readonly value: number) {
        super();
    }

    override getValue() {
        return this.value;
    }

    override toString(): string {
        return this.value.toString();
    }
}

export abstract class TextAtom extends Atom {
    override isText(): boolean {
        return true;
    }
    abstract getText(): string;
}


export class StringAtom extends TextAtom {
    constructor(private readonly value: string) {
        super();
    }

    override getValue() {
        return this.value;
    }

    override getText(): string {
        return this.value;
    }

    override isString(): boolean {
        return true;
    }

    override toString(): string {
        return JSON.stringify(this.value);
    }
}

export class SymbolAtom extends TextAtom {
    constructor(private readonly value: string) {
        super();
    }

    override isSymbol(): boolean {
        return true;
    }

    override getValue() {
        return this.value;
    }

    override getText(): string {
        return this.value;
    }

    override isQuote(): boolean {
        return this.value === SymbolAtom.quote.value;
    }

    override toString(): string {
        let result = this.value;
        for (const char of [' ', '(', ')', '"', "'"]) {
            result = result.replaceAll(char, '\\' + char);
        }
        return result;
    }

    static quote = new SymbolAtom('quote');
}

// https://en.wikipedia.org/wiki/Cons
export class Cons extends Expr {
    constructor(public readonly car: Expr, public readonly cdr: Expr) {  
        super()
    }

    override isAtom(): boolean {
        return false;
    }

    override isCons(): boolean {
        return true;
    }

    override getCar(): Expr | null {
        return this.car;
    }

    override getCdr(): Expr | null {
        return this.cdr;
    }


    override toString(): string {
        const items: string[] = [];
        let current: Expr = this;
        while (current && !current.isNil()) {
            if (current instanceof Cons) {
                items.push(current.car.toString())
                current = current.cdr;
            } else {
                items.push('.')
                items.push(current.toString())
                current = Nil.instance;
            }
        }
        return `(${items.join(' ')})`;
    }

    *enumerate() {
        let current: Expr = this;
        while (current && !current.isNil()) {
            if (current instanceof Cons) {
                yield current.car;
                current = current.cdr;
            } else {
                yield current;
                current = Nil.instance;
            }
        }
    }

    toArray(): Expr[] {
        const items: Expr[] = [];
        for (const item of this.enumerate()) {
            items.push(item);
        }
        return items;
    }

    static fromArray(values: Expr[], terminatingExpr?: Expr) {
        if (values.length === 0) {
            return Nil.instance;
        }
        let result = new Cons(values[values.length - 1], terminatingExpr ?? Nil.instance);
        for (let i = values.length - 2; i >= 0; i--) {
            result = new Cons(values[i], result);
        }
        return result;
    }
}

export class QuotedExpr extends Cons {
    override toString(): string {
        if (this.car.isQuote() && this.cdr.isCons()) {
            const quotedExpr = this.getCdr()?.getCar();
            if (quotedExpr) {
                return `'${quotedExpr.toString()}`;
            }
        }
        return super.toString();
    }

    static fromExpr(expr: Expr) {
        return new QuotedExpr(SymbolAtom.quote, new Cons(expr, Nil.instance));
    }
}
