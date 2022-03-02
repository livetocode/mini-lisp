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
            expect(tokToList("  ; some comment")).toEqual([{type: 'comment', value: '; some comment'}]);
        });    
        test('simple int with comment after', () => {
            expect(tokToList("1 ; some comment")).toEqual([
                {type: 'integer', value: '1'},
                {type: 'comment', value: '; some comment'},
            ]);
        });    
        test('simple int with comment before', () => {
            expect(tokToList("; some comment\n1")).toEqual([
                {type: 'comment', value: '; some comment'},
                {type: 'integer', value: '1'},
            ]);
        });        
    });
    describe('integers', () => {
        test('simple int', () => {
            expect(tokToList("1")).toEqual([{type: 'integer', value: '1'}]);
        });    
        test('simple positive int', () => {
            expect(tokToList("+1")).toEqual([{type: 'integer', value: '+1'}]);
        });    
        test('simple negative int', () => {
            expect(tokToList("-1")).toEqual([{type: 'integer', value: '-1'}]);
        });    
        test('big int', () => {
            expect(tokToList("1000000000")).toEqual([{type: 'integer', value: '1000000000'}]);
        });    
        test('int followed by string', () => {
            expect(tokToList('123"abc"')).toEqual([
                {type: 'integer', value: '123'},
                {type: 'string', value: 'abc'},
            ]);
        });    
        test('int followed by (', () => {
            expect(tokToList('123(')).toEqual([
                {type: 'integer', value: '123'},
                {type: 'lpar', value: '('},
            ]);
        });    
    });
    describe('floats', () => {
        test('simple float', () => {
            expect(tokToList("1.2")).toEqual([{type: 'float', value: '1.2'}]);
        });    
        test('float without leading 0', () => {
            expect(tokToList(".2")).toEqual([{type: 'float', value: '.2'}]);
        });    
        test('simple positive float', () => {
            expect(tokToList("+1.2")).toEqual([{type: 'float', value: '+1.2'}]);
        });    
        test('simple negative float', () => {
            expect(tokToList("-1.2")).toEqual([{type: 'float', value: '-1.2'}]);
        });   
        test('exponent float', () => {
            expect(tokToList("1.2e3")).toEqual([{type: 'float', value: '1.2e3'}]);
        });    
        test('exponent positive float', () => {
            expect(tokToList("+1.2e3")).toEqual([{type: 'float', value: '+1.2e3'}]);
        });    
        test('exponent negative float', () => {
            expect(tokToList("-1.2e3")).toEqual([{type: 'float', value: '-1.2e3'}]);
        });   
        test('neg exponent float', () => {
            expect(tokToList("1.2e-3")).toEqual([{type: 'float', value: '1.2e-3'}]);
        });    
        test('neg exponent positive float', () => {
            expect(tokToList("+1.2e-3")).toEqual([{type: 'float', value: '+1.2e-3'}]);
        });    
        test('neg exponent negative float', () => {
            expect(tokToList("-1.2e-3")).toEqual([{type: 'float', value: '-1.2e-3'}]);
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
            expect(tokToList('"abc\ndef"')).toEqual([{type: 'string', value: 'abc\ndef'}]);
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
            ['a\\ b', 'a b'],
            ['a\\nb', 'anb'],
            ['Abc'],
            ['abc-def'],
            ['abc_def'],
            ['|abc'],
            ['abc|'],
            ['abc|def'],
            ['|abc|'],
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
            ['.'],
            ['-'],
            ['+'],
            ['e'],
            ['--1'],
            ['++1'],
            ['+-1'],
            ['-+1'],
            ['1-1'],
            ['1+1'],
            ['-1-1'],
            ['+1+1'],
            ['-1+1'],
            ['+1-1'],
            ['0..1'],
            ['0.1.2'],
            ['0.1-2'],
            ['0.1+2'],
            ['1e--1'],
            ['1e++1'],
            ['1e+-1'],
            ['1e-+1'],
            ['1ee2'],
            ['1EE2'],
            ['123a'],
            ['a123'],
            ['123,'],
            ['123|'],
        ];
        for (const [id, expected] of identifiers) {
            test(id, () => {
                expect(tokToList(id)).toEqual([{type: 'symbol', value: expected ?? id}]);
            });            
        }
        test('quoted identifier', () => {
            expect(tokToList("'foo")).toEqual([
                {type: 'quote', value: "'"},
                {type: 'symbol', value: 'foo'},
            ]);
        });    
        test('identifer cut with cr/lf', () => {
            expect(tokToList('|abc\ndef|')).toEqual([{type: 'symbol', value: '|abc'}, {type: 'symbol', value: 'def|'}]);
        });    
        test('unterminated escaped char', () => {
            expect(() => tokToList('|abc\\')).toThrow(LispSyntaxException);
            expect(() => tokToList('abc\\')).toThrow(LispSyntaxException);
        });    
    });
    describe('lists', () => {
        test('empty list', () => {
            expect(tokToList('()')).toEqual([{type: 'lpar', value: '('}, {type: 'rpar', value: ')'}]);
        });    
        test('empty list with white space', () => {
            expect(tokToList('  (   )  ')).toEqual([{type: 'lpar', value: '('}, {type: 'rpar', value: ')'}]);
        });    
        test('quoted empty list', () => {
            expect(tokToList("'()")).toEqual([
                {type: 'quote', value: "'"},
                {type: 'lpar', value: '('},
                {type: 'rpar', value: ')'},
            ]);
        });    
        test('single item', () => {
            expect(tokToList('(1)')).toEqual([
                {type: 'lpar', value: '('},
                {type: 'integer', value: '1'},
                {type: 'rpar', value: ')'},
            ]);
        });    
        test('multipe items', () => {
            expect(tokToList("(1 2 'a 3.14)")).toEqual([
                {type: 'lpar', value: '('},
                {type: 'integer', value: '1'},
                {type: 'integer', value: '2'},
                {type: 'quote', value: "'"},
                {type: 'symbol', value: 'a'},
                {type: 'float', value: '3.14'},
                {type: 'rpar', value: ')'},
            ]);
        });    
        test('inner list', () => {
            expect(tokToList("(1 2 (3 4) 5 6)")).toEqual([
                {type: 'lpar', value: '('},
                {type: 'integer', value: '1'},
                {type: 'integer', value: '2'},
                {type: 'lpar', value: '('},
                {type: 'integer', value: '3'},
                {type: 'integer', value: '4'},
                {type: 'rpar', value: ')'},
                {type: 'integer', value: '5'},
                {type: 'integer', value: '6'},
                {type: 'rpar', value: ')'},
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
        |foo\\ bar|
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
  
        expect(tokens.shift()).toEqual({"type":"comment","value":";;; This is a sample script","from":{"index":0,"line":1,"col":1},"to":{"index":27,"line":2,"col":0}});
        expect(tokens.shift()).toEqual({"type":"lpar","value":"(","from":{"index":28,"line":2,"col":1},"to":{"index":28,"line":2,"col":1}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"progn","from":{"index":29,"line":2,"col":2},"to":{"index":33,"line":2,"col":6}});
        expect(tokens.shift()).toEqual({"type":"lpar","value":"(","from":{"index":39,"line":3,"col":5},"to":{"index":39,"line":3,"col":5}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"setq","from":{"index":40,"line":3,"col":6},"to":{"index":43,"line":3,"col":9}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"foo","from":{"index":45,"line":3,"col":11},"to":{"index":47,"line":3,"col":13}});
        expect(tokens.shift()).toEqual({"type":"quote","value":"'","from":{"index":49,"line":3,"col":15},"to":{"index":49,"line":3,"col":15}});
        expect(tokens.shift()).toEqual({"type":"lpar","value":"(","from":{"index":50,"line":3,"col":16},"to":{"index":50,"line":3,"col":16}});
        expect(tokens.shift()).toEqual({"type":"integer","value":"1","from":{"index":51,"line":3,"col":17},"to":{"index":51,"line":3,"col":17}});
        expect(tokens.shift()).toEqual({"type":"integer","value":"2","from":{"index":53,"line":3,"col":19},"to":{"index":53,"line":3,"col":19}});
        expect(tokens.shift()).toEqual({"type":"integer","value":"3","from":{"index":55,"line":3,"col":21},"to":{"index":55,"line":3,"col":21}});
        expect(tokens.shift()).toEqual({"type":"rpar","value":")","from":{"index":56,"line":3,"col":22},"to":{"index":56,"line":3,"col":22}});
        expect(tokens.shift()).toEqual({"type":"rpar","value":")","from":{"index":57,"line":3,"col":23},"to":{"index":57,"line":3,"col":23}});
        expect(tokens.shift()).toEqual({"type":"lpar","value":"(","from":{"index":63,"line":4,"col":5},"to":{"index":63,"line":4,"col":5}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"setq","from":{"index":64,"line":4,"col":6},"to":{"index":67,"line":4,"col":9}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"|foo","from":{"index":69,"line":4,"col":11},"to":{"index":72,"line":4,"col":14}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"bar|","from":{"index":74,"line":4,"col":16},"to":{"index":77,"line":4,"col":19}});
        expect(tokens.shift()).toEqual({"type":"integer","value":"33","from":{"index":79,"line":4,"col":21},"to":{"index":80,"line":4,"col":22}});
        expect(tokens.shift()).toEqual({"type":"rpar","value":")","from":{"index":81,"line":4,"col":23},"to":{"index":81,"line":4,"col":23}});
        expect(tokens.shift()).toEqual({"type":"lpar","value":"(","from":{"index":87,"line":5,"col":5},"to":{"index":87,"line":5,"col":5}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"print","from":{"index":88,"line":5,"col":6},"to":{"index":92,"line":5,"col":10}});
        expect(tokens.shift()).toEqual({"type":"lpar","value":"(","from":{"index":94,"line":5,"col":12},"to":{"index":94,"line":5,"col":12}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"+","from":{"index":95,"line":5,"col":13},"to":{"index":95,"line":5,"col":13}});
        expect(tokens.shift()).toEqual({"type":"lpar","value":"(","from":{"index":106,"line":6,"col":9},"to":{"index":106,"line":6,"col":9}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"car","from":{"index":107,"line":6,"col":10},"to":{"index":109,"line":6,"col":12}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"foo","from":{"index":111,"line":6,"col":14},"to":{"index":113,"line":6,"col":16}});
        expect(tokens.shift()).toEqual({"type":"rpar","value":")","from":{"index":114,"line":6,"col":17},"to":{"index":114,"line":6,"col":17}});
        expect(tokens.shift()).toEqual({"type":"float","value":"-4.56","from":{"index":125,"line":7,"col":9},"to":{"index":129,"line":7,"col":13}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"|foo bar|","from":{"index":140,"line":8,"col":9},"to":{"index":149,"line":8,"col":18}});
        expect(tokens.shift()).toEqual({"type":"lpar","value":"(","from":{"index":159,"line":9,"col":9},"to":{"index":159,"line":9,"col":9}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"1+","from":{"index":160,"line":9,"col":10},"to":{"index":161,"line":9,"col":11}});
        expect(tokens.shift()).toEqual({"type":"integer","value":"1","from":{"index":163,"line":9,"col":13},"to":{"index":163,"line":9,"col":13}});
        expect(tokens.shift()).toEqual({"type":"rpar","value":")","from":{"index":164,"line":9,"col":14},"to":{"index":164,"line":9,"col":14}});
        expect(tokens.shift()).toEqual({"type":"rpar","value":")","from":{"index":170,"line":10,"col":5},"to":{"index":170,"line":10,"col":5}});
        expect(tokens.shift()).toEqual({"type":"rpar","value":")","from":{"index":171,"line":10,"col":6},"to":{"index":171,"line":10,"col":6}});
        expect(tokens.shift()).toEqual({"type":"lpar","value":"(","from":{"index":177,"line":11,"col":5},"to":{"index":177,"line":11,"col":5}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"print","from":{"index":178,"line":11,"col":6},"to":{"index":182,"line":11,"col":10}});
        expect(tokens.shift()).toEqual({"type":"string","value":"Hello \"World\"!\nAnother line","from":{"index":184,"line":11,"col":12},"to":{"index":215,"line":11,"col":43}});
        expect(tokens.shift()).toEqual({"type":"rpar","value":")","from":{"index":216,"line":11,"col":44},"to":{"index":216,"line":11,"col":44}});
        expect(tokens.shift()).toEqual({"type":"rpar","value":")","from":{"index":218,"line":12,"col":1},"to":{"index":218,"line":12,"col":1}});
        expect(tokens.shift()).toEqual({"type":"comment","value":"; end of script","from":{"index":220,"line":12,"col":3},"to":{"index":235,"line":13,"col":0}});
  
    });
    test('Cursor should skip cr/lf', () => {
        const tokens: Token[] = [];
        for (const token of tokenize('(+ 1 2\r\n   3 4)')) {
            tokens.push(token);
        }
        // // Code generator for the assertions
        // const code: string[] = []
        // for (const tok of tokens) {
        //     code.push(`expect(tokens.shift()).toEqual(${JSON.stringify(tok)});`);
        // }
        // console.log(code.join('\n'));

        expect(tokens.shift()).toEqual({"type":"lpar","value":"(","from":{"index":0,"line":1,"col":1},"to":{"index":0,"line":1,"col":1}});
        expect(tokens.shift()).toEqual({"type":"symbol","value":"+","from":{"index":1,"line":1,"col":2},"to":{"index":1,"line":1,"col":2}});
        expect(tokens.shift()).toEqual({"type":"integer","value":"1","from":{"index":3,"line":1,"col":4},"to":{"index":3,"line":1,"col":4}});
        expect(tokens.shift()).toEqual({"type":"integer","value":"2","from":{"index":5,"line":1,"col":6},"to":{"index":5,"line":1,"col":6}});
        expect(tokens.shift()).toEqual({"type":"integer","value":"3","from":{"index":11,"line":2,"col":4},"to":{"index":11,"line":2,"col":4}});
        expect(tokens.shift()).toEqual({"type":"integer","value":"4","from":{"index":13,"line":2,"col":6},"to":{"index":13,"line":2,"col":6}});
        expect(tokens.shift()).toEqual({"type":"rpar","value":")","from":{"index":14,"line":2,"col":7},"to":{"index":14,"line":2,"col":7}});
      })
});
