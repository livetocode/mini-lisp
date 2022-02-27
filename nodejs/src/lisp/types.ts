/* 
Hierarchy:
Expr
  |_Cons
  |_Atom
    |_Nil
    |_NumberAtom
    | |_IntegerAtom
    | |_FloatAtom
    |_BooleanAtom
    |_StringAtom
    |_SymbolAtom
*/



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

    static parse(text: string): NumberAtom {
        const isInteger = /^[+-]?\d+$/gm;
        if (isInteger.test(text)) {
            return new IntegerAtom(parseInt(text, 10));
        }
        return new FloatAtom(parseFloat(text));
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

export class StringAtom extends Atom {
    constructor(private readonly value: string) {
        super();
    }

    override getValue() {
        return this.value;
    }

    override isString(): boolean {
        return true;
    }

    override toString(): string {
        return JSON.stringify(this.value);
    }
}

export class SymbolAtom extends Atom {
    constructor(private readonly value: string) {
        super();
    }

    override isSymbol(): boolean {
        return true;
    }

    override getValue() {
        return this.value;
    }

    override toString(): string {
        if (this.containsSpecialChar()) {
            const escapedValue = this.value.replaceAll('|', '\\|')
            return `|${escapedValue}|`;
        }
        return this.value;
    }

    private containsSpecialChar() {
        for (let i = 0; i < this.value.length; i++) {
            const c = this.value[i];
            if ([' ', '|', '(', ')'].includes(c)) {
                return true;
            }
        }
        return false;
    }
}

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

    toArray(): Expr[] {
        const items: Expr[] = []
        let current: Expr = this;
        while (current && !current.isNil()) {
            if (current instanceof Cons) {
                items.push(current.car)
                current = current.cdr;
            } else {
                items.push(current)
                current = Nil.instance;
            }
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
