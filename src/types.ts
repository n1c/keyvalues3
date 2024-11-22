/** Represents all possible values in a KeyValues3 document */
export type KV3Value = string | number | boolean | KV3Value[] | KV3Object;

/** Represents a key-value object */
export interface KV3Object {
  [key: string]: KV3Value;
}

/** Header information for KV3 files */
export interface KV3Header {
  encoding: string;
  format: string;
}

export interface KV3Data {
  header: KV3Header;
  object: KV3Object;
}
