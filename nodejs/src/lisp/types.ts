/* 
Hierarchy:
Expr
  |_Cons
  |   |_QuotedExpr
  |_FunctionExpr
  |   |_BuiltinFunction
  |   |_LambdaFunction
  |       |_UserFunction
  |_Atom
      |_Nil
      |_NumberAtom
      |   |_IntegerAtom
      |   |_FloatAtom
      |_BooleanAtom
      |_TextAtom
          |_StringAtom
          |_SymbolAtom
*/

import { LispParametersException, LispRuntimeException, LispSymbolNotFoundException } from "./exceptions";


// https://en.wikipedia.org/wiki/S-expression


export abstract class Expr {
    abstract toString(): string;

    abstract getType(): string;

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

    abstract equals(other: Expr): boolean;
    abstract compareTo(other: Expr): number;
}

export abstract class Atom extends Expr {
    override isAtom(): boolean {
        return true;
    }

    override isCons(): boolean {
        return false;
    }

    abstract getValue(): any;

    override equals(other: Expr): boolean {
        if (other instanceof Atom) {
            return this.getValue() === other.getValue();
        }
        return false;
    }

}

export class Nil extends Atom {
    override getValue(): any {
        return null;
    }

    override toString(): string {
        return 'nil';
    }

    override getType(): string {
        return 'null';
    }

    override isNil(): boolean {
        return true;
    }

    static instance: Nil = new Nil()

    override compareTo(other: Expr): number {
        if (other.isNil()) {
            return 0;
        }
        return -1;
    }

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
            return 't';
        }
        return 'nil';
    }

    override getType(): string {
        return 'boolean';
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

    override compareTo(other: Expr): number {
        if (other instanceof BooleanAtom) {
            if (this.value === other.value) {
                return 0;
            } else if (this.value) {
                return 1;
            }
        }
        return -1;
    }

    static False = new BooleanAtom(false);
    static True = new BooleanAtom(true);
}

export abstract class NumberAtom extends Atom {
    override isNumber(): boolean {
        return true;
    }

    abstract getNumber(): number;

    override compareTo(other: Expr): number {
        if (other instanceof NumberAtom) {
            const a = this.getNumber();
            const b = other.getNumber();
            return a - b;
        }
        return -1;
    }

    static fromNumber(value: number): NumberAtom {
        if (Number.isInteger(value)) {
            return new IntegerAtom(value);
        }
        return new FloatAtom(value);
    }
}

export class IntegerAtom extends NumberAtom {
    constructor(private readonly value: number) {
        super();
    }

    override getValue() {
        return this.value;
    }

    override getNumber(): number {
        return this.value;
    }

    override toString(): string {
        return this.value.toString();
    }

    override getType(): string {
        return 'integer';
    }
}

export class FloatAtom extends NumberAtom {
    constructor(private readonly value: number) {
        super();
    }

    override getValue() {
        return this.value;
    }

    override getNumber(): number {
        return this.value;
    }

    override toString(): string {
        return this.value.toString();
    }

    override getType(): string {
        return 'float';
    }
}

export abstract class TextAtom extends Atom {
    override isText(): boolean {
        return true;
    }
    abstract getText(): string;

    override compareTo(other: Expr): number {
        if (other instanceof TextAtom) {
            const a = this.getText();
            const b = other.getText();
            return a.localeCompare(b);
        }
        return -1;
    }

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

    override getType(): string {
        return 'string';
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

    override getType(): string {
        return 'symbol';
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

    override equals(other: Expr): boolean {
        if (other instanceof Cons) {
            return this.car.equals(other.car) && this.cdr.equals(other.cdr);
        }
        return false;
    }

    override compareTo(other: Expr): number {
        if (this.equals(other)) {
            return 0;
        }
        return -1;
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

    override getType(): string {
        return 'cons';
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

export class LispVariable {
    constructor(
        public readonly name: string,
        public readonly value: Expr,
        public readonly isReadOnly: boolean,
    ) {}
}

export class LispVariables {
    private vars;

    constructor(vars: LispVariable[], public readonly parent?: LispVariables) {
        this.vars = new Map<string, LispVariable>(vars.map(v => [v.name, v]));
    }

    find(name: string): LispVariable | undefined {
        let result = this.vars.get(name);
        if (!result && this.parent) {
            result = this.parent.find(name);
        }
        return result;
    }

    get(name: string): LispVariable {
        const result = this.find(name);
        if (result === undefined) {
            throw new LispSymbolNotFoundException(name, `Symbol '${name}' does not exist`);
        }
        return result;
    }

    resolve(name: string): Expr {
        return this.get(name).value;
    }

    set(
        name: string,
        value: Expr,
        isReadOnly: boolean,
    ) {
        let v = this.find(name);
        if (v && v.isReadOnly) {
            throw new LispRuntimeException(`cannot modify variable '${name}' because it is readonly`);
        } 
        if (!v && this.parent) {
            this.parent.set(name, value, isReadOnly);
        } else {
            v = new LispVariable(name, value, isReadOnly);
            this.vars.set(name, v);    
        }
    }

    keys(): string[] {
        return [...this.vars.keys()];
    }
}

export class ExprType {
    constructor(public readonly name: string) {}
}
export interface FunctionArgDefinition {
    readonly name: string;
    readonly type: ExprType;
}

export interface AnonymousFunctionMetadata {
    readonly evalArgs: boolean;
    readonly args: FunctionArgDefinition[];
    readonly returnType?: ExprType;
}

export interface FunctionMetadata extends AnonymousFunctionMetadata {
    readonly name: string;
    readonly aliases?: string[];
}

export type ExprEvaluator = (options: {
    expr: Expr, 
    globals: LispVariables,
    locals: LispVariables,
}) => Expr;

export class FunctionEvaluationContext {
    public readonly func: FunctionExpr;
    public readonly args: Expr[];
    public readonly globals: LispVariables;
    public readonly locals: LispVariables;
    public readonly evaluator: ExprEvaluator;

    constructor(
        options: {
            func: FunctionExpr,
            args: Expr[],
            globals: LispVariables,
            locals: LispVariables,
            evaluator: ExprEvaluator,
        }
    ) {
        this.func = options.func;
        this.args = options.args;
        this.globals = options.globals;
        this.locals = options.locals;
        this.evaluator = options.evaluator;
    }

    eval(expr: Expr): Expr {
        return this.evaluator({expr, globals: this.globals, locals: this.locals });
    }

    createNewContext(vars: LispVariable[]): FunctionEvaluationContext {
        const childScope = new LispVariables(vars, this.globals);
        return new FunctionEvaluationContext({
            func: this.func,
            args: this.args, 
            evaluator: this.evaluator,
            globals: this.globals,
            locals: childScope,
        });
    }

    createChildContext(vars: LispVariable[]): FunctionEvaluationContext {
        const childScope = new LispVariables(vars, this.locals);
        return new FunctionEvaluationContext({
            func: this.func,
            args: this.args, 
            evaluator: this.evaluator,
            globals: this.globals,
            locals: childScope,
        });
    }
}


export abstract class FunctionExpr extends Expr {
    constructor(public readonly meta: AnonymousFunctionMetadata) {
        super();
    }

    isCons(): boolean {
        return false;
    }

    isAtom(): boolean {
        return false;
    }

    abstract eval(ctx: FunctionEvaluationContext): Expr;

    override compareTo(other: Expr): number {
        if (this.equals(other)) {
            return 0;
        }
        return -1;
    }

}

export type BuiltinFunctionCallback = (ctx: FunctionEvaluationContext) => Expr;

export class BuiltinFunction extends FunctionExpr {
    constructor(public readonly meta: FunctionMetadata, public readonly callback: BuiltinFunctionCallback) {
        super(meta);
    }

    override toString(): string {
        return `<builtin-function: ${this.meta.name}>`;
    }

    override getType(): string {
        return 'builtin-function';
    }

    override eval(ctx: FunctionEvaluationContext): Expr {
        return this.callback(ctx);
    }

    override equals(other: Expr): boolean {
        if (other instanceof BuiltinFunction) {
            return this.callback === other.callback;
        }   
        return false;
    }
}

export class LambdaFunction extends FunctionExpr {
    constructor(meta: AnonymousFunctionMetadata, public readonly body: Expr[]) {
        super(meta);
    }

    toString(): string {
        return `<lambda>`;
    }

    override getType(): string {
        return 'function';
    }

    override eval(ctx: FunctionEvaluationContext): Expr {
        const args = buildArgVariables(this.meta.args, ctx.args);
        const funcCtx = ctx.createNewContext(args);
        let lastExpr: Expr = Nil.instance;
        for (const expr of this.body) {
            lastExpr = funcCtx.eval(expr);
        }
        return lastExpr;
    }

    override equals(other: Expr): boolean {
        if (other instanceof LambdaFunction) {
            if (this.body.length === other.body.length) {
                for (let i = 0; i < this.body.length; i++) {
                    if (!this.body[i].equals(other.body[i])) {
                        return false;
                    }
                }
                return true;
            }
        }   
        return false;
    }
}

export class UserFunction extends LambdaFunction {
    constructor(public readonly meta: FunctionMetadata, public readonly body: Expr[]) {
        super(meta, body);
    }

    toString(): string {
        return `<function: ${this.meta.name}>`;
    }
}

function buildArgVariables(definitions: FunctionArgDefinition[], values: Expr[]) {
    if (definitions.length > values.length) {
        throw new LispParametersException(`Too few parameters provided (${values.length}). Expected ${definitions.length}.`);
    }
    if (definitions.length < values.length) {
        throw new LispParametersException(`Too many parameters provided (${values.length}). Expected ${definitions.length}.`);
    }
    const vars: LispVariable[] = [];
    for (let i = 0; i < definitions.length; i++) {
        const def = definitions[i];
        const val = values[i];
        if (def && val) {
            vars.push(new LispVariable(def.name, val, false));
        }
    }
    return vars;
}

