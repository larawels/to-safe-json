# to-safe-json

Converts **any** JavaScript value into a JSON string, safely — never throws, even on circular references or BigInt.

## Installation

```bash
npm install to-safe-json
```

## Usage

```javascript
const toSafeJson = require('to-safe-json');

toSafeJson([1, 2, 3]);              // '[1,2,3]'
toSafeJson({ a: 1, b: 2 });         // '{"a":1,"b":2}'
toSafeJson('[1,2,3]');              // '[1,2,3]'        (already valid JSON, passed through)
toSafeJson('hello');                // '"hello"'        (plain string, encoded as JSON literal)
toSafeJson(42);                     // '42'
toSafeJson(null);                   // 'null'
toSafeJson(undefined);              // 'null'           (fallback)
toSafeJson(NaN);                    // 'null'           (fallback, JSON has no NaN)

const circular = {};
circular.self = circular;
toSafeJson(circular);               // '{}'             (circular field dropped, not thrown)

toSafeJson(undefined, '{}');        // '{}'             (custom fallback)
```

## Works well with `to-safe-array`

Both packages are designed to be inverses of each other:

```javascript
const arr = [1, 2, 3];
const json = toSafeJson(arr);       // '[1,2,3]'
// toSafeArray(json) would give back [1, 2, 3]
```

## Why not just `JSON.stringify(value)`?

- `JSON.stringify` throws on circular references — this library drops the circular field instead of crashing.
- `JSON.stringify` throws a `TypeError` on `BigInt` — this library converts it to a number (if safe) or a string.
- `JSON.stringify(undefined)` returns `undefined` (not a string) — this library always returns a string, falling back to `'null'`.
- A string that's already valid JSON is passed through as-is, instead of being double-encoded into an escaped string.

## API

### `toSafeJson(value: any, fallback?: string = 'null'): string`

Takes any value and always returns a valid JSON string — never throws.

- `fallback` — string returned when `value` can't be meaningfully converted (`undefined`, `NaN`, `Infinity`, a top-level function/symbol, or a fully circular value). Must itself be a string; otherwise it's silently reset to `'null'`.

## License

MIT © Toby Maxham