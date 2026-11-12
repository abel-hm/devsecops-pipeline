'use strict';

const express = require('express');

const app = express();
app.use(express.json({ limit: '10kb' }));

const initialBooks = [
  { id: 1, title: 'The Pragmatic Programmer', author: 'David Thomas and Andrew Hunt' },
  { id: 2, title: 'Clean Code', author: 'Robert C. Martin' }
];

let books = [...initialBooks];
let nextBookId = 3;

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/books', (_req, res) => {
  res.status(200).json({ books });
});

app.post('/api/books', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const author = typeof req.body?.author === 'string' ? req.body.author.trim() : '';

  if (!title || !author) {
    return res.status(400).json({ error: 'Both title and author are required.' });
  }

  if (title.length > 120 || author.length > 120) {
    return res.status(400).json({ error: 'Title and author must be 120 characters or fewer.' });
  }

  const book = { id: nextBookId, title, author };
  nextBookId += 1;
  books.push(book);

  return res.status(201).json({ book });
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && Object.prototype.hasOwnProperty.call(err, 'body')) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }

  console.error('Unhandled request error:', err.message);
  return res.status(500).json({ error: 'Internal server error.' });
});

function resetBooks() {
  books = [...initialBooks];
  nextBookId = 3;
}

module.exports = { app, resetBooks };
