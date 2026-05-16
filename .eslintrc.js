module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  plugins: ['@typescript-eslint', 'security', 'import'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-bad-norwegian-crypto': 'error',

    // Additional security best practices
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'require-atomic-updates': 'error',
    'no-floating-decimal': 'error',
    'no-prototype-builtins': 'error',

    // Import ordering
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        alphabetize: { order: 'asc' }
      }
    ],

    // TypeScript rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error'
  },
  env: {
    browser: true,
    node: true,
    es2020: true
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.config.js',
    'netlify/functions/dist/'
  ]
};
