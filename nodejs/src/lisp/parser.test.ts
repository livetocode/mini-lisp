import { LispSyntaxException, LispUnterminatedExpressionException } from "./exceptions";
import { parse } from "./parser";
import { BooleanAtom, Cons, Expr, FloatAtom, IntegerAtom, Nil, StringAtom, SymbolAtom } from "./types";

function getCdr(expr: Expr) {
    if (expr instanceof Cons) {
        return expr.cdr;
    }
    throw new Error('Expected a Cons expr');
}

function getCar(expr: Expr) {
    if (expr instanceof Cons) {
        return expr.car;
    }
    throw new Error('Expected a Cons expr');
}

describe('parser', () => {
    describe('atoms', () => {
        test('empty list', () => {
            const atom = parse('()');
            expect(atom.isNil()).toBeTruthy();
            expect(atom).toBeInstanceOf(Nil);
        });
        test('integer', () => {
            const atom = parse('123');
            expect(atom.isNumber()).toBeTruthy();
            expect(atom).toBeInstanceOf(IntegerAtom);
            expect((atom as IntegerAtom).getValue()).toBe(123);
        });
        test('quoted integer', () => {
            const expr = parse("'123");
            const atom = getCar(getCdr(expr));
            expect(atom.isNumber()).toBeTruthy();
            expect(atom).toBeInstanceOf(IntegerAtom);
            expect((atom as IntegerAtom).getValue()).toBe(123);
        });
        test('positive integer', () => {
            const atom = parse('+123');
            expect(atom.isNumber()).toBeTruthy();
            expect(atom).toBeInstanceOf(IntegerAtom);
            expect((atom as IntegerAtom).getValue()).toBe(123);
        });
        test('quoted positive integer', () => {
            const expr = parse("'+123");
            const atom = getCar(getCdr(expr));
            expect(atom.isNumber()).toBeTruthy();
            expect(atom).toBeInstanceOf(IntegerAtom);
            expect((atom as IntegerAtom).getValue()).toBe(123);
        });
        test('negative integer', () => {
            const atom = parse('-123');
            expect(atom.isNumber()).toBeTruthy();
            expect(atom).toBeInstanceOf(IntegerAtom);
            expect((atom as IntegerAtom).getValue()).toBe(-123);
        });
        test('float', () => {
            const atom = parse('123.45');
            expect(atom.isNumber()).toBeTruthy();
            expect(atom).toBeInstanceOf(FloatAtom);
            expect((atom as FloatAtom).getValue()).toBe(123.45);
        });
        test('float without leading digit', () => {
            const atom = parse('.45');
            expect(atom.isNumber()).toBeTruthy();
            expect(atom).toBeInstanceOf(FloatAtom);
            expect((atom as FloatAtom).getValue()).toBe(0.45);
        });
        test('positive float', () => {
            const atom = parse('+123.45');
            expect(atom.isNumber()).toBeTruthy();
            expect(atom).toBeInstanceOf(FloatAtom);
            expect((atom as FloatAtom).getValue()).toBe(123.45);
        });
        test('negative float', () => {
            const atom = parse('-123.45');
            expect(atom.isNumber()).toBeTruthy();
            expect(atom).toBeInstanceOf(FloatAtom);
            expect((atom as FloatAtom).getValue()).toBe(-123.45);
        });
        test('boolean t symbol', () => {
            const atom = parse('t');
            expect(atom.isBoolean()).toBeTruthy();
            expect(atom).toBeInstanceOf(BooleanAtom);
            expect((atom as BooleanAtom).getValue()).toBe(true);
            expect(atom).toBe(BooleanAtom.True);
        });
        test('string', () => {
            const atom = parse('"abc"');
            expect(atom.isString()).toBeTruthy();
            expect(atom).toBeInstanceOf(StringAtom);
            expect((atom as StringAtom).getValue()).toBe('abc');
        });
        test('string with white space and inner quotes', () => {
            const atom = parse('"Hello \\"World\\"!\\nA second\\tline"');
            expect(atom.isString()).toBeTruthy();
            expect(atom).toBeInstanceOf(StringAtom);
            expect((atom as StringAtom).getValue()).toBe('Hello "World"!\nA second\tline');
            expect(atom.toString()).toBe('"Hello \\"World\\"!\\nA second\\tline"');
        });
        test('multiple expressions without parenthesis should fail', () => {
            expect(() => parse('1 2 3')).toThrow(new LispSyntaxException({index: 0, line: 1, col: 3}, 'Expected to have a single expression'));
        });    
        test('quote without expression', () => {
            expect(() => parse("'")).toThrow(new LispUnterminatedExpressionException({index: 0, line: 1, col: 1}, 'Missing expression after a quote'));
        });    
        test('assoc without right expression', () => {
            const expr = parse('(1 .)');
            expect(expr.isCons()).toBeTruthy();
            expect(expr.isAtom()).toBeFalsy();
            expect(expr.isNil()).toBeFalsy();
            expect(expr).toBeInstanceOf(Cons);
            expect((expr as Cons).toArray()).toEqual([
                new IntegerAtom(1),
                new SymbolAtom('.'),
            ]);
        });    
        describe('symbols', () => {
            const identifiers = [
                ['\\+1', '+1'],
                ['a'],
                ['abc'],
                ['a.b'],
                ['a\\ b', 'a b'],
                ['a\\nb', 'anb'],
                ['Abc'],
                ['abc-def'],
                ['abc_def'],
                ['|a\\ b|', '|a b|'],
                ['|a\\|b|', '|a|b|'],
                ['|a\\nb|', '|anb|'],
                ['+$'],
                ['1+'],
                ['file.rel.43'],
                ['\\(', '('],
                ['\\)', ')'],
                ['\\(\\)', '()'],
                ['\\+1', '+1'],
                ['+\\1', '+1'],
                ['\\frobboz', 'frobboz'],
                ['3.14159265\\s0', '3.14159265s0'],
            ];
            for (const [id, expected] of identifiers) {
                test(id, () => {
                    const atom = parse(id);
                    expect(atom.isSymbol()).toBeTruthy();
                    expect(atom).toBeInstanceOf(SymbolAtom);
                    expect((atom as SymbolAtom).getValue()).toBe(expected ?? id);
                });    
            }
        });
    });
    describe('lists', () => {
        test('empty list', () => {
            const expr = parse('()');
            expect(expr.isNil()).toBeTruthy();
            expect(expr.isAtom()).toBeTruthy();
            expect(expr.isCons()).toBeFalsy();
            expect(expr).toBeInstanceOf(Nil);
        });
        test('nil symbol', () => {
            const expr = parse('nil');
            expect(expr.isNil()).toBeTruthy();
            expect(expr.isAtom()).toBeTruthy();
            expect(expr.isCons()).toBeFalsy();
            expect(expr).toBeInstanceOf(Nil);
        });
        test('single item', () => {
            const expr = parse('(1)');
            expect(expr.isCons()).toBeTruthy();
            expect(expr.isAtom()).toBeFalsy();
            expect(expr.isNil()).toBeFalsy();
            expect(expr).toBeInstanceOf(Cons);
            expect((expr as Cons).toArray()).toEqual([new IntegerAtom(1)]);
        });
        test('quoted single item list', () => {
            const expr = parse("'(1)");
            expect(expr.isCons()).toBeTruthy();
            expect(expr.isAtom()).toBeFalsy();
            expect(expr.isNil()).toBeFalsy();
            expect(expr).toBeInstanceOf(Cons);
            expect((expr as Cons).toArray()).toEqual([
                new SymbolAtom('quote'),
                Cons.fromArray([new IntegerAtom(1)]),
            ]);
        });
        test('multiple items', () => {
            const expr = parse('(1 2 3)');
            expect(expr.isCons()).toBeTruthy();
            expect(expr.isAtom()).toBeFalsy();
            expect(expr.isNil()).toBeFalsy();
            expect(expr).toBeInstanceOf(Cons);
            expect((expr as Cons).toArray()).toEqual([
                new IntegerAtom(1),
                new IntegerAtom(2),
                new IntegerAtom(3),
            ]);
        });
        test('inner list', () => {
            const expr = parse('(1 2 (3 4) 5 6)');
            expect(expr.isCons()).toBeTruthy();
            expect(expr.isAtom()).toBeFalsy();
            expect(expr.isNil()).toBeFalsy();
            expect(expr).toBeInstanceOf(Cons);
            expect((expr as Cons).toArray()).toEqual([
                new IntegerAtom(1),
                new IntegerAtom(2),
                Cons.fromArray([
                    new IntegerAtom(3),
                    new IntegerAtom(4),    
                ]),
                new IntegerAtom(5),
                new IntegerAtom(6),
            ]);
        });
        test('single assoc', () => {
            const expr = parse('(1 . 2)');
            expect(expr.isCons()).toBeTruthy();
            expect(expr.isNil()).toBeFalsy();
            expect(expr).toBeInstanceOf(Cons);
            const cons = expr as Cons;
            expect(cons.car).toEqual(new IntegerAtom(1));
            expect(cons.cdr).toEqual(new IntegerAtom(2));
            expect(cons.toArray()).toEqual([new IntegerAtom(1), new IntegerAtom(2)]);
        });
        test('single assoc with quoted values', () => {
            const expr = parse("('1 . '2)");
            expect(expr.isCons()).toBeTruthy();
            expect(expr.isNil()).toBeFalsy();
            expect(expr).toBeInstanceOf(Cons);
            const cons = expr as Cons;
            expect(getCar(getCdr(cons.car))).toEqual(new IntegerAtom(1));
            expect(cons.toArray()).toEqual([
                Cons.fromArray([SymbolAtom.quote, new IntegerAtom(1)]), 
                SymbolAtom.quote,
                new IntegerAtom(2), 
            ]);
        });
        test('single assoc with an initial list', () => {
            const expr = parse('((1 2) . 3)');
            expect(expr.isCons()).toBeTruthy();
            expect(expr.isNil()).toBeFalsy();
            expect(expr).toBeInstanceOf(Cons);
            const cons = expr as Cons;
            expect(cons.car).toEqual(Cons.fromArray([new IntegerAtom(1), new IntegerAtom(2)]));
            expect(cons.cdr).toEqual(new IntegerAtom(3));
            expect(cons.toArray()).toEqual([Cons.fromArray([new IntegerAtom(1), new IntegerAtom(2)]), new IntegerAtom(3)]);
        });
        test('list as nested assocs', () => {
            const expr = parse('(1 . (2 . (3 . ())))');
            expect(expr.isCons()).toBeTruthy();
            expect(expr.isNil()).toBeFalsy();
            expect(expr).toBeInstanceOf(Cons);
            expect((expr as Cons).toArray()).toEqual([
                new IntegerAtom(1),
                new IntegerAtom(2),
                new IntegerAtom(3),
            ]);
        });
        test('list with last item as assoc', () => {
            const expr = parse('(1 2 . 3)');
            expect(expr.isCons()).toBeTruthy();
            expect(expr.isNil()).toBeFalsy();
            expect(expr).toBeInstanceOf(Cons);
            const first = expr as Cons;
            expect(first.car).toEqual(new IntegerAtom(1));
            expect(first.cdr.isCons()).toBeTruthy();
            const second = first.cdr as Cons;
            expect(second.car).toEqual(new IntegerAtom(2));
            expect(second.cdr.isCons()).toBeFalsy();
            expect(second.cdr).toEqual(new IntegerAtom(3));
            expect(first.toArray()).toEqual([new IntegerAtom(1), new IntegerAtom(2), new IntegerAtom(3)]);
        });
        test('no left expr in assoc', () => {
            expect(() => parse('(. 2)')).toThrow(new LispSyntaxException({index: 0, line: 1, col: 5}, 'left expression required for an assoc'));
        });    
        test('closed list without opening parenthesis', () => {
            expect(() => parse('1)')).toThrow(new LispSyntaxException({index: 0, line: 1, col: 2}, 'Found closing parenthesis without matching opening parenthesis'));
        });    
        test('unbalanced list', () => {
            expect(() => parse('(1 2 (3 4)')).toThrow(new LispUnterminatedExpressionException({index: 0, line: 1, col: 10}, 'Unbalanced list expression'));
        });    
        test('multiple expressions outside a list are not allowed', () => {
            expect(() => parse('1 2 3')).toThrow(new LispSyntaxException({index: 0, line: 1, col: 3}, 'Expected to have a single expression'));
            expect(() => parse('(1 2 3')).toThrow(new LispUnterminatedExpressionException({index: 0, line: 1, col: 6}, 'Unbalanced list expression'));
        });    
    });
    describe('print expressions', () => {
        const expressions = [
            ["'\n(+\n 2 2)\n", "'(+ 2 2)"],
            ['', 'nil'],
            ['()', 'nil'],
            ['nil'],
            ["'()", "'nil"],
            ['(+ 2 2)'],
            ["('a'b)", "('a 'b)"],
            ["('a ' b 3)", "('a 'b 3)"],
            ["'(+ 2 2)", "'(+ 2 2)"],
            ["'\n(+\n 2 2)\n", "'(+ 2 2)"],
            ['(cons "foo" ("bar"))'],
            ['(1 2 |foo bar| 3.14 "abc")'],
            ['(+ 2 (+ 3 3) 4)'],
            ['(+ 2 \n(+ 3 \n3)\n 4)', '(+ 2 (+ 3 3) 4)'],
            ['(1 2\n3)', '(1 2 3)'],
            ['1 ;comment', '1'],
        ];
        for (const [expr, expected] of expressions) {
            test(expr, () => {
                const result = parse(expr);
                expect(result.toString()).toBe(expected ?? expr);
            });
        }
    });
});

