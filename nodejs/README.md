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
