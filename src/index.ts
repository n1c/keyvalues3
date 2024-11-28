/**
 * Encodes a KeyValues3 object into a string
 * @param data The KV3 data to encode
 * @returns The encoded KV3 string
 */
export { Encode } from './encode';

/**
 * Parses a KeyValues3 string into a typed object
 * @param input The KV3 string to parse
 * @returns The parsed KV3 data
 */
export { Parse } from './parse';

export { KV3Header, KV3Object, KV3Value } from './types';
