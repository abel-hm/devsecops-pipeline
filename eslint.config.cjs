'use strict';

const js = require('@eslint/js');

module.exports = [
  {
    files: ['src/**/*.js', 'test/**/*.js', 'scripts/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: {
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        test: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly'
      }
    },
    rules: {
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  }
];
