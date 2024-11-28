import type { KV3Object } from '../types';
import { describe, expect, it } from 'vitest';
import { Parse } from '../parse';
import loadFixture from './loadFixture';

describe('kV3 Parser', () => {
  it('parses a simple key-value file', () => {
    const input = loadFixture('simple.kv3');
    const output = Parse<KV3Object>(input);

    expect(output.header).toEqual({
      encoding: 'dev-simple',
      format: '453f4609-f822-41c7-95fd-8be0bc6edbd1',
    });

    expect(output.object).toEqual({
      name: 'Simple Example',
      version: 1,
      description: 'A simple KV3 file',
      boolValue: false,
      intValue: 128,
    });
  });

  it('parses numbers', () => {
    const input = loadFixture('numbers.kv3');
    const output = Parse<KV3Object>(input);

    expect(output.object).toEqual({
      normal: 123,
      negative: -123,
      decimal: 123.456,
    });
  });

  it('parses nested objects', () => {
    const input = loadFixture('nested.kv3');
    const output = Parse<KV3Object>(input);

    expect(output.header).toEqual({
      encoding: 'dev-nested',
      format: 'aedc7488-21da-46a1-8506-459ddb777479',
    });

    expect(output.object).toEqual({
      root: {
        child1: {
          value: 'nested value 1',
        },
        child2: {
          value: 'nested value 2',
        },
      },
    });
  });

  it('parses arrays', () => {
    const input = loadFixture('arrays.kv3');
    const output = Parse<KV3Object>(input);

    expect(output.object).toEqual({
      numbers: [1, 2, 3, 4, 5],
      strings: ['one', 'two', 'three'],
      mixed: [1, 'two', { key: 'value' }],
    });
  });

  it('parses objects', () => {
    const input = loadFixture('object.kv3');
    const output = Parse<KV3Object>(input);

    expect(output.object).toEqual({
      objectValue: { n: 5, s: 'foo' },
    });
  });

  it('handles comments and whitespace', () => {
    const input = loadFixture('comments.kv3');
    const output = Parse<KV3Object>(input);

    expect(output.object).toEqual({
      // The parsed object should ignore comments
      key1: 'value1',
      key2: 'value2',
    });
  });

  it('parses quoted and unquoted keys', () => {
    const input = loadFixture('keys.kv3');
    const output = Parse<KV3Object>(input);

    expect(output.object).toEqual({
      'simple_key': 'value1',
      'quoted key': 'value2',
      'key-with-special-chars': 'value3',
    });
  });

  it('handles escape sequences in strings', () => {
    const input = loadFixture('escaped.kv3');
    const output = Parse<KV3Object>(input);

    expect(output.object).toEqual({
      newlines: 'line1\nline2',
      tabs: 'value\twith\ttabs',
      quotes: 'String with "quotes"',
      backslash: 'path\\to\\file',
    });
  });

  it('throws error on invalid syntax', () => {
    const input = loadFixture('invalid.kv3');

    expect(() => Parse<KV3Object>(input)).toThrow();
  });
});
