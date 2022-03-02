import { Cons, Nil, IntegerAtom, FloatAtom, StringAtom, BooleanAtom, SymbolAtom } from "./types";

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
});
