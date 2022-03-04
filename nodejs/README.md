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
