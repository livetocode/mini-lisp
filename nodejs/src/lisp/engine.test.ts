import { LispEngine } from './engine';

describe('engine', () => {
    test('eval literal', () => {
        const engine = new LispEngine();
        expect(engine.run('(1 2 3)').toString()).toBe('(1 2 3)');
    });
});
