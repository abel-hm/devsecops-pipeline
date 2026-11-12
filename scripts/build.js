'use strict';

const { spawnSync } = require('node:child_process');
const files = ['src/app.js', 'src/server.js'];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

console.log('Build check passed: both application entry files have valid Node.js syntax.');
