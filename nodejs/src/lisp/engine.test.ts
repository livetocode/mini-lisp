import { LispEngine } from './engine';
import { Cons, UserFunction } from './types';

describe('engine', () => {
    let engine : LispEngine;

    beforeEach(() => {
        engine = new LispEngine();
    })

    test('eval literal', () => {
        expect(engine.run('33').toString()).toBe('33');
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
        test('inline lambda execution', () => {
            expect(engine.run('((lambda (x) (+ x x)) 3)').toString()).toBe('6');                        
        });
        test('lambda closure', () => {
            expect(engine.run(`
                (defun two-funs (x)
                    (list (function (lambda () x))
                        (function (lambda (y) (setq x y)))))`)).toBeInstanceOf(UserFunction);
            expect(engine.run('(setq funs (two-funs 6))')).toBeInstanceOf(Cons);
            expect(engine.run('(funcall (car funs))').toString()).toBe('6');
            expect(engine.run('(funcall (cadr funs) 43)').toString()).toBe('43');
            expect(engine.run('(funcall (car funs))').toString()).toBe('43');
        });
    })
});
