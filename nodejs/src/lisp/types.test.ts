import { Cons, Nil, IntegerAtom, FloatAtom, StringAtom, BooleanAtom, SymbolAtom, QuotedExpr } from "./types";

describe('types', () => {
    describe('Atom', () => {
        test('int', () => {
            const atom = new IntegerAtom(1);
            expect(atom.isAtom()).toBeTruthy();
            expect(atom.isNumber()).toBeTruthy();
            expect(atom.isTrue()).toBeTruthy();
            expect(atom.isBoolean()).toBeFalsy();
            expect(atom.isCons()).toBeFalsy();
            expect(atom.isFalse()).toBeFalsy();
            expect(atom.isNil()).toBeFalsy();
            expect(atom.isQuote()).toBeFalsy();
            expect(atom.isString()).toBeFalsy();
            expect(atom.isSymbol()).toBeFalsy();
            expect(atom.isText()).toBeFalsy();
            expect(atom.toString()).toBe('1');
            expect(atom.getValue()).toBe(1);
            expect(atom.getCar()).toBeNull();
            expect(atom.getCdr()).toBeNull();
        });    
        test('float', () => {
            const atom = new FloatAtom(3.14);
            expect(atom.isAtom()).toBeTruthy();
            expect(atom.isNumber()).toBeTruthy();
            expect(atom.isTrue()).toBeTruthy();
            expect(atom.isBoolean()).toBeFalsy();
            expect(atom.isCons()).toBeFalsy();
            expect(atom.isFalse()).toBeFalsy();
            expect(atom.isNil()).toBeFalsy();
            expect(atom.isQuote()).toBeFalsy();
            expect(atom.isString()).toBeFalsy();
            expect(atom.isSymbol()).toBeFalsy();
            expect(atom.isText()).toBeFalsy();
            expect(atom.toString()).toBe('3.14');
            expect(atom.getValue()).toBe(3.14);
            expect(atom.getCar()).toBeNull();
            expect(atom.getCdr()).toBeNull();
        });
        test('bool - true', () => {
            const atom = new BooleanAtom(true);
            expect(atom.isAtom()).toBeTruthy();
            expect(atom.isNumber()).toBeFalsy();
            expect(atom.isTrue()).toBeTruthy();
            expect(atom.isBoolean()).toBeTruthy();
            expect(atom.isCons()).toBeFalsy();
            expect(atom.isFalse()).toBeFalsy();
            expect(atom.isNil()).toBeFalsy();
            expect(atom.isQuote()).toBeFalsy();
            expect(atom.isString()).toBeFalsy();
            expect(atom.isSymbol()).toBeFalsy();
            expect(atom.isText()).toBeFalsy();
            expect(atom.toString()).toBe('T');
            expect(atom.getValue()).toBe(true);
            expect(atom.getCar()).toBeNull();
            expect(atom.getCdr()).toBeNull();
        });
        test('bool - false', () => {
            const atom = new BooleanAtom(false);
            expect(atom.isAtom()).toBeTruthy();
            expect(atom.isNumber()).toBeFalsy();
            expect(atom.isTrue()).toBeFalsy();
            expect(atom.isBoolean()).toBeTruthy();
            expect(atom.isCons()).toBeFalsy();
            expect(atom.isFalse()).toBeTruthy();
            expect(atom.isNil()).toBeTruthy();
            expect(atom.isQuote()).toBeFalsy();
            expect(atom.isString()).toBeFalsy();
            expect(atom.isSymbol()).toBeFalsy();
            expect(atom.isText()).toBeFalsy();
            expect(atom.toString()).toBe('nil');
            expect(atom.getValue()).toBe(false);
            expect(atom.getCar()).toBeNull();
            expect(atom.getCdr()).toBeNull();
        });    
        test('string', () => {
            const atom = new StringAtom('foo bar');
            expect(atom.isAtom()).toBeTruthy();
            expect(atom.isNumber()).toBeFalsy();
            expect(atom.isTrue()).toBeTruthy();
            expect(atom.isBoolean()).toBeFalsy();
            expect(atom.isCons()).toBeFalsy();
            expect(atom.isFalse()).toBeFalsy();
            expect(atom.isNil()).toBeFalsy();
            expect(atom.isQuote()).toBeFalsy();
            expect(atom.isString()).toBeTruthy();
            expect(atom.isSymbol()).toBeFalsy();
            expect(atom.isText()).toBeTruthy();
            expect(atom.toString()).toBe('"foo bar"');
            expect(atom.getText()).toBe('foo bar');
            expect(atom.getValue()).toBe('foo bar');
            expect(atom.getCar()).toBeNull();
            expect(atom.getCdr()).toBeNull();
        });
        test('symbol', () => {
            const atom = new SymbolAtom('foobar');
            expect(atom.isAtom()).toBeTruthy();
            expect(atom.isNumber()).toBeFalsy();
            expect(atom.isTrue()).toBeTruthy();
            expect(atom.isBoolean()).toBeFalsy();
            expect(atom.isCons()).toBeFalsy();
            expect(atom.isFalse()).toBeFalsy();
            expect(atom.isNil()).toBeFalsy();
            expect(atom.isQuote()).toBeFalsy();
            expect(atom.isString()).toBeFalsy();
            expect(atom.isSymbol()).toBeTruthy();
            expect(atom.isText()).toBeTruthy();
            expect(atom.toString()).toBe('foobar');
            expect(atom.getText()).toBe('foobar');
            expect(atom.getValue()).toBe('foobar');
            expect(atom.getCar()).toBeNull();
            expect(atom.getCdr()).toBeNull();
        });
        test('nil', () => {
            const atom = Nil.instance;
            expect(atom.isAtom()).toBeTruthy();
            expect(atom.isNumber()).toBeFalsy();
            expect(atom.isTrue()).toBeFalsy();
            expect(atom.isBoolean()).toBeFalsy();
            expect(atom.isCons()).toBeFalsy();
            expect(atom.isFalse()).toBeTruthy();
            expect(atom.isNil()).toBeTruthy();
            expect(atom.isQuote()).toBeFalsy();
            expect(atom.isString()).toBeFalsy();
            expect(atom.isSymbol()).toBeFalsy();
            expect(atom.isText()).toBeFalsy();
            expect(atom.toString()).toBe('nil');
            expect(atom.getValue()).toBeNull();
            expect(atom.getCar()).toBeNull();
            expect(atom.getCdr()).toBeNull();
        });        
    });
    describe('Cons', () => {
        test('(nil . nil)', () => {
            expect(new Cons(Nil.instance, Nil.instance).toString()).toBe('(nil)');
        });    
        test('(nil . 2)', () => {
            expect(new Cons(Nil.instance, new IntegerAtom(2)).toString()).toBe('(nil . 2)');
        });    
        test('(1 . nil)', () => {
            expect(new Cons(new IntegerAtom(1), Nil.instance).toString()).toBe('(1)');
        });    
        test('(1 . 2)', () => {
            expect(new Cons(new IntegerAtom(1), new IntegerAtom(2)).toString()).toBe('(1 . 2)');
        });    
        test('((1 . 2) . 3)', () => {
            const list = new Cons(new IntegerAtom(1), new IntegerAtom(2));
            expect(new Cons(list, new IntegerAtom(3)).toString()).toBe('((1 . 2) . 3)');
        });    
        test('((1 2) . 3)', () => {
            const list = new Cons(new IntegerAtom(1), new Cons(new IntegerAtom(2), Nil.instance));
            expect(new Cons(list, new IntegerAtom(3)).toString()).toBe('((1 2) . 3)');
        });    
        test('((1 2) 3)', () => {
            const list = new Cons(new IntegerAtom(1), new Cons(new IntegerAtom(2), Nil.instance));
            expect(new Cons(list, new Cons(new IntegerAtom(3), Nil.instance)).toString()).toBe('((1 2) 3)');
        });    
        test('(1 (2 . 3))', () => {
            const list = new Cons(new IntegerAtom(2), new IntegerAtom(3));
            expect(new Cons(new IntegerAtom(1), new Cons(list, Nil.instance)).toString()).toBe('(1 (2 . 3))');
        });    
        test('(1 (2 3))', () => {
            const list = new Cons(new IntegerAtom(2), new Cons(new IntegerAtom(3), Nil.instance));
            expect(new Cons(new IntegerAtom(1), new Cons(list, Nil.instance)).toString()).toBe('(1 (2 3))');
        });    
        test('(1 2 3)', () => {
            expect(new Cons(new IntegerAtom(1), new Cons(new IntegerAtom(2), new Cons(new IntegerAtom(3), Nil.instance))).toString()).toBe('(1 2 3)');
        });    
        test('(1 3.14 "abc def" T nil foo |foo bar|)', () => {
            expect(Cons.fromArray([
                new IntegerAtom(1), new FloatAtom(3.14), new StringAtom('abc def'), new BooleanAtom(true), new BooleanAtom(false), new SymbolAtom('foo'), new SymbolAtom('foo bar'),
            ]).toString()).toBe('(1 3.14 "abc def" T nil foo foo\\ bar)');
        });
        test('getCar1', () => {
            const item1 = new IntegerAtom(1);
            const expr = Cons.fromArray([item1]);
            expect(expr.getCar()).toBe(item1);
            expect(expr.getCdr()).toBe(Nil.instance);
        });
        test('getCar2', () => {
            const item1 = new IntegerAtom(1);
            const item2 = new IntegerAtom(2);
            const expr = Cons.fromArray([item1, item2]);
            expect(expr.getCar()).toBe(item1);
            expect(expr.getCdr()).toBeInstanceOf(Cons);
            expect(expr.getCdr()?.getCar()).toBe(item2);
            expect(expr.getCdr()?.getCdr()).toBe(Nil.instance);
        });
        test('valid quoted expr', () => {
            const item1 = new IntegerAtom(1);
            const expr = QuotedExpr.fromExpr(item1);
            expect(expr.toString()).toBe("'1");
            expect(expr.getCdr()?.getCar()).toBe(item1);
        });
        test('invalid quoted expr', () => {
            const item1 = new IntegerAtom(1);
            const expr = new QuotedExpr(new SymbolAtom('zorg'), new Cons(item1, Nil.instance));
            expect(expr.toString()).toBe("(zorg 1)");
            expect(expr.getCdr()?.getCar()).toBe(item1);
        });
    });    
});
