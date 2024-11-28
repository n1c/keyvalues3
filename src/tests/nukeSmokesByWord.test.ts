import type { KV3Object } from '../types';
import { describe, expect, it } from 'vitest';
import { Parse } from '../parse';
import loadFixture from './loadFixture';

describe('nuke Smokes By Word', () => {
  it('should parse the example file correctly', () => {
    const input = loadFixture('nukesmokes-by-word.txt');
    const result = Parse<KV3Object>(input);

    expect(result.header).toEqual({
      encoding: 'e21c7f3c-8a33-41c5-9977-a76d3a32aa0d',
      format: '7412167c-06e9-4698-aff2-e63eb59037e7',
    });

    // @TODO: Add the actual data assert.
  });
});
