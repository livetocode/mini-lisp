import { LispEngine } from './engine';
import { Cons, IntegerAtom } from './types';

describe('engine', () => {
    let engine : LispEngine;

    beforeEach(() => {
        engine = new LispEngine();
    })

    test('eval literal', () => {
        expect(engine.run('33').toString()).toBe('33');
    });
    test('eval symbol', () => {
        expect(engine.run('(setq foo 33)').toString()).toBe('33');
        expect(engine.vars.get('foo').getValue()).toEqual(new IntegerAtom(33));
        expect(engine.run('foo').toString()).toBe('33');
    });
    describe('arithmetic', () => {
        test('eval +', () => {
            expect(engine.run('(+ 2 3)').toString()).toBe('5');
            expect(engine.run('(+ 2 3 4)').toString()).toBe('9');
            expect(engine.run('(+ 2 (+ 1 2) 4)').toString()).toBe('9');
        });            
        test('eval -', () => {
            expect(engine.run('(- 2 3)').toString()).toBe('-1');
            expect(engine.run('(- 5 3 2)').toString()).toBe('0');
            expect(engine.run('(- 5 (- 6 3) 2)').toString()).toBe('0');
        });            
    });
    describe('function calls', () => {
        describe('lambda', () => {
            test('funcall', () => {
                expect(engine.run('(funcall (lambda (x) (+ x 3)) 4)').toString()).toBe('7');                                        
            });    
            test('funcall with #\' operator', () => {
                expect(engine.run(`(funcall #'(lambda (x) (+ x 3)) 4)`).toString()).toBe('7');
            });    
            test('funcall with function operator', () => {
                expect(engine.run(`(funcall (function (lambda (x) (+ x 3))) 4)`).toString()).toBe('7');
            });    
            test('apply', () => {
                expect(engine.run(`(apply (lambda (x) (+ x 3)) '(4))`).toString()).toBe('7');                                        
            });    
            test('apply with #\' operator', () => {
                expect(engine.run(`(apply #'(lambda (x) (+ x 3)) '(4))`).toString()).toBe('7');
            });    
            test('apply with function operator', () => {
                expect(engine.run(`(apply (function (lambda (x) (+ x 3))) '(4))`).toString()).toBe('7');
            });    
            test('inline lambda execution', () => {
                expect(engine.run('((lambda (x) (+ x x)) 3)').toString()).toBe('6');                        
            });
            test('inline lambda execution with #\' operator', () => {
                expect(engine.run(`(#'(lambda (x) (+ x x)) 3)`).toString()).toBe('6');
            });
            test('lambda closure', () => {
                expect(engine.run(`
                    (defun two-funs (x)
                        (list (function (lambda () x))
                            (function (lambda (y) (setq x y)))))`).toString()).toBe('two-funs');
                expect(engine.run('(setq funs (two-funs 6))')).toBeInstanceOf(Cons);
                expect(engine.run('(funcall (car funs))').toString()).toBe('6');
                expect(engine.run('(funcall (cadr funs) 43)').toString()).toBe('43');
                expect(engine.run('(funcall (car funs))').toString()).toBe('43');
            });
        });
    })
});
