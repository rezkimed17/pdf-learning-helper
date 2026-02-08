import { parseJSON } from '../lib/json';
import assert from 'assert';

console.log('Running JSON tests...');

// Test 1: Valid JSON
const valid = '{"foo": "bar"}';
assert.deepStrictEqual(parseJSON(valid), { foo: 'bar' });
console.log('✔ Valid JSON');

// Test 2: Markdown block
const markdown = 'Here is json:\n```json\n{"foo": "bar"}\n```';
assert.deepStrictEqual(parseJSON(markdown), { foo: 'bar' });
console.log('✔ Markdown block');

// Test 3: Markdown block without lang
const markdownNoLang = '```\n{"foo": "bar"}\n```';
assert.deepStrictEqual(parseJSON(markdownNoLang), { foo: 'bar' });
console.log('✔ Markdown no lang');

console.log('All tests passed!');
