'use strict';

const fs = require('node:fs');
const path = require('node:path');

const sourceRoot = path.join(__dirname, '..', 'src');
const rules = [
  {
    id: 'no-eval',
    description: 'Use of eval() can execute attacker-controlled input.',
    pattern: /\beval\s*\(/g
  },
  {
    id: 'no-dynamic-function',
    description: 'Dynamic Function construction can execute attacker-controlled input.',
    pattern: /\bnew\s+Function\s*\(/g
  },
  {
    id: 'no-hardcoded-credential',
    description: 'A credential-like value appears to be hard-coded in source.',
    pattern: /\b(?:api[_-]?key|password|access[_-]?token|client[_-]?secret)\b\s*[:=]\s*(['"`])[^\n]{8,}?\1/gi
  }
];

function javascriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

const findings = [];
for (const file of javascriptFiles(sourceRoot)) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        findings.push({
          rule: rule.id,
          file: path.relative(path.join(__dirname, '..'), file),
          line: index + 1,
          description: rule.description
        });
      }
    }
  });
}

if (findings.length > 0) {
  console.error('SAST policy failed. Review and fix the following finding(s):');
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.rule}] ${finding.description}`);
  }
  process.exit(1);
}

console.log('SAST policy passed: no eval(), dynamic Function(), or hard-coded credential pattern found in src/.');
