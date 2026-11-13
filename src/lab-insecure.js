'use strict';

const express = require('express');
const app = express();

app.get('/lab-eval', (req, res) => {
  const userInput = req.query.code;

  eval(userInput); // Intentionally insecure for the CodeQL lab

  res.send('Lab route executed');
});

module.exports = app;