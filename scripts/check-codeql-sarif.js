'use strict';

const fs = require('node:fs');
const path = require('node:path');

const resultsDirectory = process.argv[2];
const threshold = Number.parseFloat(process.env.CODEQL_BLOCK_SEVERITY || '7.0');

if (!resultsDirectory || !fs.existsSync(resultsDirectory)) {
  console.error('CodeQL SARIF results directory was not found. Refusing to mark the SAST gate as passed.');
  process.exit(1);
}

function sarifFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sarifFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.sarif') ? [fullPath] : [];
  });
}

const files = sarifFiles(resultsDirectory);
if (files.length === 0) {
  console.error('No SARIF file was produced by CodeQL. Refusing to mark the SAST gate as passed.');
  process.exit(1);
}

const blocked = [];
for (const file of files) {
  let sarif;
  try {
    sarif = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`Could not parse ${file}: ${error.message}`);
    process.exit(1);
  }

  for (const run of sarif.runs || []) {
    const rules = new Map((run.tool?.driver?.rules || []).map((rule) => [rule.id, rule]));
    for (const result of run.results || []) {
      const rule = rules.get(result.ruleId);
      const severityText = result.properties?.['security-severity']
        ?? rule?.properties?.['security-severity']
        ?? '0';
      const severity = Number.parseFloat(String(severityText));
      if (Number.isFinite(severity) && severity >= threshold) {
        const location = result.locations?.[0]?.physicalLocation?.artifactLocation?.uri || 'unknown file';
        const line = result.locations?.[0]?.physicalLocation?.region?.startLine || '?';
        blocked.push({ ruleId: result.ruleId, severity, location, line, message: result.message?.text || '' });
      }
    }
  }
}

if (blocked.length > 0) {
  console.error(`CodeQL security gate failed: ${blocked.length} finding(s) at or above severity ${threshold}.`);
  for (const finding of blocked) {
    console.error(`${finding.location}:${finding.line} [${finding.ruleId}] severity=${finding.severity} ${finding.message}`);
  }
  process.exit(1);
}

console.log(`CodeQL security gate passed: no finding at or above severity ${threshold}.`);
