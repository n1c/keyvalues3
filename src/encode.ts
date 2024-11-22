import type { KV3Data, KV3Header, KV3Object } from './types';

interface EncodeOptions {
  indent?: number;
  initialIndent?: number;
  indentChar?: string;
}

export function Encode(data: KV3Data, options: EncodeOptions = {}): string {
  const indent = options.indent ?? 1;
  const initialIndent = options.initialIndent ?? 0;
  // eslint-disable-next-line style/no-tabs
  const indentChar = options.indentChar ?? '	';

  function encodeHeader(header: KV3Header): string {
    return `<!-- kv3 encoding:text:version{${header.encoding}} format:generic:version{${header.format}} -->`;
  }

  function encodeValue(value: any, level: number): string {
    if (value === null || value === undefined) {
      throw new Error('KV3 format does not support null or undefined values');
    }

    if (typeof value === 'string') {
      // Check if it's a multiline string
      if (value.includes('\n')) {
        return `"""\n${value}\n"""`;
      }
      return `"${escapeString(value)}"`;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (Array.isArray(value)) {
      return encodeArray(value, level);
    }

    if (typeof value === 'object') {
      return encodeObject(value, level);
    }

    throw new Error(`Unsupported value type: ${typeof value}`);
  }

  function escapeString(str: string): string {
    return str.replace(/[\\"]/g, '\\$&')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  function encodeArray(arr: any[], level: number): string {
    if (arr.length === 0)
      return '[]';

    const spaces = indentChar.repeat((level + 1) * indent);
    const elements = arr.map(item => `${spaces}${encodeValue(item, level + 1)}`);

    return `[\n${elements.join(',\n')}\n${indentChar.repeat(level * indent)}]`;
  }

  function encodeObject(obj: KV3Object, level: number): string {
    if (Object.keys(obj).length === 0)
      return '{}';

    const spaces = indentChar.repeat((level + 1) * indent);
    const entries = Object.entries(obj).map(([key, value]) => {
      const encodedKey = /^[a-z_]\w*$/i.test(key) ? key : `"${escapeString(key)}"`;
      return `${spaces}${encodedKey} = ${encodeValue(value, level + 1)}`;
    });

    return `{\n${entries.join('\n')}\n${indentChar.repeat(level * indent)}}`;
  }

  const header = encodeHeader(data.header);
  const body = encodeObject(data.object, initialIndent / indent);

  return `${header}\n${body}`;
}
