import fs from 'node:fs';
import path from 'node:path';

export default (filename: string) => fs.readFileSync(
  path.join(__dirname, 'fixtures', filename),
  'utf-8',
);
