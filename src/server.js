'use strict';

const { app } = require('./app');

const port = Number.parseInt(process.env.PORT || '3000', 10);

app.listen(port, '0.0.0.0', () => {
  console.log(`Book API listening on port ${port}`);
});
