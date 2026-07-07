/* bundle.mjs: emits dist/threadspire.html, a single self-contained file.
   Run after build.mjs. */
import { readFileSync, writeFileSync } from 'fs';

const html = readFileSync('app/index.html', 'utf8');
const storage = readFileSync('storage.js', 'utf8');
const app = readFileSync('app/app.js', 'utf8');
const graph = readFileSync('dist/graph.json', 'utf8');

const out = html
  .replace('/*__STORAGE__*/', storage)
  .replace('/*__GRAPH__*/', 'window.THREADSPIRE_GRAPH=' + graph + ';')
  .replace('/*__APP__*/', app);

writeFileSync('dist/threadspire.html', out);
console.log('dist/threadspire.html written, ' + Math.round(out.length / 1024) + ' KB');
