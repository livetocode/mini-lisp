import { LispEngine } from './engine';

describe('engine', () => {
    test('eval literal', () => {
        const engine = new LispEngine();
        expect(engine.run('33').toString()).toBe('33');
    });
    describe('arithmetic', () => {
        test('eval +', () => {
            const engine = new LispEngine();
            expect(engine.run('(+ 2 3)').toString()).toBe('5');
            expect(engine.run('(+ 2 3 4)').toString()).toBe('9');
            expect(engine.run('(+ 2 (+ 1 2) 4)').toString()).toBe('9');
        });            
        test('eval -', () => {
            const engine = new LispEngine();
            expect(engine.run('(- 2 3)').toString()).toBe('-1');
            expect(engine.run('(- 5 3 2)').toString()).toBe('0');
            expect(engine.run('(- 5 (- 6 3) 2)').toString()).toBe('0');
        });            
    });
});
