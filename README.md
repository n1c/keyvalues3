# Introduction

TypeScript library for parsing & encoding Valve's [KeyValues3](https://developer.valvesoftware.com/wiki/KeyValues3) data structure.

## TODO

Double values with all 0's after the decimal place aren't parsed correctly. e.g. `64.00000` is parsed to `64`.
