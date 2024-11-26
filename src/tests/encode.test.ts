import type { KV3Data, KV3Header, KV3Object } from '../types';
import { describe, expect, it } from 'vitest';
import { Encode } from '../encode';
import loadFixture from './loadFixture';

describe('kV3 Encoder', () => {
  it('should encode a complex object correctly', () => {
    const data = {
      header: {
        encoding: '1.0',
        format: '1.0',
      } as KV3Header,
      object: {
        boolValue: false,
        intValue: 128,
        doubleValue: 64, // @TODO: We actually want this to be 64.00000
        stringValue: 'hello world',
        multiLineString: 'First line\nSecond line',
        arrayValue: [1, 2, 3],
        objectValue: {
          nested: 'value',
        },
      } as KV3Object,
    };

    const expected = `<!-- kv3 encoding:text:version{1.0} format:generic:version{1.0} -->
{
  boolValue = false
  intValue = 128
  doubleValue = 64
  stringValue = "hello world"
  multiLineString = """
First line
Second line
"""
  arrayValue =
  [
    1,
    2,
    3
  ]
  objectValue =
  {
    nested = "value"
  }
}`;

    const result = Encode(data, { indentChar: ' ', indent: 2 });
    expect(result).toBe(expected);
  });

  it('should handle objects', () => {
    const data = {
      objectValue: {
        n: 5,
        s: 'foo',
      },
    };

    const header = {
      encoding: 'dev-object',
      format: '164ad670-5642-43f5-a597-7346c0be2d1a',
    };

    const output = loadFixture('object.kv3');
    expect(Encode({ header, object: data })).toBe(output);
  });

  it('should handle empty objects', () => {
    const data = {
      header: {
        encoding: '1.0',
        format: '1.0',
      },
      object: {},
    };

    const expected = '<!-- kv3 encoding:text:version{1.0} format:generic:version{1.0} -->\n{}';

    expect(Encode(data)).toBe(expected);
  });

  it('should escape special characters in strings', () => {
    const data = {
      header: {
        encoding: '1.0',
        format: '1.0',
      },
      object: {
        escaped: 'string with "quotes" and \\ backslashes',
      },
    };

    const expected = [
      '<!-- kv3 encoding:text:version{1.0} format:generic:version{1.0} -->',
      '{',
      // eslint-disable-next-line style/no-tabs
      '	escaped = "string with \\"quotes\\" and \\\\ backslashes"',
      '}',
    ].join('\n');

    expect(Encode(data)).toBe(expected);
  });

  it('should quote keys with special characters', () => {
    const data = {
      header: {
        encoding: 'dev-keys',
        format: '13b4f4eb-abd8-4afa-82f9-70198f3dc8e4',
      },
      object: {
        'simple_key': 'value1',
        'quoted key': 'value2',
        'key-with-special-chars': 'value3',
      },
    };

    const expected = loadFixture('keys.kv3');

    expect(Encode(data)).toBe(expected);
  });

  it('should throw error for null or undefined values', () => {
    const data = {
      header: {
        encoding: '1.0',
        format: '1.0',
      },
      object: {
        nullValue: null,
      },
    } as unknown as KV3Data;

    expect(() => Encode(data)).toThrow('KV3 format does not support null or undefined values');
  });
});
