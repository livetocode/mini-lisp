import { Token, tokenize } from "./tokenizer";

function tokToList(text: string) {
    const result: Token[] = [];
    for (const tok of tokenize(text)) {
        result.push(tok);
    }
    return result;
}

describe('tokenize', () => {
    describe('white space', () => {
        test('empty string', () => {
            expect(tokToList("")).toEqual([]);
        });    
        test('whitespace string', () => {
            expect(tokToList("  \n  \r  \t ")).toEqual([]);
        });    
        test('comment only', () => {
            expect(tokToList("  ; some comment")).toEqual([]);
        });    
        test('simple int with comment after', () => {
            expect(tokToList("1 ; some comment")).toEqual([{type: 'number', value: '1'}]);
        });    
        test('simple int with comment before', () => {
            expect(tokToList("; some comment\n1")).toEqual([{type: 'number', value: '1'}]);
        });        
    });
    describe('integers', () => {
        test('simple int', () => {
            expect(tokToList("1")).toEqual([{type: 'number', value: '1'}]);
        });    
        test('simple positive int', () => {
            expect(tokToList("+1")).toEqual([{type: 'number', value: '+1'}]);
        });    
        test('simple negative int', () => {
            expect(tokToList("-1")).toEqual([{type: 'number', value: '-1'}]);
        });    
        test('big int', () => {
            expect(tokToList("1000000000")).toEqual([{type: 'number', value: '1000000000'}]);
        });    
    });
    describe('floats', () => {
        test('simple float', () => {
            expect(tokToList("1.2")).toEqual([{type: 'number', value: '1.2'}]);
        });    
        test('simple positive float', () => {
            expect(tokToList("+1.2")).toEqual([{type: 'number', value: '+1.2'}]);
        });    
        test('simple negative float', () => {
            expect(tokToList("-1.2")).toEqual([{type: 'number', value: '-1.2'}]);
        });   
    }); 
    describe('strings', () => {
        test('empty string', () => {
            expect(tokToList('""')).toEqual([{type: 'string', value: ''}]);
        });    
        test('simple string', () => {
            expect(tokToList('"a"')).toEqual([{type: 'string', value: 'a'}]);
        });    
        test('longer string', () => {
            expect(tokToList('"abcdef"')).toEqual([{type: 'string', value: 'abcdef'}]);
        });    
        test('string with spaces', () => {
            expect(tokToList('"foo bar foobar"')).toEqual([{type: 'string', value: 'foo bar foobar'}]);
        });    
        test('simple with escaped double quote', () => {
            expect(tokToList('"Hello \\"World\\"!"')).toEqual([{type: 'string', value: 'Hello "World"!'}]);
        });    
        test('string with white space', () => {
            expect(tokToList('"foo\\tbar\\nfoobar"')).toEqual([{type: 'string', value: 'foo\tbar\nfoobar'}]);
        });    
        test('simple with escaped backslash', () => {
            expect(tokToList('"Hello \\\\World!"')).toEqual([{type: 'string', value: 'Hello \\World!'}]);
        });    
    }); 
    describe('identifiers', ()=> {
        const identifiers = [
            ['a'],
            ['abc'],
            ['a.b'],
            ['a\\ b'],
            ['a\\nb'],
            ['Abc'],
            ['abc-def'],
            ['abc_def'],
            ['|a b|', 'a b'],
            ['|a\\|b|', 'a\\|b'],
            ['|a\\nb|', 'a\\nb'],
            ['+$'],
            ['1+'],
            ['file.rel.43'],
            ['\\('],
            ['\\)'],
            ['\\(\\)'],
            ['\\+1'],
            ['+\\1'],
            ['\\frobboz'],
            ['3.14159265\\s0']
        ];
        for (const [id, expected] of identifiers) {
            test(id, () => {
                expect(tokToList(id)).toEqual([{type: 'identifier', value: expected ?? id}]);
            });            
        }
        test('quoted identifier', () => {
            expect(tokToList("'foo")).toEqual([
                {type: 'symbol', value: "'"},
                {type: 'identifier', value: 'foo'},
            ]);
        });    
    });
    describe('lists', () => {
        test('empty list', () => {
            expect(tokToList('()')).toEqual([{type: 'symbol', value: '('}, {type: 'symbol', value: ')'}]);
        });    
        test('empty list with white space', () => {
            expect(tokToList('  (   )  ')).toEqual([{type: 'symbol', value: '('}, {type: 'symbol', value: ')'}]);
        });    
        test('quoted empty list', () => {
            expect(tokToList("'()")).toEqual([
                {type: 'symbol', value: "'"},
                {type: 'symbol', value: '('},
                {type: 'symbol', value: ')'},
            ]);
        });    
        test('single item', () => {
            expect(tokToList('(1)')).toEqual([
                {type: 'symbol', value: '('},
                {type: 'number', value: '1'},
                {type: 'symbol', value: ')'},
            ]);
        });    
        test('multipe items', () => {
            expect(tokToList("(1 2 'a 3.14)")).toEqual([
                {type: 'symbol', value: '('},
                {type: 'number', value: '1'},
                {type: 'number', value: '2'},
                {type: 'symbol', value: "'"},
                {type: 'identifier', value: 'a'},
                {type: 'number', value: '3.14'},
                {type: 'symbol', value: ')'},
            ]);
        });    
        test('inner list', () => {
            expect(tokToList("(1 2 (3 4) 5 6)")).toEqual([
                {type: 'symbol', value: '('},
                {type: 'number', value: '1'},
                {type: 'number', value: '2'},
                {type: 'symbol', value: '('},
                {type: 'number', value: '3'},
                {type: 'number', value: '4'},
                {type: 'symbol', value: ')'},
                {type: 'number', value: '5'},
                {type: 'number', value: '6'},
                {type: 'symbol', value: ')'},
            ]);
        });    
    }); 
});
