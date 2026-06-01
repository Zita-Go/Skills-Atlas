'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { detect } = require('../src/detect');

function tmpProject(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-detect-'));
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
  return dir;
}

test('react dep → web-frontend', () => {
  const dir = tmpProject({ 'package.json': JSON.stringify({ dependencies: { react: '^18', vite: '^5' } }) });
  assert.ok(detect(dir).archetypes.includes('web-frontend'));
});

test('express dep → backend-service', () => {
  const dir = tmpProject({ 'package.json': JSON.stringify({ dependencies: { express: '^4' } }) });
  assert.ok(detect(dir).archetypes.includes('backend-service'));
});

test('package.json bin → cli-library', () => {
  const dir = tmpProject({ 'package.json': JSON.stringify({ bin: { mytool: 'bin.js' } }) });
  assert.ok(detect(dir).archetypes.includes('cli-library'));
});

test('python pandas → data-ml', () => {
  const dir = tmpProject({ 'requirements.txt': 'pandas==2.0\nnumpy\n' });
  assert.ok(detect(dir).archetypes.includes('data-ml'));
});

test('Dockerfile / *.tf → infra-devops', () => {
  const dir = tmpProject({ 'Dockerfile': 'FROM node:18\n', 'main.tf': 'resource "x" "y" {}' });
  assert.ok(detect(dir).archetypes.includes('infra-devops'));
});

test('empty project → generic', () => {
  const dir = tmpProject({ 'README.md': '# hi' });
  assert.deepStrictEqual(detect(dir).archetypes, ['generic']);
});

test('fullstack: react + express → both archetypes', () => {
  const dir = tmpProject({ 'package.json': JSON.stringify({ dependencies: { react: '^18', express: '^4' } }) });
  const a = detect(dir).archetypes;
  assert.ok(a.includes('web-frontend') && a.includes('backend-service'));
});
