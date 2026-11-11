// Syntax-check every module in src/ and tools/. Usage: node tools/check.js
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p);
  }
})(root + '/MathMob.Web/wwwroot/src');
for (const f of fs.readdirSync(root + '/tools')) if (f.endsWith('.js')) files.push(path.join(root, 'tools', f));

let bad = 0;
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
  catch (e) { bad++; console.error('FAIL', path.relative(root, f), '\n' + e.stderr); }
}
console.log(`${files.length} files checked, ${bad} failed`);
process.exit(bad ? 1 : 0);
