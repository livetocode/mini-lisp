/* 
Hierarchy:
Expr
  |_Cons
  |   |_QuotedExpr
  |_FunctionExpr
  |   |_BuiltinFunction
  |   |_AnonymousFunction
  |       |_UserFunction
  |       |_LambdaFunction
  |       |   |_LambdaClosure
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
    static function = new SymbolAtom('function');
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
                throw new LispRuntimeException(`Wrong type argument: listp, ${current.toString()}`);
            }
        }
    }

    *asPairs() {
        for (const pair of this.enumerate()) {
            if (pair instanceof Cons) {
                const key = pair.car;
                if (pair.cdr instanceof Cons) {
                    const val = pair.cdr.car;
                    yield [key, val];
                }
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

export class GetFuncQuotedExpr extends Cons {
    override toString(): string {
        if (this.car instanceof SymbolAtom && this.car.getText() === 'function' && this.cdr.isCons()) {
            const quotedExpr = this.getCdr()?.getCar();
            if (quotedExpr) {
                return `#'${quotedExpr.toString()}`;
            }
        }
        return super.toString();
    }

    static fromExpr(expr: Expr) {
        return new GetFuncQuotedExpr(SymbolAtom.function, new Cons(expr, Nil.instance));
    }
}

export class LispVariable {
    private value: Expr | undefined;
    private funcValue: FunctionExpr | undefined;
    constructor(
        public readonly name: string,
        public readonly isReadOnly: boolean,
        value?: Expr,
        funcValue?: FunctionExpr,
    ) {
        this.value = value;
        this.funcValue = funcValue;
    }
    
    getValue() { return this.value; }
    
    getFuncValue() { return this.funcValue; }
    
    setValue(value: Expr) {
        if (this.value && this.isReadOnly) {
            throw new LispRuntimeException(`'${this.name}' is a constant, may not be used as a variable`);
        }
        this.value = value;
    }

    setFuncValue(funcValue: FunctionExpr) {
        if (this.funcValue && this.isReadOnly) {
            throw new LispRuntimeException(`'${this.name}' is a constant, may not be used as a variable`);
        }
        this.funcValue = funcValue;
    }
}

export class LispVariables {
    private vars;
    public readonly root: LispVariables;
    public readonly parent?: LispVariables;

    constructor(vars: LispVariable[], parent?: LispVariables, root?: LispVariables) {
        this.vars = new Map<string, LispVariable>(vars.map(v => [v.name, v]));
        this.parent = parent;
        if (root) {
            this.root = root;
        } else {
            this.root = parent ?? this;
            while (this.root.parent) {
                this.root = this.root.parent;
            }    
        }
    }

    createChildScope(vars: LispVariable[]) {
        return new LispVariables(vars, this, this.root);
    }

    find(name: string): LispVariable | undefined {
        let result = this.vars.get(name);
        if (!result && this.parent) {
            result = this.parent.find(name);
            if (result) {
                this.vars.set(name, result);
            }
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

    set(
        name: string,
        isReadOnly: boolean,
        value?: Expr,
        funcValue?: FunctionExpr,
    ) {
        let v = this.find(name);
        if (!v) {
            v = new LispVariable(name, isReadOnly);
            this.root.vars.set(name, v);
        }
        if (value) {
            v.setValue(value);
        }
        if (funcValue) {
            v.setFuncValue(funcValue);
        }
        return v;
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

export interface IEvaluationStats {
    readonly evalCount: number;
    readonly evalSymbolCount: number;
    readonly evalFunctionCallCount: number;
    readonly evalNonEvaluableExprCount: number;
    clone(): IEvaluationStats;
    diff(other: IEvaluationStats): IEvaluationStats;
    toList(): Expr;
    withVerbsosity<T>(callback: () => T): T;
}

export interface ILispEvaluator {
    readonly vars: LispVariables;
    readonly stats: IEvaluationStats;
    create(vars: LispVariables): ILispEvaluator;
    createChildScope(vars: LispVariable[]): ILispEvaluator;
    createNewScope(vars: LispVariable[]): ILispEvaluator;
    eval(expr: Expr): Expr;
}

export class FunctionEvaluationContext {
    public readonly func: FunctionExpr;
    public readonly args: Expr[];
    public readonly evaluator: ILispEvaluator;

    constructor(
        options: {
            func: FunctionExpr,
            args: Expr[],
            evaluator: ILispEvaluator,
        }
    ) {
        this.func = options.func;
        this.args = options.args;
        this.evaluator = options.evaluator;
    }

    eval(expr: Expr): Expr {
        return this.evaluator.eval(expr);
    }

    createNewContext(vars: LispVariable[]): FunctionEvaluationContext {
        return new FunctionEvaluationContext({
            func: this.func,
            args: this.args, 
            evaluator: this.evaluator.createNewScope(vars),
        });
    }

    createChildContext(vars: LispVariable[]): FunctionEvaluationContext {
        return new FunctionEvaluationContext({
            func: this.func,
            args: this.args, 
            evaluator: this.evaluator.createChildScope(vars),
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

    abstract getName(): string;

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
        return `<builtin-function ${this.meta.name}>`;
    }

    override getType(): string {
        return 'builtin-function';
    }

    override eval(ctx: FunctionEvaluationContext): Expr {
        return this.callback(ctx);
    }

    override getName(): string {
        return this.meta.name;
    }

    override equals(other: Expr): boolean {
        if (other instanceof BuiltinFunction) {
            return this.callback === other.callback;
        }   
        return false;
    }
}

export abstract class AnonymousFunction extends FunctionExpr {
    constructor(meta: AnonymousFunctionMetadata, public readonly body: Expr[]) {
        super(meta);
    }

    override getType(): string {
        return 'function';
    }

    override eval(ctx: FunctionEvaluationContext): Expr {
        const args = buildArgVariables(this.meta.args, ctx.args);
        const funcCtx = this.createInvocationContext(ctx, args);
        let lastExpr: Expr = Nil.instance;
        for (const expr of this.body) {
            lastExpr = funcCtx.eval(expr);
        }
        return lastExpr;
    }

    override toString(): string {
        return `<function :${this.getName()} ${this.argsDefinitionAsString()} ${this.bodyAsString()}>`;
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

    protected createInvocationContext(ctx: FunctionEvaluationContext, args: LispVariable[]) {
        return ctx.createNewContext(args);
    }

    protected argsDefinitionAsString() {
        const args = this.meta.args.map(x => x.name).join(' ');
        if (args) {
            return `(${args})`;
        }
        return 'nil';
    }
    protected bodyAsString() {
        return this.body.map(x => x.toString()).join(' ');
    }
}

export class UserFunction extends AnonymousFunction {
    constructor(public readonly meta: FunctionMetadata, public readonly body: Expr[]) {
        super(meta, body);
    }

    override getName(): string {
        return this.meta.name;
    }
}

export class LambdaFunction extends AnonymousFunction {

    override getName(): string {
        return 'lambda';
    }
}

// See http://www.lispworks.com/documentation/HyperSpec/Body/03_ad.htm for closures and lexical binding
// Note that a LambdaClosure is created from the (function ...) call.

export class LambdaClosure extends LambdaFunction {
    constructor(public readonly func: LambdaFunction, public readonly vars: LispVariables) {
        super(func.meta, func.body);
    }
    
    equals(other: Expr): boolean {
        if (other instanceof LambdaClosure) {
            return this === other;
        }
        if (other instanceof LambdaFunction) {
            return this.func.equals(other)
        }
        return false;
    }

    protected override createInvocationContext(ctx: FunctionEvaluationContext, args: LispVariable[]) {
        const bindingContext = new FunctionEvaluationContext({
            func: this.func,
            args: ctx.args, 
            evaluator: ctx.evaluator.create(this.vars),
        });
        return bindingContext.createChildContext(args);
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
            vars.push(new LispVariable(def.name, false, val));
        }
    }
    return vars;
}

