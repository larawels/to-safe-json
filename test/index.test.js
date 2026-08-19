const assert = require('assert');
const toSafeJson = require('../src/index.js');

let passed = 0;
let failed = 0;

function test(description, actual, expected) {
    try {
        assert.strictEqual(actual, expected);
        console.log(`✅ ${description}`);
        passed++;
    } catch (e) {
        console.error(`❌ ${description}`);
        console.error(`   expected: ${expected}, got: ${actual}`);
        failed++;
    }
}

console.log('--- Arrays & Objects ---');
test('simple array', toSafeJson([1, 2, 3]), '[1,2,3]');
test('empty array', toSafeJson([]), '[]');
test('nested array', toSafeJson([[1, 2], [3, 4]]), '[[1,2],[3,4]]');
test('simple object', toSafeJson({ a: 1, b: 2 }), '{"a":1,"b":2}');
test('empty object', toSafeJson({}), '{}');
test('nested object', toSafeJson({ a: { b: 1 } }), '{"a":{"b":1}}');
test('array with mixed types', toSafeJson([1, 'a', true, null]), '[1,"a",true,null]');

console.log('\n--- Already valid JSON (passthrough) ---');
test('valid JSON array string stays unchanged', toSafeJson('[1,2,3]'), '[1,2,3]');
test('valid JSON object string stays unchanged', toSafeJson('{"a":1}'), '{"a":1}');
test('valid JSON string with surrounding whitespace gets trimmed', toSafeJson('  [1,2,3]  '), '[1,2,3]');
test('JSON "null" as string stays "null"', toSafeJson('null'), 'null');
test('JSON "true" as string stays "true"', toSafeJson('true'), 'true');
test('JSON "42" as string stays "42"', toSafeJson('42'), '42');

console.log('\n--- Plain strings (not JSON -> encoded as literal) ---');
test('plain string becomes a JSON string literal', toSafeJson('hello'), '"hello"');
test('string with special characters gets escaped', toSafeJson('say "hi"'), '"say \\"hi\\""');
test('empty string becomes an empty JSON string', toSafeJson(''), '""');
test('string that looks like broken JSON', toSafeJson('[1,2,'), '"[1,2,"');

console.log('\n--- Numbers ---');
test('integer', toSafeJson(42), '42');
test('float', toSafeJson(42.5), '42.5');
test('negative number', toSafeJson(-42), '-42');
test('0', toSafeJson(0), '0');
test('NaN -> fallback', toSafeJson(NaN), 'null');
test('Infinity -> fallback', toSafeJson(Infinity), 'null');
test('NaN with custom fallback', toSafeJson(NaN, '0'), '0');

console.log('\n--- Booleans ---');
test('true', toSafeJson(true), 'true');
test('false', toSafeJson(false), 'false');

console.log('\n--- null / undefined ---');
test('null', toSafeJson(null), 'null');
test('undefined -> fallback', toSafeJson(undefined), 'null');
test('undefined with custom fallback', toSafeJson(undefined, '{}'), '{}');

console.log('\n--- BigInt ---');
test('small BigInt becomes a number', toSafeJson(10n), '10');
test('BigInt within safe range', toSafeJson(9007199254740991n), '9007199254740991');
test('BigInt beyond safe range becomes a string literal', toSafeJson(10n ** 30n), '"' + (10n ** 30n).toString() + '"');
test('BigInt nested inside an object', toSafeJson({ id: 10n }), '{"id":10}');

console.log('\n--- Circular references ---');
const circular = {};
circular.self = circular;
test('circular field gets dropped', toSafeJson(circular), '{}');

const circularArray = [1, 2];
circularArray.push(circularArray);
test('circular array element becomes null', toSafeJson(circularArray), '[1,2,null]');

const nestedCircular = { a: 1, b: {} };
nestedCircular.b.self = nestedCircular.b;
test('nested circular field gets dropped', toSafeJson(nestedCircular), '{"a":1,"b":{}}');

console.log('\n--- Symbol / Function (top-level) ---');
test('top-level Symbol -> fallback', toSafeJson(Symbol('test')), 'null');
test('top-level Function -> fallback', toSafeJson(function () {}), 'null');

console.log('\n--- Symbol / Function (nested, standard JSON behavior) ---');
test('function inside an object gets dropped', toSafeJson({ a: 1, fn: function () {} }), '{"a":1}');
test('function inside an array becomes null', toSafeJson([1, function () {}, 2]), '[1,null,2]');

console.log('\n--- Custom fallback edge cases ---');
test('invalid fallback (not a string) resets to "null"', toSafeJson(undefined, 42), 'null');

console.log('\n--- Round-trip with to-safe-array (conceptual, using JSON.parse here) ---');
const original = [1, 2, 3];
const jsonString = toSafeJson(original);
test('toSafeJson(array) round-trips via JSON.parse back to the original', JSON.stringify(JSON.parse(jsonString)), JSON.stringify(original));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);