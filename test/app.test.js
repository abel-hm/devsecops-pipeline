'use strict';

const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const { app, resetBooks } = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

beforeEach(() => {
  resetBooks();
});

test('GET /health returns a healthy status', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: 'ok' });
});

test('GET /api/books returns the initial books', async () => {
  const response = await fetch(`${baseUrl}/api/books`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.books.length, 2);
  assert.equal(body.books[0].title, 'The Pragmatic Programmer');
});

test('POST /api/books creates a book', async () => {
  const response = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann' })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.book.id, 3);
  assert.equal(body.book.title, 'Designing Data-Intensive Applications');
});

test('POST /api/books rejects missing fields', async () => {
  const response = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'A title without an author' })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error, /required/i);
});
