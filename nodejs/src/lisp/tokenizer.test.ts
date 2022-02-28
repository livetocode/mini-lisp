import { LispSyntaxException, LispUnterminatedExpressionException } from "./exceptions";
import { Token, tokenize } from "./tokenizer";

function tokToList(text: string) {
    const result: { type: string, value: string }[] = [];
    for (const tok of tokenize(text)) {
        result.push({ type: tok.type, value: tok.value });
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
        test('unterminated string', () => {
            expect(() => tokToList('"abcdef')).toThrow(LispUnterminatedExpressionException);
        });    
        test('string cut with cr/lf', () => {
            expect(() => tokToList('"abc\ndef"')).toThrow(LispSyntaxException);
        });    
        test('unterminated escaped char', () => {
            expect(() => tokToList('"abc\\')).toThrow(LispSyntaxException);
        });    
        test('unknown escaped char', () => {
            expect(() => tokToList('"abc\\a"')).toThrow(LispSyntaxException);
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
        test('unterminated identifier', () => {
            expect(() => tokToList('|abcdef')).toThrow(LispUnterminatedExpressionException);
        });    
        test('identifer cut with cr/lf', () => {
            expect(() => tokToList('|abc\ndef|')).toThrow(LispSyntaxException);
        });    
        test('unterminated escaped char', () => {
            expect(() => tokToList('|abc\\')).toThrow(LispSyntaxException);
            expect(() => tokToList('abc\\')).toThrow(LispSyntaxException);
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
    test('text segment positions', () => {
        const text = `;;; This is a sample script
(progn
    (setq foo '(1 2 3))
    (setq |foo bar| 33)
    (print (+ 
        (car foo) 
        -4.56 
        |foo bar|
        (1+ 1)
    ))
    (print "Hello \\"World\\"!\\nAnother line")
) ; end of script
        `;
        const tokens: Token[] = [];
        for (const token of tokenize(text)) {
            tokens.push(token);
        }
        // // Code generator for the assertions
        // const code: string[] = []
        // for (const tok of tokens) {
        //     code.push(`expect(tokens.shift()).toEqual(${JSON.stringify(tok)});`);
        // }
        // console.log(code.join('\n'));
  
        expect(tokens.shift()).toEqual({"type":"symbol","value":"(","from":{"index":28,"line":2,"col":1},"to":{"index":28,"line":2,"col":1}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"progn","from":{"index":29,"line":2,"col":2},"to":{"index":33,"line":2,"col":6}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"(","from":{"index":39,"line":3,"col":5},"to":{"index":39,"line":3,"col":5}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"setq","from":{"index":40,"line":3,"col":6},"to":{"index":43,"line":3,"col":9}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"foo","from":{"index":45,"line":3,"col":11},"to":{"index":47,"line":3,"col":13}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"'","from":{"index":49,"line":3,"col":15},"to":{"index":49,"line":3,"col":15}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"(","from":{"index":50,"line":3,"col":16},"to":{"index":50,"line":3,"col":16}});
        expect(tokens.shift()).toEqual({"type":"number","value":"1","from":{"index":51,"line":3,"col":17},"to":{"index":51,"line":3,"col":17}});
        expect(tokens.shift()).toEqual({"type":"number","value":"2","from":{"index":53,"line":3,"col":19},"to":{"index":53,"line":3,"col":19}});
        expect(tokens.shift()).toEqual({"type":"number","value":"3","from":{"index":55,"line":3,"col":21},"to":{"index":55,"line":3,"col":21}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":")","from":{"index":56,"line":3,"col":22},"to":{"index":56,"line":3,"col":22}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":")","from":{"index":57,"line":3,"col":23},"to":{"index":57,"line":3,"col":23}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"(","from":{"index":63,"line":4,"col":5},"to":{"index":63,"line":4,"col":5}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"setq","from":{"index":64,"line":4,"col":6},"to":{"index":67,"line":4,"col":9}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"foo bar","from":{"index":69,"line":4,"col":11},"to":{"index":77,"line":4,"col":19}});
        expect(tokens.shift()).toEqual({"type":"number","value":"33","from":{"index":79,"line":4,"col":21},"to":{"index":80,"line":4,"col":22}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":")","from":{"index":81,"line":4,"col":23},"to":{"index":81,"line":4,"col":23}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"(","from":{"index":87,"line":5,"col":5},"to":{"index":87,"line":5,"col":5}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"print","from":{"index":88,"line":5,"col":6},"to":{"index":92,"line":5,"col":10}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"(","from":{"index":94,"line":5,"col":12},"to":{"index":94,"line":5,"col":12}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"+","from":{"index":95,"line":5,"col":13},"to":{"index":95,"line":5,"col":13}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"(","from":{"index":106,"line":6,"col":9},"to":{"index":106,"line":6,"col":9}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"car","from":{"index":107,"line":6,"col":10},"to":{"index":109,"line":6,"col":12}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"foo","from":{"index":111,"line":6,"col":14},"to":{"index":113,"line":6,"col":16}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":")","from":{"index":114,"line":6,"col":17},"to":{"index":114,"line":6,"col":17}});
        expect(tokens.shift()).toEqual({"type":"number","value":"-4.56","from":{"index":125,"line":7,"col":9},"to":{"index":129,"line":7,"col":13}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"foo bar","from":{"index":140,"line":8,"col":9},"to":{"index":148,"line":8,"col":17}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"(","from":{"index":158,"line":9,"col":9},"to":{"index":158,"line":9,"col":9}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"1+","from":{"index":159,"line":9,"col":10},"to":{"index":160,"line":9,"col":11}});
        expect(tokens.shift()).toEqual({"type":"number","value":"1","from":{"index":162,"line":9,"col":13},"to":{"index":162,"line":9,"col":13}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":")","from":{"index":163,"line":9,"col":14},"to":{"index":163,"line":9,"col":14}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":")","from":{"index":169,"line":10,"col":5},"to":{"index":169,"line":10,"col":5}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":")","from":{"index":170,"line":10,"col":6},"to":{"index":170,"line":10,"col":6}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"(","from":{"index":176,"line":11,"col":5},"to":{"index":176,"line":11,"col":5}});
        expect(tokens.shift()).toEqual({"type":"identifier","value":"print","from":{"index":177,"line":11,"col":6},"to":{"index":181,"line":11,"col":10}});
        expect(tokens.shift()).toEqual({"type":"string","value":"Hello \"World\"!\nAnother line","from":{"index":183,"line":11,"col":12},"to":{"index":214,"line":11,"col":43}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":")","from":{"index":215,"line":11,"col":44},"to":{"index":215,"line":11,"col":44}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":")","from":{"index":217,"line":12,"col":1},"to":{"index":217,"line":12,"col":1}});  
    })
});
