import type { KV3Header, KV3Object } from './types';

interface ParserState {
  pos: number;
  line: number;
  col: number;
  input: string;
}

export function Parse<T extends KV3Object>(input: string): { header: KV3Header; object: T } {
  const state: ParserState = {
    pos: 0,
    line: 1,
    col: 1,
    input,
  };

  function error(state: ParserState, message: string): never {
    const preview = state.input.slice(Math.max(0, state.pos - 20), state.pos + 20);

    throw new Error(
      `${message} at line ${state.line}, column ${state.col}\n`
      + `${preview}\n`
      + `${' '.repeat(Math.min(20, state.col - 1))}^`,
    );
  }

  function expect(state: ParserState, char: string): void {
    if (state.input[state.pos] !== char) {
      error(state, `Expected '${char}'`);
    }
    state.pos++;
    updatePosition(state, char);
  }

  function peek(state: ParserState): string {
    return state.input[state.pos];
  }

  function eof(state: ParserState): boolean {
    return state.pos >= state.input.length;
  }

  function updatePosition(state: ParserState, text: string): void {
    for (const char of text) {
      if (char === '\n') {
        state.line++;
        state.col = 1;
      } else {
        state.col++;
      }
    }
  }

  function skipWhitespace(state: ParserState): void {
    const wsPattern = /^\s+/;
    const commentPattern = /^(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)/;

    let matched: boolean;
    do {
      matched = false;

      // Skip whitespace
      const wsMatch = state.input.slice(state.pos).match(wsPattern);
      if (wsMatch) {
        updatePosition(state, wsMatch[0]);
        state.pos += wsMatch[0].length;
        matched = true;
      }

      // Skip comments
      const commentMatch = state.input.slice(state.pos).match(commentPattern);
      if (commentMatch) {
        updatePosition(state, commentMatch[0]);
        state.pos += commentMatch[0].length;
        matched = true;
      }
    } while (matched);
  }

  function parseHeader(state: ParserState): KV3Header {
    const headerPattern = /^<!--\s*kv3\s+encoding:text:version\{([^}]+)\}\s+format:generic:version\{([^}]+)\}\s*-->/;
    const match = state.input.slice(state.pos).match(headerPattern);

    if (!match) {
      error(state, 'Invalid KV3 header');
    }

    const [_, encoding, formatVer] = match;

    state.pos += match[0].length;
    updatePosition(state, match[0]);

    return {
      encoding,
      format: formatVer,
    };
  }

  function parseKey(state: ParserState): string {
    skipWhitespace(state);

    // Keys can be quoted or unquoted
    if (peek(state) === '"') {
      state.pos++; // Skip opening quote
      let key = '';
      while (!eof(state) && peek(state) !== '"') {
        key += state.input[state.pos];
        updatePosition(state, state.input[state.pos]);
        state.pos++;
      }

      if (eof(state)) {
        error(state, 'Unterminated string');
      }

      state.pos++; // Skip closing quote
      return key;
    } else {
      // Unquoted keys - read until whitespace or special characters
      const keyPattern = /^\w+/;
      const match = state.input.slice(state.pos).match(keyPattern);
      if (!match) {
        error(state, 'Invalid key');
      }

      updatePosition(state, match[0]);
      state.pos += match[0].length;
      return match[0];
    }
  }

  function parseMultilineString(state: ParserState): string {
    // Skip opening triple quotes
    state.pos += 3;
    updatePosition(state, '"""');

    let value = '';

    while (!eof(state)) {
      // Check for closing triple quotes
      if (state.input.slice(state.pos, state.pos + 3) === '"""') {
        state.pos += 3;
        updatePosition(state, '"""');
        return value.trim();
      }

      // Handle escape sequences
      if (peek(state) === '\\') {
        state.pos++; // Skip backslash
        value += parseEscapeSequence(state);
        continue;
      }

      // Add current character to value
      value += state.input[state.pos];
      updatePosition(state, state.input[state.pos]);
      state.pos++;
    }

    error(state, 'Unterminated multi-line string');
  }

  function parseString(state: ParserState): string {
    if (state.input.slice(state.pos, state.pos + 3) === '"""') {
      return parseMultilineString(state);
    }

    state.pos++; // Skip opening quote
    let value = '';

    while (!eof(state) && peek(state) !== '"') {
      if (peek(state) === '\\') {
        state.pos++; // Skip backslash
        value += parseEscapeSequence(state);
      } else {
        value += state.input[state.pos];
        updatePosition(state, state.input[state.pos]);
        state.pos++;
      }
    }

    if (eof(state)) {
      error(state, 'Unterminated string');
    }

    state.pos++; // Skip closing quote
    return value;
  }

  function parseArray(state: ParserState): any[] {
    state.pos++; // Skip opening bracket
    const array: any[] = [];

    while (!eof(state) && peek(state) !== ']') {
      skipWhitespace(state);
      array.push(parseValue(state));
      skipWhitespace(state);

      if (peek(state) === ',') {
        state.pos++;
        skipWhitespace(state);
      }
    }

    if (eof(state)) {
      error(state, 'Unterminated array');
    }

    state.pos++; // Skip closing bracket
    return array;
  }

  function parseNumber(state: ParserState): number {
    const numPattern = /^-?\d*\.?\d+(e[-+]?\d+)?/i;
    const match = state.input.slice(state.pos).match(numPattern);
    if (!match) {
      error(state, 'Invalid number');
    }

    updatePosition(state, match[0]);
    state.pos += match[0].length;

    return Number(match[0]);
  }

  function parseEscapeSequence(state: ParserState): string {
    const char = state.input[state.pos];
    updatePosition(state, char);
    state.pos++;

    switch (char) {
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      case '"': return '"';
      case '\\': return '\\';
      default: return char;
    }
  }

  function parseKeywordOrResource(state: ParserState): boolean | string {
    // First try to match a resource type prefix
    const resourcePrefixPattern = /^(resource|resourcename|panorama|soundevent|subclass):/i;
    const prefixMatch = state.input.slice(state.pos).match(resourcePrefixPattern);

    if (prefixMatch) {
      // Skip past the prefix and colon
      state.pos += prefixMatch[0].length;
      updatePosition(state, prefixMatch[0]);

      // Check if the path is quoted
      if (peek(state) === '"') {
        return parseString(state);
      }

      // Parse unquoted path
      const pathPattern = /^[\w/.]+/;
      const pathMatch = state.input.slice(state.pos).match(pathPattern);

      if (!pathMatch) {
        error(state, 'Invalid resource path');
      }

      updatePosition(state, pathMatch[0]);
      state.pos += pathMatch[0].length;

      // Return just the path without the prefix
      return pathMatch[0];
    }

    // If no resource prefix, try to match keywords (true/false) or simple identifiers
    const keywordPattern = /^[a-z_]\w*/i;
    const match = state.input.slice(state.pos).match(keywordPattern);

    if (!match) {
      error(state, 'Invalid keyword or resource reference');
    }

    const value = match[0];
    updatePosition(state, value);
    state.pos += value.length;

    // Handle boolean keywords
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    // Return simple identifier
    return value;
  }

  function parseValue(state: ParserState): any {
    skipWhitespace(state);

    const char = peek(state);

    if (char === '{') {
      return parseObject(state);
    } else if (char === '[') {
      return parseArray(state);
    } else if (char === '"') {
      return parseString(state);
    } else if (!Number.isNaN(Number(char)) || char === '-') {
      return parseNumber(state);
    } else {
      return parseKeywordOrResource(state);
    }

    // error(state, 'Invalid value');
  }

  function parseObject(state: ParserState): KV3Object {
    skipWhitespace(state);
    expect(state, '{');

    const obj: KV3Object = {};

    while (!eof(state)) {
      skipWhitespace(state);

      if (peek(state) === '}') {
        state.pos++;
        break;
      }

      const key = parseKey(state);
      skipWhitespace(state);
      expect(state, '=');
      skipWhitespace(state);
      const value = parseValue(state);

      obj[key] = value;
    }

    return obj;
  }

  skipWhitespace(state);
  const header = parseHeader(state);

  return {
    header,
    object: parseObject(state) as T,
  };
}
