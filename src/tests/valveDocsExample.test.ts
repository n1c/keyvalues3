import type { KV3Object } from '../types';
import { describe, expect, it } from 'vitest';
import { Parse } from '../parse';
import loadFixture from './loadFixture';

describe('valve Docs Example', () => {
  it('should parse the example file correctly', () => {
    const input = loadFixture('valve-docs-example.txt');
    const result = Parse<KV3Object>(input);

    expect(result.header).toEqual({
      encoding: 'e21c7f3c-8a33-41c5-9977-a76d3a32aa0d',
      format: '7412167c-06e9-4698-aff2-e63eb59037e7',
    });

    expect(result.object).toEqual({
      boolValue: false,
      intValue: 128,
      doubleValue: 64.0,
      stringValue: 'hello world',
      stringThatIsAResourceReference: 'particles/items3_fx/star_emblem.vpcf',
      multiLineStringValue:
        'First line of a multi-line string literal.\n'
        + 'Second line of a multi-line string literal.',
      arrayValue: [1, 2],
      objectValue: {
        n: 5,
        s: 'foo',
      },
    });
  });
});
