# Project

## description

This project implements a simple and limited LISP interpreter. 

This interpreter can be used from the command-line or it could be embedded in any nodejs project, using the LispEngine class.

## Points of interest

- no external dependencies
- immutable objects as much as possible
- handwritten scanner and parser
- extensible
- rich object model
- usage of generators
- code coverage >90%

## Lisp support

- based on common lisp
- case sensitive
- single threaded
- no support for classes
- lambda closures
- no lisp mutation allowed (functional style and will prevent circular references in Rust)

# Installation

`npm i`

# Run interpreter

## REPL

`npm start`

Note that the REPL has a menu to perform tasks such as:
- print history (.history)
- save commands (.save)
- restore commands (.load)
- exit from the REPL loop (.break)
- displays all builtins symbols or functions (.builtins)
- displays all global symbols that are not builtins (.symbols)

For debugging, you can print all function calls with:
`(debug-call (+ 2 (* 3 3) 2))`

This will produce the following output:
```
     <<< * : (3 3)
     >>> * : (3 3)  -->  9
   <<< + : (2 9 2)
   >>> + : (2 9 2)  -->  13
13
```

Or with a function call such as fibonacci:
```
> .load ../samples/fib.lisp
> (debug-calls (fib 3))
   <<< fib : (3)
     <<< if : ((< n 2) n (+ (fib (- n 1)) (fib (- n 2))))
       <<< < : (3 2)
       >>> < : (3 2)  -->  nil
           <<< - : (3 1)
           >>> - : (3 1)  -->  2
         <<< fib : (2)
           <<< if : ((< n 2) n (+ (fib (- n 1)) (fib (- n 2))))
             <<< < : (2 2)
             >>> < : (2 2)  -->  nil
                 <<< - : (2 1)
                 >>> - : (2 1)  -->  1
               <<< fib : (1)
                 <<< if : ((< n 2) n (+ (fib (- n 1)) (fib (- n 2))))
                   <<< < : (1 2)
                   >>> < : (1 2)  -->  t
                 >>> if : ((< n 2) n (+ (fib (- n 1)) (fib (- n 2))))  -->  1
               >>> fib : (1)  -->  1
                 <<< - : (2 2)
                 >>> - : (2 2)  -->  0
               <<< fib : (0)
                 <<< if : ((< n 2) n (+ (fib (- n 1)) (fib (- n 2))))
                   <<< < : (0 2)
                   >>> < : (0 2)  -->  t
                 >>> if : ((< n 2) n (+ (fib (- n 1)) (fib (- n 2))))  -->  0
               >>> fib : (0)  -->  0
             <<< + : (1 0)
             >>> + : (1 0)  -->  1
           >>> if : ((< n 2) n (+ (fib (- n 1)) (fib (- n 2))))  -->  1
         >>> fib : (2)  -->  1
           <<< - : (3 2)
           >>> - : (3 2)  -->  1
         <<< fib : (1)
           <<< if : ((< n 2) n (+ (fib (- n 1)) (fib (- n 2))))
             <<< < : (1 2)
             >>> < : (1 2)  -->  t
           >>> if : ((< n 2) n (+ (fib (- n 1)) (fib (- n 2))))  -->  1
         >>> fib : (1)  -->  1
       <<< + : (1 1)
       >>> + : (1 1)  -->  2
     >>> if : ((< n 2) n (+ (fib (- n 1)) (fib (- n 2))))  -->  2
   >>> fib : (3)  -->  2
2
```

If you want to know how many calls were executed, you can use `debug-stats` like this:
```
> .load ../samples/fib.lisp
> (debug-stats (fib 3))
(2 ((evalCount . 43) (evalSymbolCount . 12) (evalFunctionCallCount . 21) (evalNonEvaluableExprCount . 10)))
```

Finally, you can also measure the elapsed time of the execution of any expression like this:
```
(elapsed-time (fib 10))
(55 3)
```
The first value is the result of the invoked expression (fib 10), whereas the second value is the elapsed time in milliseconds.

## Eval single expression
```shell
npm run compile
node dist/main.js -c '(+ 2 2)'
```

## Import module and return the last evaluated expression

```shell
npm run compile
node dist/main.js some-module.lisp
```


# Develop

Run unit tests: `npm t`
